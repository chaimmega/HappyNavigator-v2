import type { HappinessSignals } from "./types.js";

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export function sampleCoords(
  coords: [number, number][],
  maxPoints = 10
): [number, number][] {
  if (coords.length <= maxPoints) return coords;
  const step = (coords.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => coords[Math.round(i * step)]);
}

function computeBbox(points: [number, number][], bufferDeg = 0.003): string {
  const lats = points.map(([, lat]) => lat);
  const lngs = points.map(([lng]) => lng);
  const s = Math.min(...lats) - bufferDeg;
  const w = Math.min(...lngs) - bufferDeg;
  const n = Math.max(...lats) + bufferDeg;
  const e = Math.max(...lngs) + bufferDeg;
  return `${s},${w},${n},${e}`;
}

function buildQuery(points: [number, number][], radiusM = 250): string {
  const coords = points.map(([lng, lat]) => `${lat},${lng}`).join(",");
  const around = `around:${radiusM},${coords}`;
  const bbox = computeBbox(points);

  return `[out:json][timeout:12][bbox:${bbox}];
(
  node["leisure"="park"](${around});
  way["leisure"="park"](${around});
  way["leisure"="garden"](${around});
  way["landuse"~"^(forest|grass|meadow|village_green)$"](${around});
  way["natural"~"^(wood|scrub|heath)$"](${around});
  node["natural"="water"](${around});
  way["natural"="water"](${around});
  way["waterway"~"^(river|canal|stream|drain|riverbank)$"](${around});
  node["leisure"="slipway"](${around});
  way["leisure"="slipway"](${around});
  node["canoe"~"^(put_in|portage|yes)$"](${around});
  node["portage"="yes"](${around});
  way["lit"="yes"](${around});
  node["whitewater:rapid_grade"](${around});
  way["motorboat"~"^(yes|designated)$"](${around});
);
out tags qt;`;
}

const EMPTY_SIGNALS: HappinessSignals = {
  parkCount: 0, waterCount: 0, waterwayCount: 0, greenCount: 0,
  litCount: 0, calmWaterCount: 0, rapidCount: 0,
  launchCount: 0, portageCount: 0, motorBoatCount: 0,
  partial: true,
};

async function fetchOverpass(query: string): Promise<Response> {
  let lastErr: unknown;
  for (const server of OVERPASS_SERVERS) {
    try {
      const resp = await fetch(server, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(14000),
      });
      if (resp.ok) return resp;
      lastErr = new Error(`HTTP ${resp.status} from ${server}`);
    } catch (err) {
      lastErr = err;
      console.warn(`[overpass] ${server} failed, trying next...`, err);
    }
  }
  throw lastErr;
}

export async function getHappinessSignals(
  coords: [number, number][]
): Promise<HappinessSignals> {
  const sampled = sampleCoords(coords, 10);
  const query = buildQuery(sampled);

  try {
    const resp = await fetchOverpass(query);
    const rawText = await resp.text();
    const data: any = JSON.parse(rawText);

    if (!data.elements || data.remark?.includes("error")) {
      console.warn("[overpass] unexpected response:", data.remark ?? "no elements field");
      return EMPTY_SIGNALS;
    }

    const elements = data.elements;
    console.log(`[overpass] ${elements.length} elements returned`);

    let parkCount = 0;
    let waterCount = 0;
    let waterwayCount = 0;
    let greenCount = 0;
    let litCount = 0;
    let calmWaterCount = 0;
    let rapidCount = 0;
    let launchCount = 0;
    let portageCount = 0;
    let motorBoatCount = 0;

    for (const el of elements) {
      const t = el.tags ?? {};

      if (t.leisure === "park" || t.leisure === "garden") parkCount++;

      if (
        t.landuse === "forest" || t.landuse === "grass" ||
        t.landuse === "meadow" || t.landuse === "village_green" ||
        t.natural === "wood" || t.natural === "scrub" || t.natural === "heath"
      ) greenCount++;

      if (t.natural === "water" || t.waterway) waterCount++;
      if (t.waterway) waterwayCount++;
      if (t.natural === "water") calmWaterCount++;
      if (t.lit === "yes") litCount++;

      if (
        t.leisure === "slipway" ||
        t.canoe === "put_in" ||
        t.canoe === "yes"
      ) launchCount++;

      if (t.portage === "yes" || t.canoe === "portage") portageCount++;
      if (t["whitewater:rapid_grade"]) rapidCount++;
      if (t.motorboat === "yes" || t.motorboat === "designated") motorBoatCount++;
    }

    return {
      parkCount, waterCount, waterwayCount, greenCount,
      litCount, calmWaterCount, rapidCount,
      launchCount, portageCount, motorBoatCount,
      partial: false,
    };
  } catch (err) {
    console.warn("[overpass] all servers failed (degrading gracefully):", err);
    return EMPTY_SIGNALS;
  }
}
