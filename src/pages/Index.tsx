import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { SearchForm } from "@/components/SearchForm";
import { RouteCard } from "@/components/RouteCard";
import { HappyScore } from "@/components/HappyScore";
import { ElevationChart } from "@/components/ElevationChart";
import { AISummaryCard } from "@/components/AISummaryCard";
import { LoadingSteps } from "@/components/LoadingSteps";
import { MapView } from "@/components/MapView";
import { mockResponse } from "@/data/mockData";
import { NavigateResponse } from "@/types/navigation";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { motion, AnimatePresence } from "framer-motion";

function MapPlaceholder() {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-secondary overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }} />
      <div className="text-center space-y-3 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-5xl"
        >
          🚗
        </motion.div>
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="text-lg font-semibold text-foreground">Your happy route awaits</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Enter start and destination to discover the happiest driving route
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function Index() {
  const [result, setResult] = useState<NavigateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedRouteId, setSelectedRouteId] = useState(0);
  const [metric, setMetric] = useState(() => {
    return localStorage.getItem("happynav_metric") !== "false";
  });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    localStorage.setItem("happynav_metric", String(metric));
  }, [metric]);

  const handleSearch = useCallback((_from: string, _to: string) => {
    setLoading(true);
    setLoadingStep(0);
    setResult(null);

    const stepDurations = [800, 1000, 1200, 1000];
    let current = 0;
    const advance = () => {
      current++;
      if (current < stepDurations.length) {
        setLoadingStep(current);
        setTimeout(advance, stepDurations[current]);
      } else {
        setLoading(false);
        setResult(mockResponse);
        setSelectedRouteId(mockResponse.bestRouteId);
      }
    };
    setTimeout(advance, stepDurations[0]);
  }, []);

  const selectedRoute = result?.routes.find((r) => r.id === selectedRouteId);

  const sidebarContent = (
    <div className="p-5 space-y-5">
      <SearchForm
        onSearch={handleSearch}
        loading={loading}
        defaultFrom="Central Park, New York"
        defaultTo="Brooklyn Bridge, New York"
      />

      {/* Metric toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMetric(true)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            metric ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          km
        </button>
        <button
          onClick={() => setMetric(false)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            !metric ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
          }`}
        >
          mi
        </button>
      </div>

      <AnimatePresence>
        {loading && <LoadingSteps currentStep={loadingStep} />}
      </AnimatePresence>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {result.explanation && (
            <AISummaryCard
              bullets={result.explanation.bullets}
              suggestedStops={result.explanation.suggestedStops}
              startName={result.startName}
              endName={result.endName}
            />
          )}

          <div className="h-px bg-border" />

          {/* Route comparison strip */}
          <div className="flex gap-2">
            {result.routes.map((route) => (
              <button
                key={route.id}
                onClick={() => setSelectedRouteId(route.id)}
                className={`flex-1 rounded-xl border p-2.5 text-center transition-all ${
                  route.id === selectedRouteId
                    ? "border-primary/30 bg-card shadow-md ring-1 ring-primary/10"
                    : "border-border bg-muted/50 hover:bg-accent"
                }`}
              >
                <HappyScore score={route.happyScore} size="sm" />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Route {String.fromCharCode(65 + route.id)}
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {result.routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                isBest={route.id === result.bestRouteId}
                isSelected={route.id === selectedRouteId}
                metric={metric}
                onClick={() => setSelectedRouteId(route.id)}
              />
            ))}
          </div>

          {selectedRoute?.elevationPoints && (
            <ElevationChart
              points={selectedRoute.elevationPoints}
              gainM={selectedRoute.elevationGainM || 0}
              metric={metric}
              totalDistanceM={selectedRoute.distance}
            />
          )}
        </motion.div>
      )}
    </div>
  );

  const mapContent = result ? (
    <MapView
      routes={result.routes}
      selectedRouteId={selectedRouteId}
      startCoords={result.startCoords}
      endCoords={result.endCoords}
      startName={result.startName}
      endName={result.endName}
      onSelectRoute={setSelectedRouteId}
    />
  ) : (
    <MapPlaceholder />
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />

      {isMobile ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-shrink-0 overflow-y-auto custom-scrollbar" style={{ maxHeight: "46vh" }}>
            {sidebarContent}
          </div>
          <div className="flex-1 min-h-[200px]">
            {mapContent}
          </div>
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={30} minSize={22} maxSize={45}>
            <div className="h-full overflow-y-auto custom-scrollbar">
              {sidebarContent}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={70}>
            {mapContent}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
