import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { geocode } from "./lib/nominatim.js";
import { getCanoeRoutes } from "./lib/osrm.js";
import { getHappinessSignals } from "./lib/overpass.js";
import { getRouteElevation } from "./lib/elevation.js";
import { computeHappyScore } from "./lib/happiness.js";
import { parseGoogleMapsUrl } from "./lib/parseGoogleMapsUrl.js";
import type { NavigateRequest, ScoredRoute, AIExplanation } from "./lib/types.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT ?? "3006", 10);

// ─── Rate limiter ────────────────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

// ─── Anthropic client ────────────────────────────────────────────────────────

let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _anthropic;
}

// ─── AI helper ───────────────────────────────────────────────────────────────

async function callAI(
  routes: ScoredRoute[],
  startName: string,
  endName: string
): Promise<AIExplanation | null> {
  const summary = routes.slice(0, 3).map((r) => ({
    id: r.id,
    distanceKm: (r.distance / 1000).toFixed(1),
    durationMin: Math.round(r.duration / 60),
    happyScore: r.happyScore,
    parks: r.signals.parkCount,
    water: r.signals.waterCount,
    waterways: r.signals.waterwayCount,
    greenSpaces: r.signals.greenCount,
    litSegments: r.signals.litCount,
    calmWater: r.signals.calmWaterCount,
    boatLaunches: r.signals.launchCount,
    portagePoints: r.signals.portageCount,
    motorBoatZones: r.signals.motorBoatCount,
    rapids: r.signals.rapidCount,
    elevationGainM: r.elevationGainM ?? null,
    partialData: r.signals.partial,
  }));

  const prompt = `You are an expert canoe route advisor. Analyse these candidate routes and pick the one that will give a paddler the happiest experience.

Route: ${startName} → ${endName}

Scored routes (all data per km, higher = better except penalties):
${JSON.stringify(summary, null, 2)}

Score factors: parks (+30 max), waterways (+25), water features (+20), green spaces (+15), calm water (+15), lighting (+10), launches (+8), portage points (+5). Penalties: motorboat zones (−12), rapids (−15), steep portage (−20). Partial data = 15% score reduction.

Instructions:
1. Choose the bestRouteId that you genuinely believe gives the happiest paddling experience. The numeric happyScore is a strong signal but you may override it if another route has clearly better qualitative factors (e.g. far more calm water, far fewer rapids, meaningfully less elevation, better launches) that the score under-weights.
2. Write 2–3 short, specific bullets explaining your pick (cite actual numbers: waterway count, park count, calm sections, rapids avoided, etc.).
3. Only add suggestedStops if the data strongly implies notable features (parks, launches, calm bays). Leave as [] if uncertain.
4. Be specific and factual — mention numbers from the data, not generic advice.

Respond with ONLY valid JSON:
{
  "bestRouteId": <number>,
  "bullets": ["<bullet 1>", "<bullet 2>"],
  "suggestedStops": []
}`;

  try {
    const msg = await getAnthropicClient().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text : "";
    return validateAIResponse(JSON.parse(stripFences(text)));
  } catch (err) {
    console.error("[ai] call failed:", err);
    return null;
  }
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();
}

function validateAIResponse(raw: unknown): AIExplanation | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.bestRouteId !== "number") return null;
  if (!Array.isArray(obj.bullets) || obj.bullets.length === 0) return null;
  return {
    bestRouteId: obj.bestRouteId,
    bullets: (obj.bullets as unknown[]).filter((b) => typeof b === "string") as string[],
    suggestedStops: Array.isArray(obj.suggestedStops)
      ? (obj.suggestedStops as unknown[]).filter((s) => typeof s === "string") as string[]
      : [],
  };
}

// ─── POST /api/navigate ──────────────────────────────────────────────────────

app.post("/api/navigate", async (req, res) => {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket.remoteAddress ?? "local";
  const isLocalhost = ip === "local" || ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
  if (!isLocalhost && isRateLimited(ip)) {
    res.status(429).json({ error: "Too many requests. Please wait a minute before trying again." });
    return;
  }

  const body: NavigateRequest = req.body;

  let startAddress = body.start?.trim();
  let endAddress = body.end?.trim();

  if (body.googleMapsUrl?.trim()) {
    const parsed = parseGoogleMapsUrl(body.googleMapsUrl.trim());
    if (parsed?.start && parsed?.end) {
      console.log("[navigate] parsed Google Maps URL:", parsed);
      startAddress = parsed.start;
      endAddress = parsed.end;
    } else {
      console.warn("[navigate] could not parse Google Maps URL, falling back to manual inputs");
    }
  }

  if (!startAddress && body.startCoords) startAddress = `${body.startCoords.lat},${body.startCoords.lng}`;
  if (!endAddress && body.endCoords) endAddress = `${body.endCoords.lat},${body.endCoords.lng}`;

  if (!startAddress || !endAddress) {
    res.status(400).json({ error: "Please provide both a start and end location." });
    return;
  }

  // 1. Geocode
  type GeoResult = { lat: number; lng: number; displayName: string };

  async function resolveLocation(
    address: string,
    preCoords?: { lat: number; lng: number }
  ): Promise<GeoResult | null> {
    if (preCoords) {
      const looksLikeCoords = /^-?\d+\.\d+\s*,\s*-?\d+\.\d+$/.test(address.trim());
      if (looksLikeCoords) {
        const revGeo = await geocode(`${preCoords.lat},${preCoords.lng}`);
        return { lat: preCoords.lat, lng: preCoords.lng, displayName: revGeo?.displayName ?? address };
      }
      return { lat: preCoords.lat, lng: preCoords.lng, displayName: address };
    }
    return geocode(address);
  }

  console.log(`[navigate] resolving: "${startAddress}" → "${endAddress}"`);
  const [startGeo, endGeo] = await Promise.all([
    resolveLocation(startAddress, body.startCoords),
    resolveLocation(endAddress, body.endCoords),
  ]);

  if (!startGeo) {
    res.status(400).json({ error: `Could not find location: "${startAddress}". Try selecting from the autocomplete suggestions.` });
    return;
  }
  if (!endGeo) {
    res.status(400).json({ error: `Could not find location: "${endAddress}". Try selecting from the autocomplete suggestions.` });
    return;
  }

  // 2. Resolve optional via-point
  let viaCoords: { lat: number; lng: number } | undefined;
  if (body.via?.text?.trim()) {
    const viaGeo = body.via.coords
      ? { lat: body.via.coords.lat, lng: body.via.coords.lng, displayName: body.via.text }
      : await geocode(body.via.text.trim());
    if (viaGeo) {
      viaCoords = { lat: viaGeo.lat, lng: viaGeo.lng };
      console.log(`[navigate] via-point resolved: ${body.via.text} → ${viaGeo.lat},${viaGeo.lng}`);
    }
  }

  // 3. Fetch routes
  let osrmRoutes;
  try {
    osrmRoutes = await getCanoeRoutes(
      { lat: startGeo.lat, lng: startGeo.lng },
      { lat: endGeo.lat, lng: endGeo.lng },
      viaCoords
    );
  } catch (err) {
    console.error("[navigate] routing error:", err);
    res.status(502).json({ error: "Could not fetch routes. The routing service may be temporarily unavailable." });
    return;
  }

  if (!osrmRoutes.length) {
    res.status(404).json({ error: "No routes found between these locations." });
    return;
  }

  // 4. Score each route
  console.log(`[navigate] scoring ${osrmRoutes.length} route(s) via Overpass + elevation...`);
  const scoredRoutes: ScoredRoute[] = await Promise.all(
    osrmRoutes.map(async (route, i) => {
      const [signals, elevResult] = await Promise.all([
        getHappinessSignals(route.geometry.coordinates),
        getRouteElevation(route.geometry.coordinates),
      ]);
      const distanceKm = route.distance / 1000;
      const { score: happyScore, breakdown: scoreBreakdown } = computeHappyScore(
        signals,
        distanceKm,
        elevResult?.gainM
      );
      console.log(`[navigate] route ${i}: score=${happyScore}, elevGain=${elevResult?.gainM ?? "n/a"}m`);
      return {
        id: i,
        geometry: route.geometry.coordinates,
        distance: route.distance,
        duration: route.duration,
        signals,
        happyScore,
        scoreBreakdown,
        elevationGainM: elevResult?.gainM,
        elevationPoints: elevResult?.elevationPoints,
      };
    })
  );

  scoredRoutes.sort((a, b) => b.happyScore - a.happyScore);

  // 5. AI explanation
  const shorten = (name: string) => name.split(",").slice(0, 2).join(",").trim();
  const startName = shorten(startGeo.displayName);
  const endName = shorten(endGeo.displayName);

  console.log("[navigate] calling AI for explanation...");
  const explanation = await callAI(scoredRoutes, startName, endName);

  const validIds = new Set(scoredRoutes.map((r) => r.id));
  const bestRouteId =
    explanation && validIds.has(explanation.bestRouteId)
      ? explanation.bestRouteId
      : scoredRoutes[0].id;

  res.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.json({
    routes: scoredRoutes,
    bestRouteId,
    explanation,
    startCoords: { lat: startGeo.lat, lng: startGeo.lng },
    endCoords: { lat: endGeo.lat, lng: endGeo.lng },
    startName,
    endName,
  });
});

// ─── GET /api/reverse ────────────────────────────────────────────────────────

app.get("/api/reverse", async (req, res) => {
  const lat = req.query.lat as string;
  const lng = req.query.lng as string;

  if (!lat || !lng) {
    res.status(400).json({ error: "Missing lat or lng" });
    return;
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum)) {
    res.status(400).json({ error: "Invalid coordinates" });
    return;
  }

  const result = await geocode(`${latNum},${lngNum}`);
  const fallback = `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}`;

  if (!result) {
    res.json({ name: fallback, lat: latNum, lng: lngNum });
    return;
  }

  const name = result.displayName.split(",").slice(0, 2).join(",").trim();
  res.set("Cache-Control", "public, max-age=3600");
  res.json({ name, lat: result.lat, lng: result.lng });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[server] Happy Navigator API running on http://localhost:${PORT}`);
});
