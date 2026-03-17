import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ScoredRoute } from "@/types/navigation";
import { MapPin } from "lucide-react";

interface Stop {
  name: string;
  vicinity: string;
  photoUrl: string | null;
  rating?: number;
  types: string[];
  lat: number;
  lng: number;
}

interface SuggestedStopsProps {
  route: ScoredRoute;
}

const GOOD_TYPES = ["park", "tourist_attraction", "museum", "art_gallery", "cafe", "bakery", "natural_feature", "amusement_park", "aquarium", "zoo", "church", "library", "stadium"];
const EXCLUDE_TYPES = ["lodging", "hotel", "motel", "real_estate_agency", "insurance_agency", "lawyer", "dentist", "doctor", "bank", "atm", "gas_station", "car_dealer", "car_repair", "parking", "storage"];

function getStopEmoji(types: string[]): string {
  if (types.includes("park")) return "🌳";
  if (types.includes("tourist_attraction")) return "📸";
  if (types.includes("museum")) return "🏛️";
  if (types.includes("cafe")) return "☕";
  if (types.includes("restaurant")) return "🍴";
  if (types.includes("church") || types.includes("place_of_worship")) return "⛪";
  return "📍";
}

export function SuggestedStops({ route }: SuggestedStopsProps) {
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const searchedRouteId = useRef<number>(-1);

  useEffect(() => {
    if (searchedRouteId.current === route.id) return;
    if (typeof google === "undefined" || !google.maps?.places) return;

    searchedRouteId.current = route.id;
    setLoading(true);
    setStops([]);

    // Sample 3 points along the route (25%, 50%, 75%)
    const geo = route.geometry;
    const sampleIndices = [
      Math.floor(geo.length * 0.25),
      Math.floor(geo.length * 0.5),
      Math.floor(geo.length * 0.75),
    ];

    // Create a hidden map div for PlacesService
    const mapDiv = document.createElement("div");
    mapDiv.style.display = "none";
    document.body.appendChild(mapDiv);
    const dummyMap = new google.maps.Map(mapDiv);
    const service = new google.maps.places.PlacesService(dummyMap);

    const allStops: Stop[] = [];
    const seenPlaceIds = new Set<string>();
    let completed = 0;

    sampleIndices.forEach((idx) => {
      const [lng, lat] = geo[idx];
      service.nearbySearch(
        {
          location: { lat, lng },
          radius: 500,
          type: "point_of_interest",
        },
        (results, status) => {
          completed++;
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Filter for interesting places, skip generic ones
            const interesting = results
              .filter((p) => {
                if (!p.place_id || seenPlaceIds.has(p.place_id)) return false;
                if (!p.name || !p.vicinity) return false;
                // Prefer places with photos and good ratings
                const hasGoodType = p.types?.some((t) => PLACE_TYPES.includes(t));
                return hasGoodType || (p.rating && p.rating >= 4.0);
              })
              .slice(0, 2);

            interesting.forEach((p) => {
              seenPlaceIds.add(p.place_id!);
              let photoUrl: string | null = null;
              if (p.photos && p.photos.length > 0) {
                photoUrl = p.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 });
              }
              allStops.push({
                name: p.name!,
                vicinity: p.vicinity!,
                photoUrl,
                rating: p.rating,
                types: p.types || [],
                lat: p.geometry!.location!.lat(),
                lng: p.geometry!.location!.lng(),
              });
            });
          }

          if (completed === sampleIndices.length) {
            // Sort by rating, take top 4
            const sorted = allStops
              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
              .slice(0, 4);
            setStops(sorted);
            setLoading(false);
            // Clean up
            document.body.removeChild(mapDiv);
          }
        }
      );
    });
  }, [route]);

  if (!loading && stops.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Stops Along the Way
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          Finding interesting stops…
        </div>
      )}

      <div className="space-y-2">
        {stops.map((stop, i) => (
          <motion.div
            key={`${stop.name}-${i}`}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.08 * i }}
            className="flex gap-3 items-start rounded-xl bg-muted p-2 group hover:bg-accent transition-colors cursor-pointer"
            onClick={() => {
              window.open(
                `https://www.google.com/maps/search/?api=1&query=${stop.lat},${stop.lng}&query_place_id=${stop.name}`,
                "_blank"
              );
            }}
          >
            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-muted-foreground/10">
              {stop.photoUrl ? (
                <img
                  src={stop.photoUrl}
                  alt={stop.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl">
                  {getStopEmoji(stop.types)}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <p className="text-xs font-medium text-foreground leading-snug truncate">
                {stop.name}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug truncate">
                {stop.vicinity}
              </p>
              {stop.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-amber-500">★</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{stop.rating}</span>
                </div>
              )}
            </div>
            <MapPin className="shrink-0 h-3.5 w-3.5 text-muted-foreground mt-1" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
