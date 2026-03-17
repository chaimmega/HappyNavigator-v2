import { createLRUCache } from "./lruCache.js";

const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
const GEOCODE_BASE = "https://maps.googleapis.com/maps/api/geocode/json";

export interface GeocodedLocation {
  lat: number;
  lng: number;
  displayName: string;
}

const cache = createLRUCache<GeocodedLocation | null>(500, 24 * 60 * 60 * 1000);

const COORD_RE = /^(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)$/;

export async function geocode(address: string): Promise<GeocodedLocation | null> {
  const coordMatch = address.trim().match(COORD_RE);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return reverseGeocode(lat, lng);
  }
  return forwardGeocode(address);
}

async function forwardGeocode(address: string): Promise<GeocodedLocation | null> {
  const cacheKey = `fwd:${address.toLowerCase().trim()}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  const url = `${GEOCODE_BASE}?address=${encodeURIComponent(address)}&key=${API_KEY}`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) {
      console.error("[geocode] HTTP error:", resp.status);
      return null;
    }
    const data: any = await resp.json();

    if (data.status !== "OK" || !data.results.length) {
      cache.set(cacheKey, null);
      return null;
    }

    const r = data.results[0];
    const result = {
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      displayName: r.formatted_address,
    };
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error("[geocode] fetch error:", err);
    return null;
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<GeocodedLocation | null> {
  const cacheKey = `rev:${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  const url = `${GEOCODE_BASE}?latlng=${lat},${lng}&key=${API_KEY}`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) {
      console.error("[geocode] reverse HTTP error:", resp.status);
      return null;
    }
    const data: any = await resp.json();

    if (data.status !== "OK" || !data.results.length) {
      cache.set(cacheKey, null);
      return null;
    }

    const r = data.results[0];
    const result = {
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      displayName: r.formatted_address,
    };
    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error("[geocode] reverse fetch error:", err);
    return null;
  }
}
