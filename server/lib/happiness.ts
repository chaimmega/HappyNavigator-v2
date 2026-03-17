import type { HappinessSignals, ScoreBreakdown } from "./types.js";

const WEIGHTS = {
  parks:     { multiplier: 12, cap: 30 },
  waterways: { multiplier: 10, cap: 25 },
  water:     { multiplier: 8,  cap: 20 },
  green:     { multiplier: 5,  cap: 15 },
  lit:       { multiplier: 4,  cap: 10 },
  calmWater: { multiplier: 6,  cap: 15 },
  launch:    { multiplier: 3,  cap: 8  },
  portage:   { multiplier: 2,  cap: 5  },
  rapids:    { multiplier: 5,  cap: 15 },
  elevation: { multiplier: 3,  cap: 20 },
  motorBoat: { multiplier: 4,  cap: 12 },
} as const;

export function computeHappyScore(
  signals: HappinessSignals,
  distanceKm: number,
  elevationGainM?: number
): { score: number; breakdown: ScoreBreakdown } {
  const norm = Math.max(distanceKm, 0.5);

  const parks     = Math.min((signals.parkCount      / norm) * WEIGHTS.parks.multiplier,     WEIGHTS.parks.cap);
  const waterways = Math.min((signals.waterwayCount  / norm) * WEIGHTS.waterways.multiplier, WEIGHTS.waterways.cap);
  const water     = Math.min((signals.waterCount     / norm) * WEIGHTS.water.multiplier,     WEIGHTS.water.cap);
  const green     = Math.min((signals.greenCount     / norm) * WEIGHTS.green.multiplier,     WEIGHTS.green.cap);
  const lit       = Math.min((signals.litCount       / norm) * WEIGHTS.lit.multiplier,       WEIGHTS.lit.cap);
  const calmWater = Math.min((signals.calmWaterCount / norm) * WEIGHTS.calmWater.multiplier, WEIGHTS.calmWater.cap);
  const launch    = Math.min((signals.launchCount    / norm) * WEIGHTS.launch.multiplier,    WEIGHTS.launch.cap);
  const portage   = Math.min((signals.portageCount   / norm) * WEIGHTS.portage.multiplier,   WEIGHTS.portage.cap);
  const base      = 5;

  const rapids   = Math.min((signals.rapidCount     / norm) * WEIGHTS.rapids.multiplier,   WEIGHTS.rapids.cap);
  const elevation = elevationGainM != null
    ? Math.min((elevationGainM / norm) * WEIGHTS.elevation.multiplier, WEIGHTS.elevation.cap)
    : 0;
  const motorBoat = Math.min((signals.motorBoatCount / norm) * WEIGHTS.motorBoat.multiplier, WEIGHTS.motorBoat.cap);

  const raw   = base + parks + waterways + water + green + lit + calmWater + launch + portage
              - rapids - elevation - motorBoat;

  const adjusted = signals.partial ? Math.max(5, raw * 0.85) : raw;
  const score = Math.round(Math.max(0, Math.min(adjusted, 100)));

  return {
    score,
    breakdown: {
      parks:     Math.round(parks),
      waterways: Math.round(waterways),
      water:     Math.round(water),
      green:     Math.round(green),
      lit:       Math.round(lit),
      calmWater: Math.round(calmWater),
      launch:    Math.round(launch),
      portage:   Math.round(portage),
      base,
      rapids:    Math.round(rapids),
      elevation: Math.round(elevation),
      motorBoat: Math.round(motorBoat),
    },
  };
}
