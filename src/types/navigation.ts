export interface Coordinates {
  lat: number;
  lng: number;
}

export interface HappinessSignals {
  parkCount: number;
  waterfrontCount: number;
  scenicRoadCount: number;
  greenCount: number;
  litCount: number;
  lowTrafficCount: number;
  constructionCount: number;
  restStopCount: number;
  viewpointCount: number;
  highwayCount: number;
  partial: boolean;
}

export interface ScoreBreakdown {
  parks: number;
  scenicRoads: number;
  waterfront: number;
  green: number;
  lit: number;
  lowTraffic: number;
  restStops: number;
  viewpoints: number;
  base: number;
  construction: number;
  elevation: number;
  highway: number;
}

export interface ScoredRoute {
  id: number;
  geometry: [number, number][];
  distance: number;
  duration: number;
  signals: HappinessSignals;
  happyScore: number;
  scoreBreakdown: ScoreBreakdown;
  elevationGainM?: number;
  elevationPoints?: number[];
}

export interface AIExplanation {
  bestRouteId: number;
  bullets: string[];
  suggestedStops?: string[];
}

export interface NavigateResponse {
  routes: ScoredRoute[];
  bestRouteId: number;
  explanation: AIExplanation | null;
  startCoords: Coordinates;
  endCoords: Coordinates;
  startName: string;
  endName: string;
}

export type ScoreTier = "scenic" | "okay" | "low";

export function getScoreTier(score: number): ScoreTier {
  if (score >= 70) return "scenic";
  if (score >= 40) return "okay";
  return "low";
}

export function formatDistance(meters: number, metric: boolean): string {
  if (metric) {
    const km = meters / 1000;
    return km < 0.1 ? "< 0.1 km" : `${km.toFixed(1)} km`;
  }
  const mi = meters / 1609.344;
  return mi < 0.1 ? "< 0.1 mi" : `${mi.toFixed(1)} mi`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return "< 1 min";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function formatElevation(meters: number, metric: boolean): string {
  if (metric) return `↑ ${Math.round(meters)} m`;
  return `↑ ${Math.round(meters * 3.28084)} ft`;
}

export function estimateCO2Saved(distanceMeters: number): number {
  return Math.round((distanceMeters / 1000) * 120);
}

export const ROUTE_COLORS = ["hsl(155, 75%, 42%)", "hsl(210, 90%, 55%)", "hsl(25, 95%, 55%)"];
export const ROUTE_NAMES = ["Route A", "Route B", "Route C"];
