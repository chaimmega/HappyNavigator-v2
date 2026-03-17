import { sampleCoords } from "./overpass.js";

const ELEV_BASE = "https://api.opentopodata.org/v1/srtm30m";
const SAMPLE_COUNT = 50;

export async function getRouteElevation(
  coords: [number, number][]
): Promise<{ elevationPoints: number[]; gainM: number } | null> {
  const sampled = sampleCoords(coords, SAMPLE_COUNT);

  const locations = sampled.map(([lng, lat]) => `${lat},${lng}`).join("|");
  const url = `${ELEV_BASE}?locations=${encodeURIComponent(locations)}`;

  try {
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: "application/json" },
    });

    if (!resp.ok) {
      console.warn("[elevation] HTTP error:", resp.status);
      return null;
    }

    const data: any = await resp.json();

    if (data.status !== "OK" || !data.results?.length) {
      console.warn("[elevation] unexpected response status:", data.status);
      return null;
    }

    const elevationPoints = data.results
      .map((r: any) => r.elevation)
      .filter((e: any): e is number => e != null);

    if (elevationPoints.length < 2) return null;

    let gainM = 0;
    for (let i = 1; i < elevationPoints.length; i++) {
      const delta = elevationPoints[i] - elevationPoints[i - 1];
      if (delta > 0) gainM += delta;
    }

    return { elevationPoints, gainM };
  } catch (err) {
    console.warn("[elevation] request failed (degrading gracefully):", err);
    return null;
  }
}
