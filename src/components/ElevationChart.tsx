import { useState, useRef, useCallback } from "react";
import { formatElevation } from "@/types/navigation";

interface ElevationChartProps {
  points: number[];
  gainM: number;
  metric: boolean;
  totalDistanceM: number;
}

export function ElevationChart({ points, gainM, metric, totalDistanceM }: ElevationChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const width = 320;
  const height = 100;
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minElev = Math.min(...points);
  const maxElev = Math.max(...points);
  const range = maxElev - minElev || 1;

  const getX = (i: number) => padding.left + (i / (points.length - 1)) * chartWidth;
  const getY = (v: number) => padding.top + chartHeight - ((v - minElev) / range) * chartHeight;

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p)}`).join(" ");
  const areaD = `${pathD} L ${getX(points.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`;

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = (x - padding.left) / chartWidth;
    const index = Math.round(ratio * (points.length - 1));
    if (index >= 0 && index < points.length) {
      setHoverIndex(index);
    }
  }, [points.length, chartWidth]);

  const elevLabel = metric ? "m" : "ft";
  const hoverElev = hoverIndex !== null
    ? metric ? points[hoverIndex] : Math.round(points[hoverIndex] * 3.28084)
    : null;
  const hoverDist = hoverIndex !== null
    ? ((hoverIndex / (points.length - 1)) * totalDistanceM / (metric ? 1000 : 1609.344)).toFixed(1)
    : null;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-foreground">Elevation Profile</h4>
        <span className="text-xs font-medium text-amber">{formatElevation(gainM, metric)}</span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#elevFill)" />
        <path d={pathD} fill="none" stroke="hsl(160, 84%, 39%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {hoverIndex !== null && (
          <>
            <line
              x1={getX(hoverIndex)} y1={padding.top}
              x2={getX(hoverIndex)} y2={padding.top + chartHeight}
              stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="3,3"
            />
            <circle cx={getX(hoverIndex)} cy={getY(points[hoverIndex])} r="3.5" fill="hsl(160, 84%, 39%)" stroke="white" strokeWidth="2" />
          </>
        )}
        {/* Labels */}
        <text x={padding.left} y={height - 3} fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="system-ui">Start</text>
        <text x={width - padding.right} y={height - 3} fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="system-ui" textAnchor="end">End</text>
      </svg>
      {hoverIndex !== null && hoverElev !== null && (
        <div className="mt-1 text-center text-[10px] text-muted-foreground">
          {hoverElev} {elevLabel} · {hoverDist} {metric ? "km" : "mi"}
        </div>
      )}
    </div>
  );
}
