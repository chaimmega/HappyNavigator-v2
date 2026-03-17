export function parseGoogleMapsUrl(
  url: string
): { start?: string; end?: string } | null {
  try {
    const u = new URL(url);

    if (!u.hostname.includes("google.com")) {
      return null;
    }

    const origin = u.searchParams.get("origin");
    const destination = u.searchParams.get("destination");
    if (origin && destination) {
      return { start: origin, end: destination };
    }

    const match = u.pathname.match(/\/maps\/dir\/(.*)/);
    if (match) {
      const parts = match[1]
        .split("/")
        .map((p) => decodeURIComponent(p).replace(/\+/g, " ").trim())
        .filter((p) => p && !p.startsWith("@"));

      if (parts.length >= 2) {
        return { start: parts[0], end: parts[parts.length - 1] };
      }
    }

    return null;
  } catch {
    return null;
  }
}
