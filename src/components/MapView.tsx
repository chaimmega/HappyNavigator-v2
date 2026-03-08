import { ScoredRoute, ROUTE_COLORS } from "@/types/navigation";
import { Coordinates } from "@/types/navigation";

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
  // Compute bounds from all route geometries
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  routes.forEach((r) => r.geometry.forEach(([lng, lat]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
  }));

  const padLat = (maxLat - minLat) * 0.15;
  const padLng = (maxLng - minLng) * 0.15;
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

  // Draw non-selected routes first, selected on top
  const sortedRoutes = [...routes].sort((a, b) =>
    a.id === selectedRouteId ? 1 : b.id === selectedRouteId ? -1 : 0
  );

  return (
    <div className="relative h-full w-full bg-gradient-to-br from-emerald-50 to-blue-50 overflow-hidden flex items-center justify-center">
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-w-full max-h-full p-4">
        {/* Routes */}
        {sortedRoutes.map((route) => {
          const isSelected = route.id === selectedRouteId;
          const color = ROUTE_COLORS[route.id] || ROUTE_COLORS[0];
          return (
            <g key={route.id} onClick={() => onSelectRoute(route.id)} className="cursor-pointer">
              {/* Shadow */}
              {isSelected && (
                <path
                  d={routeToPath(route.geometry)}
                  fill="none"
                  stroke={color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.15"
                />
              )}
              <path
                d={routeToPath(route.geometry)}
                fill="none"
                stroke={color}
                strokeWidth={isSelected ? 4 : 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isSelected ? 1 : 0.4}
              />
            </g>
          );
        })}

        {/* Start marker */}
        <circle cx={sx} cy={sy} r="14" fill="hsl(160, 84%, 39%)" stroke="white" strokeWidth="3" />
        <text x={sx} y={sy + 4.5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="system-ui">S</text>

        {/* End marker */}
        <circle cx={ex} cy={ey} r="14" fill="hsl(0, 84%, 60%)" stroke="white" strokeWidth="3" />
        <text x={ex} y={ey + 4.5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="system-ui">E</text>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-xl bg-card/90 backdrop-blur-sm px-3 py-2 shadow-md border text-[11px]">
        {routes.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelectRoute(r.id)}
            className={`flex items-center gap-1.5 transition-opacity ${r.id === selectedRouteId ? "opacity-100 font-medium" : "opacity-50"}`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ROUTE_COLORS[r.id] }} />
            Route {String.fromCharCode(65 + r.id)}
          </button>
        ))}
      </div>

      {/* Map placeholder label */}
      <div className="absolute top-3 right-3 rounded-lg bg-card/90 backdrop-blur-sm px-3 py-1.5 text-[10px] text-muted-foreground border shadow-sm">
        Map Preview · Add Google Maps API key for interactive map
      </div>
    </div>
  );
}
