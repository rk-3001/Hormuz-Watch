import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useListScenarios, useRunScenario } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { AnimatedNumber } from "@/components/animated-number";
import { AIAssistant } from "@/components/ai-assistant";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Loader2, TrendingDown, DollarSign, Database, Activity,
  ShieldAlert, ChevronDown, CheckCircle2, Anchor, Calendar, MapPin,
  SlidersHorizontal, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  refineryRunRateDrop: number;
  fuelPriceDeltaPercent: number;
  sprDaysRemaining: number;
  gdpDragPercent: number;
  narrative: string;
  generatedAt: string;
}

interface ProcurementOption {
  id: string;
  sourceName: string;
  region: string;
  gradeType: string;
  pricePerBarrel: number;
  premiumVsBenchmark: number;
  tankerAvailability: "high" | "medium" | "low";
  transitDays: number;
  refineryCompatibilityScore: number;
  overallRank: number;
  rationale: string;
}

interface AssumptionSource {
  sourceName: string;
  region: string;
  exposureByCorridor: Record<"hormuz" | "redsea" | "persian_gulf", number>;
}

interface AssumptionsResponse {
  sources: AssumptionSource[];
  note: string;
}

type CorridorKey = "hormuz" | "redsea" | "persian_gulf";

const CORRIDOR_LABELS: Record<CorridorKey, string> = {
  hormuz: "Strait of Hormuz",
  redsea: "Red Sea / Bab-el-Mandeb",
  persian_gulf: "Persian Gulf",
};

// ─── Shared sub-components ───────────────────────────────────────────────────
function SimulatingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-card border border-white/10 rounded-xl p-12 flex flex-col items-center justify-center space-y-6"
    >
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-primary animate-spin" />
        <div
          className="w-16 h-16 rounded-full border-4 border-transparent border-b-warning animate-spin absolute inset-0"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-semibold font-mono uppercase tracking-wider text-primary animate-pulse">
          Computing Macro Impacts
        </h3>
        <p className="text-sm text-muted-foreground font-mono">
          Running Monte Carlo distribution • Analyzing tanker routing • Assessing SPR reserves
        </p>
      </div>
    </motion.div>
  );
}

function ResultCards({ result }: { result: ScenarioResult }) {
  const chartData = [
    { name: "Run Rate Drop", value: Math.abs(result.refineryRunRateDrop), fill: "#EF4444" },
    { name: "Fuel Price Δ", value: result.fuelPriceDeltaPercent, fill: "#F5A623" },
    { name: "GDP Drag", value: Math.abs(result.gdpDragPercent), fill: "#3B82F6" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-destructive mb-1">
            Scenario Outcome: {result.scenarioName}
          </h4>
          <p className="text-sm text-destructive/80 leading-relaxed">{result.narrative}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { icon: <TrendingDown className="w-4 h-4" />, label: "Run Rate Drop", value: <><AnimatedNumber value={result.refineryRunRateDrop} decimals={1} />%</>, color: "text-destructive" },
          { icon: <DollarSign className="w-4 h-4" />, label: "Fuel Price Surge", value: <>+<AnimatedNumber value={result.fuelPriceDeltaPercent} decimals={1} />%</>, color: "text-warning" },
          { icon: <Database className="w-4 h-4" />, label: "SPR Remaining", value: <><AnimatedNumber value={result.sprDaysRemaining} decimals={0} />d</>, color: "text-primary" },
          { icon: <Activity className="w-4 h-4" />, label: "GDP Drag", value: <><AnimatedNumber value={result.gdpDragPercent} decimals={2} />%</>, color: "text-destructive" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="bg-card border border-white/10 rounded-xl p-5">
            <div className="flex items-center space-x-2 text-muted-foreground mb-3">
              {icon}
              <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
            </div>
            <div className={cn("text-3xl font-mono font-bold", color)}>{value}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-white/10 rounded-xl p-6 h-[280px]">
        <h3 className="font-semibold text-sm mb-4">Impact Distribution (%)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} itemStyle={{ color: "hsl(var(--foreground))" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function RecommendationsTable({ recs }: { recs: ProcurementOption[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const compatColor = (score: number) =>
    score >= 90 ? "text-success bg-success/10 border-success/20"
    : score >= 75 ? "text-warning bg-warning/10 border-warning/20"
    : "text-destructive bg-destructive/10 border-destructive/20";

  return (
    <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-background/30 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Procurement Recommendations</h3>
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {recs.length} sources ranked
        </span>
      </div>
      <div className="divide-y divide-white/10">
        {recs.map((rec) => (
          <div key={rec.id} className="bg-background/20 hover:bg-background/40 transition-colors">
            <div
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 rounded-full bg-card border border-white/10 flex items-center justify-center font-mono font-bold text-sm text-muted-foreground">
                  #{rec.overallRank}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-foreground">{rec.sourceName}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-white/10 bg-card text-muted-foreground uppercase">
                      {rec.gradeType}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{rec.region}</span>
                    <span className="flex items-center"><DollarSign className="w-3 h-3 mr-1" />${rec.pricePerBarrel}/bbl</span>
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{rec.transitDays}d</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className={cn("px-2 py-0.5 rounded text-xs font-mono font-bold border", compatColor(rec.refineryCompatibilityScore))}>
                  {rec.refineryCompatibilityScore}%
                </div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedId === rec.id && "rotate-180")} />
              </div>
            </div>
            <AnimatePresence>
              {expandedId === rec.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 border-t border-white/5 bg-card/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                      <div className="md:col-span-2 space-y-4">
                        <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/50 pl-3">{rec.rationale}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-background border border-white/5 rounded-lg p-3">
                            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center"><Anchor className="w-3 h-3 mr-1" />Tanker Availability</div>
                            <div className={cn("text-sm font-semibold capitalize", rec.tankerAvailability === "high" ? "text-success" : rec.tankerAvailability === "medium" ? "text-warning" : "text-destructive")}>
                              {rec.tankerAvailability}
                            </div>
                          </div>
                          <div className="bg-background border border-white/5 rounded-lg p-3">
                            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center"><Activity className="w-3 h-3 mr-1" />Premium vs Brent</div>
                            <div className={cn("text-sm font-semibold", rec.premiumVsBenchmark >= 0 ? "text-warning" : "text-success")}>
                              {rec.premiumVsBenchmark >= 0 ? "+" : ""}{rec.premiumVsBenchmark}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); toast({ title: "Procurement Route Activated", description: `Initiated spot procurement for ${rec.sourceName}.` }); }}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />Accept Route
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelAssumptions({ corridor }: { corridor: CorridorKey }) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery<AssumptionsResponse>({
    queryKey: ["assumptions"],
    queryFn: () => fetch("/api/scenarios/assumptions").then((r) => r.json()),
    staleTime: Infinity,
  });

  return (
    <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-2 text-sm font-semibold">
          <Info className="w-4 h-4 text-muted-foreground" />
          <span>Model Assumptions</span>
          <span className="text-xs font-mono text-muted-foreground normal-case font-normal ml-2">
            {CORRIDOR_LABELS[corridor]} exposure per source
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence>
        {open && data && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
              <p className="text-xs text-muted-foreground italic">{data.note}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.sources.map((src) => {
                  const exposure = src.exposureByCorridor[corridor];
                  const pct = Math.round(exposure * 100);
                  return (
                    <div key={src.sourceName} className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2">
                      <div>
                        <div className="text-xs font-medium text-foreground">{src.sourceName}</div>
                        <div className="text-[10px] text-muted-foreground">{src.region}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", pct > 50 ? "bg-destructive" : pct > 15 ? "bg-warning" : "bg-success")}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={cn("text-xs font-mono font-bold w-8 text-right", pct > 50 ? "text-destructive" : pct > 15 ? "text-warning" : "text-success")}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Simulator() {
  const { data: scenarios = [] } = useListScenarios();
  const runScenarioMutation = useRunScenario();

  const [mode, setMode] = useState<"preset" | "custom">("preset");

  // Preset state
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Custom state
  const [disruptionPercent, setDisruptionPercent] = useState(50);
  const [affectedCorridor, setAffectedCorridor] = useState<CorridorKey>("hormuz");
  const [durationDays, setDurationDays] = useState(14);

  // Shared result state
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [recs, setRecs] = useState<ProcurementOption[] | null>(null);
  const [recsLoading, setRecsLoading] = useState(false);

  const activeCorridor: CorridorKey =
    mode === "custom"
      ? affectedCorridor
      : (scenarios.find((s) => s.id === selectedId)?.affectedCorridor as CorridorKey | undefined) ?? "hormuz";

  const fetchRecs = async (inputs: { disruptionPercent: number; affectedCorridor: string; durationDays: number }) => {
    setRecsLoading(true);
    try {
      const res = await fetch("/api/recommendations/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      setRecs(data);
    } finally {
      setRecsLoading(false);
    }
  };

  const handleRunPreset = () => {
    if (!selectedId) return;
    setIsSimulating(true);
    setResult(null);
    setRecs(null);
    setTimeout(() => {
      runScenarioMutation.mutate({ id: selectedId }, {
        onSuccess: async (data: ScenarioResult) => {
          setResult(data);
          setIsSimulating(false);
          // resolve preset inputs for recs
          const presetInputs: Record<string, { disruptionPercent: number; affectedCorridor: string; durationDays: number }> = {
            "hormuz-closure":     { disruptionPercent: 50, affectedCorridor: "hormuz",       durationDays: 14 },
            "opec-emergency-cut": { disruptionPercent: 38, affectedCorridor: "persian_gulf", durationDays: 10 },
            "redsea-suspension":  { disruptionPercent: 42, affectedCorridor: "redsea",       durationDays: 16 },
          };
          if (presetInputs[selectedId]) await fetchRecs(presetInputs[selectedId]);
        },
        onError: () => setIsSimulating(false),
      });
    }, 1800);
  };

  const handleRunCustom = async () => {
    setIsSimulating(true);
    setResult(null);
    setRecs(null);
    const inputs = { disruptionPercent, affectedCorridor, durationDays };
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const res = await fetch("/api/scenarios/custom/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const data: ScenarioResult = await res.json();
      setResult(data);
      await fetchRecs(inputs);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Scenario Simulator</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Project macro-economic and supply chain impacts of disruption events
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center bg-card border border-white/10 rounded-xl p-1 w-fit">
          {(["preset", "custom"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null); setRecs(null); }}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                mode === m
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "preset" ? <ShieldAlert className="w-4 h-4" /> : <SlidersHorizontal className="w-4 h-4" />}
              {m === "preset" ? "Preset Scenarios" : "Custom Scenario"}
            </button>
          ))}
        </div>

        {/* ── Preset mode ── */}
        {mode === "preset" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  onClick={() => setSelectedId(scenario.id)}
                  className={cn(
                    "bg-card border rounded-xl p-5 cursor-pointer transition-all duration-200 relative overflow-hidden group",
                    selectedId === scenario.id
                      ? "border-primary shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                      : "border-white/10 hover:border-white/20 hover:bg-white/5"
                  )}
                >
                  {selectedId === scenario.id && <div className="absolute inset-0 bg-primary/5 pointer-events-none" />}
                  <div className="flex items-center space-x-3 mb-3 relative z-10">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedId === scenario.id ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground group-hover:text-foreground"
                    )}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">{scenario.name}</h3>
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{scenario.affectedCorridor}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed relative z-10">{scenario.description}</p>
                  <div className="mt-4 flex items-center space-x-2 text-xs font-mono relative z-10">
                    <span className="px-2 py-1 rounded bg-background border border-white/5 text-warning">
                      {scenario.disruptionPercent}% Impact
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleRunPreset}
                disabled={!selectedId || isSimulating}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSimulating ? <><Loader2 className="w-4 h-4 animate-spin" />Running Simulation Models...</> : <><Activity className="w-4 h-4" />Execute Scenario</>}
              </button>
            </div>
          </>
        )}

        {/* ── Custom mode ── */}
        {mode === "custom" && (
          <div className="bg-card border border-white/10 rounded-xl p-6 space-y-6">
            <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-muted-foreground">
              Configure Disruption Parameters
            </h2>

            {/* Corridor select */}
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Affected Corridor
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(CORRIDOR_LABELS) as [CorridorKey, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setAffectedCorridor(key)}
                    className={cn(
                      "p-3 rounded-lg border text-sm font-medium transition-all text-left",
                      affectedCorridor === key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/10 bg-background/30 text-muted-foreground hover:border-white/20"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Disruption severity slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Disruption Severity
                </label>
                <span className="text-2xl font-mono font-bold text-warning">{disruptionPercent}%</span>
              </div>
              <input
                type="range" min={0} max={100} value={disruptionPercent}
                onChange={(e) => setDisruptionPercent(Number(e.target.value))}
                className="w-full accent-warning h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>0% — No disruption</span>
                <span>50% — Partial closure</span>
                <span>100% — Full closure</span>
              </div>
            </div>

            {/* Duration slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Assumed Duration
                </label>
                <span className="text-2xl font-mono font-bold text-primary">{durationDays} days</span>
              </div>
              <input
                type="range" min={1} max={30} value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full accent-primary h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>1 day</span>
                <span>15 days</span>
                <span>30 days</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleRunCustom}
                disabled={isSimulating}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSimulating ? <><Loader2 className="w-4 h-4 animate-spin" />Running Simulation Models...</> : <><Activity className="w-4 h-4" />Execute Custom Scenario</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Model Assumptions (always visible) ── */}
        <ModelAssumptions corridor={activeCorridor} />

        {/* ── Simulation result + recommendations ── */}
        <AnimatePresence mode="wait">
          {isSimulating && <SimulatingSpinner key="spinner" />}
          {result && !isSimulating && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <ResultCards result={result} />
              {recsLoading && (
                <div className="flex items-center justify-center py-8 text-muted-foreground text-sm font-mono gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading procurement recommendations…
                </div>
              )}
              {recs && !recsLoading && <RecommendationsTable recs={recs} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AIAssistant />
    </Layout>
  );
}
