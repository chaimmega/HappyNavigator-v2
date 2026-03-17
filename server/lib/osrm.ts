import type { Coordinates } from "./types.js";
import { createLRUCache } from "./lruCache.js";

const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
const DIRECTIONS_BASE = "https://maps.googleapis.com/maps/api/directions/json";

const routeCache = createLRUCache<OSRMRoute[]>(200, 2 * 60 * 60 * 1000);

export interface OSRMRoute {
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  distance: number;
  duration: number;
}

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

export async function getCanoeRoutes(
  start: Coordinates,
  end: Coordinates,
  via?: Coordinates
): Promise<OSRMRoute[]> {
  const cacheKey = `${start.lat.toFixed(5)},${start.lng.toFixed(5)}|${end.lat.toFixed(5)},${end.lng.toFixed(5)}${via ? `|${via.lat.toFixed(5)},${via.lng.toFixed(5)}` : ""}`;
  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    origin: `${start.lat},${start.lng}`,
    destination: `${end.lat},${end.lng}`,
    mode: "walking",
    alternatives: "true",
    key: API_KEY,
  });

  if (via) {
    params.set("waypoints", `${via.lat},${via.lng}`);
  }

  const url = `${DIRECTIONS_BASE}?${params.toString()}`;

  const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });

  if (!resp.ok) {
    throw new Error(`Google Directions responded with HTTP ${resp.status}`);
  }

  const data: any = await resp.json();

  if (data.status !== "OK" || !data.routes?.length) {
    throw new Error(`Google Directions error: ${data.status}`);
  }

  const routes = data.routes.slice(0, 3).map((route: any) => {
    const latLngPoints = decodePolyline(route.overview_polyline.points);
    const coordinates: [number, number][] = latLngPoints.map(([lat, lng]) => [lng, lat]);

    const distance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
    const duration = route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);

    return {
      geometry: { coordinates, type: "LineString" },
      distance,
      duration,
    };
  });

  routeCache.set(cacheKey, routes);
  return routes;
}
