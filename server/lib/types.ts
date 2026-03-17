export interface Coordinates {
  lat: number;
  lng: number;
}

/** Raw signals collected from OSM Overpass for a driving route */
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
  /** true when Overpass timed out / errored — scores are estimated */
  partial: boolean;
}

/** Per-category score contributions, each capped at their max */
export interface ScoreBreakdown {
  parks: number;        // 0–30
  scenicRoads: number;  // 0–25
  waterfront: number;   // 0–20
  green: number;        // 0–15
  lit: number;          // 0–10
  lowTraffic: number;   // 0–15
  restStops: number;    // 0–8
  viewpoints: number;   // 0–10
  base: number;         // always 5
  construction: number; // 0–15 (penalty)
  elevation: number;    // 0–15 (penalty)
  highway: number;      // 0–12 (penalty)
}

/** A route enriched with happiness data */
export interface ScoredRoute {
  id: number;
  /** [lng, lat] pairs — GeoJSON order */
  geometry: [number, number][];
  distance: number; // metres
  duration: number; // seconds
  signals: HappinessSignals;
  happyScore: number; // 0–100
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

export interface NavigateRequest {
  start?: string;
  end?: string;
  startCoords?: { lat: number; lng: number };
  endCoords?: { lat: number; lng: number };
  googleMapsUrl?: string;
  via?: { text: string; coords?: { lat: number; lng: number } };
}
