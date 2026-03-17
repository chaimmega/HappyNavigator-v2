import { motion } from "framer-motion";
import { ScoredRoute, formatDistance, formatDuration, formatElevation, ROUTE_NAMES, ROUTE_COLORS } from "@/types/navigation";
import { HappyScore } from "./HappyScore";
import { SuggestedStops } from "./SuggestedStops";
import { Download, Fuel } from "lucide-react";

interface RouteCardProps {
  route: ScoredRoute;
  isBest: boolean;
  isSelected: boolean;
  metric: boolean;
  onClick: () => void;
}

const signalChips = [
  { key: "parkCount", emoji: "🌳", label: "parks" },
  { key: "waterfrontCount", emoji: "💧", label: "waterfront" },
  { key: "scenicRoadCount", emoji: "🛣️", label: "scenic roads" },
  { key: "lowTrafficCount", emoji: "🚗", label: "low traffic" },
  { key: "greenCount", emoji: "🌿", label: "green" },
  { key: "restStopCount", emoji: "☕", label: "rest stops" },
  { key: "viewpointCount", emoji: "🏔️", label: "viewpoints" },
] as const;

export function RouteCard({ route, isBest, isSelected, metric, onClick }: RouteCardProps) {
  const routeColor = ROUTE_COLORS[route.id] || ROUTE_COLORS[0];
  const routeName = ROUTE_NAMES[route.id] || `Route ${route.id + 1}`;

  const topSignals = signalChips
    .filter((s) => (route.signals as any)[s.key] > 0)
    .slice(0, 3);

  const positiveBreakdown = [
    { key: "parks", color: "hsl(160, 84%, 39%)", label: "Parks" },
    { key: "scenicRoads", color: "hsl(217, 91%, 60%)", label: "Scenic Roads" },
    { key: "waterfront", color: "hsl(199, 89%, 48%)", label: "Waterfront" },
    { key: "green", color: "hsl(84, 85%, 50%)", label: "Green" },
    { key: "lowTraffic", color: "hsl(199, 95%, 74%)", label: "Low Traffic" },
    { key: "restStops", color: "hsl(172, 66%, 50%)", label: "Rest Stops" },
    { key: "viewpoints", color: "hsl(239, 84%, 67%)", label: "Viewpoints" },
    { key: "lit", color: "hsl(38, 92%, 50%)", label: "Well-Lit" },
    { key: "base", color: "hsl(220, 9%, 75%)", label: "Base" },
  ];

  const totalPositive = positiveBreakdown.reduce(
    (sum, s) => sum + ((route.scoreBreakdown as any)[s.key] || 0), 0
  );

  // Fuel cost estimate: 30 MPG, $3.80/gallon
  const fuelGallons = route.distance / 1000 / 1.609 / 30;
  const fuelCost = (fuelGallons * 3.80).toFixed(2);

  // Stress score from penalties
  const stressScore = Math.min(
    100,
    Math.round(
      ((route.scoreBreakdown.highway + route.scoreBreakdown.construction) / 27) * 100
    )
  );
  const stressLabel = stressScore <= 20 ? "Very Calm" : stressScore <= 50 ? "Moderate" : "Stressful";

  function handleExportGPX() {
    const coords = route.geometry;
    const gpxName = `${routeName} — Happy Navigator`;
    const trkpts = coords
      .map(([lng, lat]) => `    <trkpt lat="${lat}" lon="${lng}"></trkpt>`)
      .join("\n");
    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Happy Navigator" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${gpxName}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `happy-route-${routeName.split(" ")[1]?.toLowerCase() ?? "a"}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`cursor-pointer rounded-2xl border-2 transition-all ${
        isSelected
          ? "bg-card shadow-lg ring-1 ring-primary/10"
          : "border-transparent bg-card shadow-sm hover:shadow-md hover:border-primary/10"
      }`}
      style={isSelected ? { borderColor: routeColor + "40" } : {}}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-3.5 w-3.5 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: routeColor }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[15px] tracking-tight">{routeName}</span>
                {isBest && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                    Best Route ★
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="font-medium">{formatDistance(route.distance, metric)}</span>
                <span className="opacity-40">·</span>
                <span>{formatDuration(route.duration)}</span>
                {route.elevationGainM != null && (
                  <>
                    <span className="opacity-40">·</span>
                    <span className="text-amber">{formatElevation(route.elevationGainM, metric)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <HappyScore score={route.happyScore} size={isSelected ? "md" : "sm"} />
        </div>

        {/* Signal chips */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topSignals.map((s) => (
            <span key={s.key}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
            >
              {s.emoji} {(route.signals as any)[s.key]} {s.label}
            </span>
          ))}
          {!topSignals.length && route.signals.partial && (
            <span className="text-xs text-muted-foreground italic">Partial data</span>
          )}
        </div>

        {/* Expanded details */}
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t pt-3">
              {/* Score breakdown bar */}
              <div>
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  Score Breakdown
                </p>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  {positiveBreakdown.map((seg) => {
                    const val = (route.scoreBreakdown as any)[seg.key] || 0;
                    if (val <= 0) return null;
                    return (
                      <div key={seg.key} className="transition-all"
                        style={{ width: `${(val / totalPositive) * 100}%`, backgroundColor: seg.color }}
                        title={`${seg.label}: ${val}`} />
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {positiveBreakdown.map((seg) => {
                    const val = (route.scoreBreakdown as any)[seg.key] || 0;
                    if (val <= 0) return null;
                    return (
                      <span key={seg.key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: seg.color }} />
                        {seg.label} +{val}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Penalties */}
              {(route.scoreBreakdown.construction !== 0 || route.scoreBreakdown.elevation !== 0 || route.scoreBreakdown.highway !== 0) && (
                <div className="flex flex-wrap gap-2.5 text-[11px]">
                  {route.scoreBreakdown.construction !== 0 && (
                    <span className="text-orange-500">🚧 Construction -{route.scoreBreakdown.construction}</span>
                  )}
                  {route.scoreBreakdown.elevation !== 0 && (
                    <span className="text-amber">⛰️ Hilly -{route.scoreBreakdown.elevation}</span>
                  )}
                  {route.scoreBreakdown.highway !== 0 && (
                    <span className="text-destructive">🛣️ Highway -{route.scoreBreakdown.highway}</span>
                  )}
                </div>
              )}

              {/* All signals grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {signalChips.map((s) => {
                  const count = (route.signals as any)[s.key];
                  return (
                    <span key={s.key} className="flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[11px]">
                      {s.emoji} <span className="font-medium">{count}</span> {s.label}
                    </span>
                  );
                })}
              </div>

              {/* Fuel cost & Stress score */}
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1" title="Estimated fuel cost at 30 MPG, $3.80/gal">
                  <Fuel className="h-3 w-3 text-amber-500" />
                  ~${fuelCost} fuel est.
                </span>
                <span className="flex items-center gap-1" title="Drive stress based on highway and construction penalties">
                  🧘 {stressLabel} drive
                </span>
              </div>

              {/* Suggested stops from Google Places */}
              <SuggestedStops route={route} />

              {/* Export GPX */}
              <button
                onClick={(e) => { e.stopPropagation(); handleExportGPX(); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-accent py-2 text-xs font-medium text-primary transition-colors hover:bg-muted"
              >
                <Download className="h-3.5 w-3.5" />
                Export GPX
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
