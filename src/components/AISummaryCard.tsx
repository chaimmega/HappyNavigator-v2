import { motion } from "framer-motion";

interface AISummaryCardProps {
  bullets: string[];
  suggestedStops?: string[];
  startName: string;
  endName: string;
}

export function AISummaryCard({ bullets, suggestedStops, startName, endName }: AISummaryCardProps) {
  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🌿</span>
        <h3 className="font-bold text-sm text-emerald-800">Happy Route Found!</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        {startName} → {endName}
      </p>
      <ul className="space-y-1.5 mb-3">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-xs text-foreground leading-relaxed">
            <span className="shrink-0 text-primary">✦</span>
            {b}
          </li>
        ))}
      </ul>
      {suggestedStops && suggestedStops.length > 0 && (
        <div className="border-t border-emerald-200 pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
            Suggested Stops
          </p>
          <ul className="space-y-1">
            {suggestedStops.map((stop, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-foreground">
                <span>📍</span>
                {stop}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
