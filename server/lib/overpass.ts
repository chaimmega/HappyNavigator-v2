import type { HappinessSignals } from "./types.js";

const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/**
 * Evenly sample up to `maxPoints` coordinates from a polyline,
 * always including the first AND last point so the full route is represented.
 */
export function sampleCoords(
  coords: [number, number][],
  maxPoints = 10
): [number, number][] {
  if (coords.length <= maxPoints) return coords;
  const step = (coords.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => coords[Math.round(i * step)]);
}

/**
 * Compute a bounding box string (south,west,north,east) from route coordinates
 * with a small buffer in degrees (~300m).
 */
function computeBbox(points: [number, number][], bufferDeg = 0.003): string {
  const lats = points.map(([, lat]) => lat);
  const lngs = points.map(([lng]) => lng);
  const s = Math.min(...lats) - bufferDeg;
  const w = Math.min(...lngs) - bufferDeg;
  const n = Math.max(...lats) + bufferDeg;
  const e = Math.max(...lngs) + bufferDeg;
  return `${s},${w},${n},${e}`;
}

/**
 * Build a compact Overpass QL query for driving-relevant happiness signals.
 * Uses a global bbox pre-filter + around corridor.
 *
 * Tag categories queried:
 *   Parks / gardens (scenic spots along route)
 *   Waterfront (rivers, lakes, coastline — scenic views while driving)
 *   Green land-use (forest, grass, meadow — pleasant surroundings)
 *   Scenic roads / tourism routes (viewpoints, attractions)
 *   Rest stops (cafes, restaurants, fuel, rest areas)
 *   Lit roads (well-lit for night driving)
 *   Low-traffic roads (residential, living streets, tracks)
 *   Construction zones (penalty)
 *   Motorways / trunk roads (penalty — stressful driving)
 */
function buildQuery(points: [number, number][], radiusM = 250): string {
  const coords = points.map(([lng, lat]) => `${lat},${lng}`).join(",");
  const around = `around:${radiusM},${coords}`;
  const bbox = computeBbox(points);

  return `[out:json][timeout:12][bbox:${bbox}];
(
  node["leisure"="park"](${around});
  way["leisure"="park"](${around});
  way["leisure"="garden"](${around});
  node["natural"="water"](${around});
  way["natural"="water"](${around});
  way["waterway"~"^(river|canal|stream|riverbank)$"](${around});
  way["natural"="coastline"](${around});
  way["landuse"~"^(forest|grass|meadow|village_green)$"](${around});
  way["natural"~"^(wood|scrub|heath)$"](${around});
  node["tourism"="viewpoint"](${around});
  node["tourism"="attraction"](${around});
  node["information"="guidepost"](${around});
  node["amenity"~"^(cafe|restaurant)$"](${around});
  node["amenity"="fuel"](${around});
  node["highway"="rest_area"](${around});
  node["amenity"="charging_station"](${around});
  way["highway"~"^(residential|living_street|unclassified)$"](${around});
  way["lit"="yes"](${around});
  way["highway"="construction"](${around});
  node["construction"](${around});
  way["highway"~"^(motorway|trunk)$"](${around});
);
out tags qt;`;
}

const EMPTY_SIGNALS: HappinessSignals = {
  parkCount: 0, waterfrontCount: 0, scenicRoadCount: 0, greenCount: 0,
  litCount: 0, lowTrafficCount: 0, constructionCount: 0,
  restStopCount: 0, viewpointCount: 0, highwayCount: 0,
  partial: true,
};

/**
 * Fetch from Overpass, trying fallback servers on failure.
 */
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

/**
 * Query OSM via Overpass for happiness signals along a driving route.
 * Degrades gracefully on timeout / rate-limit — returns zero counts with partial=true.
 */
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
    let waterfrontCount = 0;
    let scenicRoadCount = 0;
    let greenCount = 0;
    let litCount = 0;
    let lowTrafficCount = 0;
    let constructionCount = 0;
    let restStopCount = 0;
    let viewpointCount = 0;
    let highwayCount = 0;

    for (const el of elements) {
      const t = el.tags ?? {};

      // Parks and gardens
      if (t.leisure === "park" || t.leisure === "garden") parkCount++;

      // Waterfront — rivers, lakes, coastline
      if (t.natural === "water" || t.waterway || t.natural === "coastline") waterfrontCount++;

      // Green spaces — forests, meadows, grassland
      if (
        t.landuse === "forest" || t.landuse === "grass" ||
        t.landuse === "meadow" || t.landuse === "village_green" ||
        t.natural === "wood" || t.natural === "scrub" || t.natural === "heath"
      ) greenCount++;

      // Scenic / viewpoints / tourism
      if (
        t.tourism === "viewpoint" ||
        t.tourism === "attraction" ||
        t.information === "guidepost"
      ) viewpointCount++;

      // Rest stops — cafes, restaurants, fuel, rest areas, charging
      if (
        t.amenity === "cafe" || t.amenity === "restaurant" ||
        t.amenity === "fuel" || t.amenity === "charging_station" ||
        t.highway === "rest_area"
      ) restStopCount++;

      // Well-lit roads
      if (t.lit === "yes") litCount++;

      // Low-traffic / quiet roads (residential, living streets)
      if (
        t.highway === "residential" ||
        t.highway === "living_street" ||
        t.highway === "unclassified"
      ) lowTrafficCount++;

      // Scenic roads — roads near parks/water count, plus any road tagged scenic
      // (OSM doesn't have a standard "scenic" tag, so we proxy via tourism)
      if (t.highway && (t.tourism || t.scenic)) scenicRoadCount++;

      // Construction zones — penalty
      if (t.highway === "construction" || t.construction) constructionCount++;

      // Motorways / trunk roads — penalty (stressful, boring driving)
      if (t.highway === "motorway" || t.highway === "trunk") highwayCount++;
    }

    // Scenic road count: also add 1 for every viewpoint as proxy for scenic surroundings
    scenicRoadCount += viewpointCount;

    return {
      parkCount, waterfrontCount, scenicRoadCount, greenCount,
      litCount, lowTrafficCount, constructionCount,
      restStopCount, viewpointCount, highwayCount,
      partial: false,
    };
  } catch (err) {
    console.warn("[overpass] all servers failed (degrading gracefully):", err);
    return EMPTY_SIGNALS;
  }
}
