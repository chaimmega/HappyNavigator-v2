import { useState } from "react";
import { MapPin, ArrowUpDown, Plus, Navigation, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SearchFormProps {
  onSearch: (from: string, to: string) => void;
  loading: boolean;
  defaultFrom?: string;
  defaultTo?: string;
}

export function SearchForm({ onSearch, loading, defaultFrom = "", defaultTo = "" }: SearchFormProps) {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [showVia, setShowVia] = useState(false);
  const [via, setVia] = useState("");

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (from.trim() && to.trim()) {
      onSearch(from, to);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative space-y-2">
        {/* From field */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
              <span className="text-[10px] font-bold text-primary-foreground">S</span>
            </div>
          </div>
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Put-in location (start)"
            className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-10 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            title="Use my location"
          >
            <Navigation className="h-4 w-4" />
          </button>
        </div>

        {/* Swap button */}
        <div className="absolute right-12 top-[calc(50%-20px)] z-10">
          <button
            type="button"
            onClick={handleSwap}
            className="flex h-8 w-8 items-center justify-center rounded-full border bg-card shadow-sm transition-all hover:bg-accent hover:shadow-md active:scale-95"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Via point */}
        <AnimatePresence>
          {showVia && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="h-2 w-2 rounded-full bg-amber" />
                </div>
                <input
                  type="text"
                  value={via}
                  onChange={(e) => setVia(e.target.value)}
                  placeholder="Via point (optional waypoint)"
                  className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* To field */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive">
              <span className="text-[10px] font-bold text-primary-foreground">E</span>
            </div>
          </div>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Take-out location (end)"
            className="w-full rounded-xl border border-input bg-card py-3 pl-11 pr-4 text-sm shadow-sm transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Via toggle */}
      {!showVia && (
        <button
          type="button"
          onClick={() => setShowVia(true)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary transition-colors hover:text-emerald-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Add waypoint
        </button>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={loading || !from.trim() || !to.trim()}
        className="w-full rounded-xl bg-primary py-6 text-sm font-semibold shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            Finding routes…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Find Happy Routes
          </span>
        )}
      </Button>
    </form>
  );
}
