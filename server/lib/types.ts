export interface Coordinates {
  lat: number;
  lng: number;
}

export interface HappinessSignals {
  parkCount: number;
  waterCount: number;
  waterwayCount: number;
  greenCount: number;
  litCount: number;
  calmWaterCount: number;
  rapidCount: number;
  launchCount: number;
  portageCount: number;
  motorBoatCount: number;
  partial: boolean;
}

export interface ScoreBreakdown {
  parks: number;
  waterways: number;
  water: number;
  green: number;
  lit: number;
  calmWater: number;
  launch: number;
  portage: number;
  base: number;
  rapids: number;
  elevation: number;
  motorBoat: number;
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

export interface NavigateRequest {
  start?: string;
  end?: string;
  startCoords?: { lat: number; lng: number };
  endCoords?: { lat: number; lng: number };
  googleMapsUrl?: string;
  via?: { text: string; coords?: { lat: number; lng: number } };
}
