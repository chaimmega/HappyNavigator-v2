import { ScoredRoute, ROUTE_COLORS, ROUTE_NAMES } from "@/types/navigation";
import { Coordinates } from "@/types/navigation";
import { motion } from "framer-motion";

interface MapViewProps {
  routes: ScoredRoute[];
  selectedRouteId: number;
  startCoords: Coordinates;
  endCoords: Coordinates;
  startName: string;
  endName: string;
  onSelectRoute: (id: number) => void;
}

export function MapView({ routes, selectedRouteId, startCoords, endCoords, startName, endName, onSelectRoute }: MapViewProps) {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  routes.forEach((r) => r.geometry.forEach(([lng, lat]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }));

  const padLat = (maxLat - minLat) * 0.18;
  const padLng = (maxLng - minLng) * 0.18;
  minLat -= padLat; maxLat += padLat;
  minLng -= padLng; maxLng += padLng;

  const width = 800;
  const height = 600;

  const project = (lng: number, lat: number): [number, number] => {
    const x = ((lng - minLng) / (maxLng - minLng)) * width;
    const y = ((maxLat - lat) / (maxLat - minLat)) * height;
    return [x, y];
  };

  const routeToPath = (geometry: [number, number][]) => {
    return geometry.map(([lng, lat], i) => {
      const [x, y] = project(lng, lat);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    }).join(" ");
  };

  const [sx, sy] = project(startCoords.lng, startCoords.lat);
  const [ex, ey] = project(endCoords.lng, endCoords.lat);

  const sortedRoutes = [...routes].sort((a, b) =>
    a.id === selectedRouteId ? 1 : b.id === selectedRouteId ? -1 : 0
  );

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-emerald-50 via-sky-50/30 to-blue-50 overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `
          radial-gradient(circle at 20% 30%, hsl(160, 50%, 50%) 0%, transparent 50%),
          radial-gradient(circle at 70% 60%, hsl(210, 50%, 50%) 0%, transparent 50%),
          radial-gradient(circle at 50% 80%, hsl(160, 40%, 45%) 0%, transparent 40%)
        `,
      }} />

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-full max-h-full p-4">
        {sortedRoutes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const color = ROUTE_COLORS[route.id] || ROUTE_COLORS[0];
          return (
            <g key={route.id} onClick={() => onSelectRoute(route.id)} className="cursor-pointer">
              {isSelected && (
                <path d={routeToPath(route.geometry)} fill="none" stroke={color}
                  strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" opacity="0.12" />
              )}
              <path d={routeToPath(route.geometry)} fill="none"
                stroke={isSelected ? "white" : "transparent"}
                strokeWidth={isSelected ? 6 : 0} strokeLinecap="round" strokeLinejoin="round" />
              <path d={routeToPath(route.geometry)} fill="none" stroke={color}
                strokeWidth={isSelected ? 4 : 2.5} strokeLinecap="round" strokeLinejoin="round"
                opacity={isSelected ? 1 : 0.35} />
            </g>
          );
        })}

        {/* Start marker */}
        <circle cx={sx} cy={sy} r="16" fill="hsl(160, 84%, 39%)" stroke="white" strokeWidth="3" />
        <text x={sx} y={sy + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="system-ui">S</text>

        {/* End marker */}
        <circle cx={ex} cy={ey} r="16" fill="hsl(0, 84%, 60%)" stroke="white" strokeWidth="3" />
        <text x={ex} y={ey + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="system-ui">E</text>

        {/* Start label */}
        <rect x={sx + 22} y={sy - 14} width={Math.min(startName.length * 6.5 + 16, 180)} height="28" rx="8"
          fill="white" fillOpacity="0.95" stroke="hsl(160, 84%, 39%)" strokeWidth="1.5" />
        <text x={sx + 30} y={sy + 4} fill="hsl(220, 25%, 10%)" fontSize="11" fontWeight="600" fontFamily="system-ui">
          {startName.length > 24 ? startName.slice(0, 24) + "\u2026" : startName}
        </text>

        {/* End label */}
        <rect x={ex + 22} y={ey - 14} width={Math.min(endName.length * 6.5 + 16, 180)} height="28" rx="8"
          fill="white" fillOpacity="0.95" stroke="hsl(0, 84%, 60%)" strokeWidth="1.5" />
        <text x={ex + 30} y={ey + 4} fill="hsl(220, 25%, 10%)" fontSize="11" fontWeight="600" fontFamily="system-ui">
          {endName.length > 24 ? endName.slice(0, 24) + "\u2026" : endName}
        </text>
      </svg>

      {/* Route legend */}
      <motion.div
        initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
        className="absolute bottom-3 left-3 flex items-center gap-4 rounded-xl bg-card/95 backdrop-blur-sm px-4 py-2.5 shadow-lg border text-[11px]"
      >
        {routes.map((r) => (
          <button key={r.id} onClick={() => onSelectRoute(r.id)}
            className={`flex items-center gap-1.5 transition-all ${
              r.id === selectedRouteId ? "opacity-100 font-semibold scale-105" : "opacity-50 hover:opacity-75"
            }`}
          >
            <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: ROUTE_COLORS[r.id] }} />
            <span>{ROUTE_NAMES[r.id]}</span>
            <span className="text-muted-foreground font-normal">({r.happyScore})</span>
          </button>
        ))}
      </motion.div>

      <div className="absolute top-3 right-3 rounded-lg bg-card/90 backdrop-blur-sm px-3 py-1.5 text-[10px] text-muted-foreground border shadow-sm flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
        Demo Mode
      </div>
    </div>
  );
}
