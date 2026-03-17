import type { HappinessSignals, ScoreBreakdown } from "./types.js";

/**
 * Weights for scoring a driving route on "happiness" factors.
 *
 * Positive contributors (max pts):
 *   Base            →  5 pts  (any routable path)
 *   Parks           → 30 pts  (shade, scenery, pleasant surroundings)
 *   Scenic Roads    → 25 pts  (viewpoints, tourism routes, scenic tags)
 *   Waterfront      → 20 pts  (rivers, lakes, coastline — scenic views)
 *   Green           → 15 pts  (forests, meadows along the route)
 *   Low Traffic     → 15 pts  (quiet residential / living streets)
 *   Lit             → 10 pts  (well-lit roads, safer night driving)
 *   Rest Stops      →  8 pts  (cafes, fuel, rest areas, charging)
 *   Viewpoints      → 10 pts  (tourism viewpoints, attractions)
 *
 * Penalties (max deduction):
 *   Construction    → −15 pts  (active construction zones)
 *   Elevation       → −15 pts  (steep, winding roads)
 *   Highway         → −12 pts  (motorways/trunk — boring, stressful)
 */
const WEIGHTS = {
  parks:        { multiplier: 12, cap: 30 },
  scenicRoads:  { multiplier: 10, cap: 25 },
  waterfront:   { multiplier: 8,  cap: 20 },
  green:        { multiplier: 5,  cap: 15 },
  lowTraffic:   { multiplier: 6,  cap: 15 },
  lit:          { multiplier: 4,  cap: 10 },
  restStops:    { multiplier: 3,  cap: 8  },
  viewpoints:   { multiplier: 5,  cap: 10 },
  construction: { multiplier: 5,  cap: 15 },
  elevation:    { multiplier: 2,  cap: 15 },
  highway:      { multiplier: 4,  cap: 12 },
} as const;

export function computeHappyScore(
  signals: HappinessSignals,
  distanceKm: number,
  elevationGainM?: number
): { score: number; breakdown: ScoreBreakdown } {
  const norm = Math.max(distanceKm, 0.5);

  const parks       = Math.min((signals.parkCount        / norm) * WEIGHTS.parks.multiplier,       WEIGHTS.parks.cap);
  const scenicRoads = Math.min((signals.scenicRoadCount  / norm) * WEIGHTS.scenicRoads.multiplier, WEIGHTS.scenicRoads.cap);
  const waterfront  = Math.min((signals.waterfrontCount  / norm) * WEIGHTS.waterfront.multiplier,  WEIGHTS.waterfront.cap);
  const green       = Math.min((signals.greenCount       / norm) * WEIGHTS.green.multiplier,       WEIGHTS.green.cap);
  const lowTraffic  = Math.min((signals.lowTrafficCount  / norm) * WEIGHTS.lowTraffic.multiplier,  WEIGHTS.lowTraffic.cap);
  const lit         = Math.min((signals.litCount         / norm) * WEIGHTS.lit.multiplier,         WEIGHTS.lit.cap);
  const restStops   = Math.min((signals.restStopCount    / norm) * WEIGHTS.restStops.multiplier,   WEIGHTS.restStops.cap);
  const viewpoints  = Math.min((signals.viewpointCount   / norm) * WEIGHTS.viewpoints.multiplier,  WEIGHTS.viewpoints.cap);
  const base        = 5;

  // Penalties
  const construction = Math.min((signals.constructionCount / norm) * WEIGHTS.construction.multiplier, WEIGHTS.construction.cap);
  const elevation    = elevationGainM != null
    ? Math.min((elevationGainM / norm) * WEIGHTS.elevation.multiplier, WEIGHTS.elevation.cap)
    : 0;
  const highway      = Math.min((signals.highwayCount      / norm) * WEIGHTS.highway.multiplier,      WEIGHTS.highway.cap);

  const raw = base + parks + scenicRoads + waterfront + green + lowTraffic + lit + restStops + viewpoints
            - construction - elevation - highway;

  // Partial OSM data reduces confidence — apply 15% penalty, floor at 5
  const adjusted = signals.partial ? Math.max(5, raw * 0.85) : raw;
  const score = Math.round(Math.max(0, Math.min(adjusted, 100)));

  return {
    score,
    breakdown: {
      parks:        Math.round(parks),
      scenicRoads:  Math.round(scenicRoads),
      waterfront:   Math.round(waterfront),
      green:        Math.round(green),
      lowTraffic:   Math.round(lowTraffic),
      lit:          Math.round(lit),
      restStops:    Math.round(restStops),
      viewpoints:   Math.round(viewpoints),
      base,
      construction: Math.round(construction),
      elevation:    Math.round(elevation),
      highway:      Math.round(highway),
    },
  };
}
