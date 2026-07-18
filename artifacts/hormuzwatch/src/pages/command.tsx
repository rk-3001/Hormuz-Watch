import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetRiskScores, useListSignals, useGetTimeline } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { AnimatedNumber } from "@/components/animated-number";
import { AIAssistant } from "@/components/ai-assistant";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { cn } from "@/lib/utils";
import {
  ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, ShieldAlert, Activity,
  ShieldCheck, ChevronRight, Sparkles, Loader2, CheckCircle2, Info,
  TrendingDown, DollarSign, Database, ChevronDown, Anchor, Calendar, MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedNumber as AN } from "@/components/animated-number";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type CorridorKey = "hormuz" | "redsea" | "persian_gulf";

const CORRIDOR_LABELS: Record<CorridorKey, string> = {
  hormuz: "Strait of Hormuz",
  redsea: "Red Sea / Bab-el-Mandeb",
  persian_gulf: "Persian Gulf",
};

interface InterpretResult {
  disruptionPercent: number;
  affectedCorridor: CorridorKey;
  durationDays: number;
  confidence: "high" | "medium" | "low";
  interpretation: string;
}

interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  refineryRunRateDrop: number;
  fuelPriceDeltaPercent: number;
  sprDaysRemaining: number;
  gdpDragPercent: number;
  narrative: string;
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
  exposureByCorridor: Record<CorridorKey, number>;
}

interface AssumptionsResponse {
  sources: AssumptionSource[];
  note: string;
}

// ─── Shared sub-components (minimal copies to avoid cross-page import issues) ─
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
                  const pct = Math.round(src.exposureByCorridor[corridor] * 100);
                  return (
                    <div key={src.sourceName} className="flex items-center justify-between bg-background/50 rounded-lg px-3 py-2">
                      <div>
                        <div className="text-xs font-medium text-foreground">{src.sourceName}</div>
                        <div className="text-[10px] text-muted-foreground">{src.region}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className={cn("h-full rounded-full", pct > 50 ? "bg-destructive" : pct > 15 ? "bg-warning" : "bg-success")} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={cn("text-xs font-mono font-bold w-8 text-right", pct > 50 ? "text-destructive" : pct > 15 ? "text-warning" : "bg-success text-success")}>
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

function ResultCards({ result }: { result: ScenarioResult }) {
  const chartData = [
    { name: "Run Rate Drop", value: Math.abs(result.refineryRunRateDrop), fill: "#EF4444" },
    { name: "Fuel Price Δ", value: result.fuelPriceDeltaPercent, fill: "#F5A623" },
    { name: "GDP Drag", value: Math.abs(result.gdpDragPercent), fill: "#3B82F6" },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-destructive mb-1">Projected Outcome: {result.scenarioName}</h4>
          <p className="text-sm text-destructive/80 leading-relaxed">{result.narrative}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <TrendingDown className="w-4 h-4" />, label: "Run Rate Drop", value: <><AN value={result.refineryRunRateDrop} decimals={1} />%</>, color: "text-destructive" },
          { icon: <DollarSign className="w-4 h-4" />, label: "Fuel Price Surge", value: <>+<AN value={result.fuelPriceDeltaPercent} decimals={1} />%</>, color: "text-warning" },
          { icon: <Database className="w-4 h-4" />, label: "SPR Remaining", value: <><AN value={result.sprDaysRemaining} decimals={0} />d</>, color: "text-primary" },
          { icon: <Activity className="w-4 h-4" />, label: "GDP Drag", value: <><AN value={result.gdpDragPercent} decimals={2} />%</>, color: "text-destructive" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="bg-card border border-white/10 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-muted-foreground mb-2">
              {icon}
              <span className="text-[10px] font-mono uppercase tracking-wider">{label}</span>
            </div>
            <div className={cn("text-2xl font-mono font-bold", color)}>{value}</div>
          </div>
        ))}
      </div>
      <div className="bg-card border border-white/10 rounded-xl p-5 h-[220px]">
        <h3 className="font-semibold text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">Impact Distribution (%)</h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }} itemStyle={{ color: "hsl(var(--foreground))" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RecsTable({ recs }: { recs: ProcurementOption[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();
  const compatColor = (s: number) => s >= 90 ? "text-success bg-success/10 border-success/20" : s >= 75 ? "text-warning bg-warning/10 border-warning/20" : "text-destructive bg-destructive/10 border-destructive/20";
  return (
    <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-background/30 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Procurement Recommendations</h3>
        <span className="text-xs font-mono text-muted-foreground">{recs.length} sources ranked</span>
      </div>
      <div className="divide-y divide-white/10">
        {recs.map((rec) => (
          <div key={rec.id} className="bg-background/20 hover:bg-background/40 transition-colors">
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}>
              <div className="flex items-center space-x-4">
                <div className="w-7 h-7 rounded-full bg-card border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-muted-foreground">#{rec.overallRank}</div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-sm text-foreground">{rec.sourceName}</h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-white/10 bg-card text-muted-foreground uppercase">{rec.gradeType}</span>
                  </div>
                  <div className="flex items-center space-x-3 mt-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{rec.region}</span>
                    <span className="flex items-center"><DollarSign className="w-3 h-3 mr-1" />${rec.pricePerBarrel}/bbl</span>
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{rec.transitDays}d</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={cn("px-2 py-0.5 rounded text-xs font-mono font-bold border", compatColor(rec.refineryCompatibilityScore))}>{rec.refineryCompatibilityScore}%</div>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expandedId === rec.id && "rotate-180")} />
              </div>
            </div>
            <AnimatePresence>
              {expandedId === rec.id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="p-4 pt-0 border-t border-white/5 bg-card/30">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                      <div className="md:col-span-2 space-y-3">
                        <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/50 pl-3">{rec.rationale}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-background border border-white/5 rounded-lg p-3">
                            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center"><Anchor className="w-3 h-3 mr-1" />Tanker Availability</div>
                            <div className={cn("text-sm font-semibold capitalize", rec.tankerAvailability === "high" ? "text-success" : rec.tankerAvailability === "medium" ? "text-warning" : "text-destructive")}>{rec.tankerAvailability}</div>
                          </div>
                          <div className="bg-background border border-white/5 rounded-lg p-3">
                            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Premium vs Brent</div>
                            <div className={cn("text-sm font-semibold", rec.premiumVsBenchmark >= 0 ? "text-warning" : "text-success")}>{rec.premiumVsBenchmark >= 0 ? "+" : ""}{rec.premiumVsBenchmark}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-end">
                        <button onClick={(e) => { e.stopPropagation(); toast({ title: "Procurement Route Activated", description: `Initiated spot procurement for ${rec.sourceName}.` }); }} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center text-sm">
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

// ─── NL Scenario Panel ────────────────────────────────────────────────────────
function NLScenarioPanel() {
  const [text, setText] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [interpreted, setInterpreted] = useState<InterpretResult | null>(null);
  const [interpError, setInterpError] = useState<string | null>(null);

  // Editable params (pre-filled from interpretation, then editable before run)
  const [disruptionPercent, setDisruptionPercent] = useState(50);
  const [affectedCorridor, setAffectedCorridor] = useState<CorridorKey>("hormuz");
  const [durationDays, setDurationDays] = useState(14);

  const [isSimulating, setIsSimulating] = useState(false);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [recs, setRecs] = useState<ProcurementOption[] | null>(null);

  const handleInterpret = async () => {
    if (!text.trim()) return;
    setInterpreting(true);
    setInterpreted(null);
    setInterpError(null);
    setScenarioResult(null);
    setRecs(null);
    try {
      const res = await fetch("/api/scenarios/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) {
        setInterpError("Could not interpret scenario. Please try rephrasing.");
        return;
      }
      const data: InterpretResult = await res.json();
      setInterpreted(data);
      setDisruptionPercent(data.disruptionPercent);
      setAffectedCorridor(data.affectedCorridor);
      setDurationDays(data.durationDays);
    } catch {
      setInterpError("Network error. Please try again.");
    } finally {
      setInterpreting(false);
    }
  };

  const handleRun = async () => {
    setIsSimulating(true);
    setScenarioResult(null);
    setRecs(null);
    const inputs = { disruptionPercent, affectedCorridor, durationDays };
    await new Promise((r) => setTimeout(r, 1500));
    try {
      const [scenRes, recsRes] = await Promise.all([
        fetch("/api/scenarios/custom/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(inputs) }),
        fetch("/api/recommendations/custom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(inputs) }),
      ]);
      const [scenData, recsData] = await Promise.all([scenRes.json(), recsRes.json()]);
      setScenarioResult(scenData);
      setRecs(recsData);
    } finally {
      setIsSimulating(false);
    }
  };

  const confidenceBadge = {
    high:   "bg-success/10 border-success/20 text-success",
    medium: "bg-warning/10 border-warning/20 text-warning",
    low:    "bg-destructive/10 border-destructive/20 text-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card border border-white/10 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-background/30 flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">AI Scenario Interpreter</h3>
        <span className="text-xs text-muted-foreground font-mono ml-1">— describe a disruption in plain English</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Text input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !interpreting && text.trim() && handleInterpret()}
            placeholder="e.g. 'Iran threatens to close Hormuz for two weeks'"
            className="flex-1 bg-background border border-white/10 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          />
          <button
            onClick={handleInterpret}
            disabled={!text.trim() || interpreting}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {interpreting ? <><Loader2 className="w-4 h-4 animate-spin" />Interpreting…</> : <><Sparkles className="w-4 h-4" />Interpret</>}
          </button>
        </div>

        {interpError && (
          <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2.5">
            {interpError}
          </div>
        )}

        <AnimatePresence>
          {interpreted && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Interpretation banner */}
              <div className="flex items-start gap-3 bg-background/50 border border-white/10 rounded-lg p-4">
                <div className="flex-1">
                  <p className="text-sm text-foreground leading-relaxed">{interpreted.interpretation}</p>
                </div>
                <span className={cn("px-2 py-0.5 rounded text-[10px] font-mono font-bold border uppercase shrink-0", confidenceBadge[interpreted.confidence])}>
                  {interpreted.confidence} confidence
                </span>
              </div>

              {/* Low-confidence warning */}
              {interpreted.confidence === "low" && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">
                    Low confidence in this interpretation — please review the values below before running.
                  </p>
                </div>
              )}

              {/* Editable params */}
              <div className="space-y-5 bg-background/30 border border-white/10 rounded-xl p-5">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Review &amp; Edit Parameters</h4>

                {/* Corridor selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Affected Corridor</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(CORRIDOR_LABELS) as [CorridorKey, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setAffectedCorridor(key)}
                        className={cn(
                          "p-2.5 rounded-lg border text-xs font-medium transition-all text-left",
                          affectedCorridor === key ? "border-primary bg-primary/10 text-primary" : "border-white/10 bg-background/30 text-muted-foreground hover:border-white/20"
                        )}
                      >{label}</button>
                    ))}
                  </div>
                </div>

                {/* Disruption slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Disruption Severity</label>
                    <span className="text-xl font-mono font-bold text-warning">{disruptionPercent}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={disruptionPercent} onChange={(e) => setDisruptionPercent(Number(e.target.value))} className="w-full accent-warning h-1.5 rounded-full cursor-pointer" />
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>0% None</span><span>50% Partial</span><span>100% Full closure</span>
                  </div>
                </div>

                {/* Duration slider */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Assumed Duration</label>
                    <span className="text-xl font-mono font-bold text-primary">{durationDays} days</span>
                  </div>
                  <input type="range" min={1} max={60} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} className="w-full accent-primary h-1.5 rounded-full cursor-pointer" />
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>1 day</span><span>30 days</span><span>60 days</span>
                  </div>
                </div>

                <button
                  onClick={handleRun}
                  disabled={isSimulating}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSimulating ? <><Loader2 className="w-4 h-4 animate-spin" />Running Simulation…</> : <><Activity className="w-4 h-4" />Run this scenario</>}
                </button>
              </div>

              {/* Model Assumptions */}
              <ModelAssumptions corridor={affectedCorridor} />

              {/* Simulation loading */}
              <AnimatePresence mode="wait">
                {isSimulating && (
                  <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-card border border-white/10 rounded-xl p-10 flex flex-col items-center justify-center space-y-5"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-primary animate-spin" />
                      <div className="w-12 h-12 rounded-full border-4 border-transparent border-b-warning animate-spin absolute inset-0" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                    </div>
                    <p className="text-sm font-mono text-primary animate-pulse uppercase tracking-wider">Computing Macro Impacts</p>
                  </motion.div>
                )}

                {scenarioResult && !isSimulating && (
                  <motion.div key="results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    <ResultCards result={scenarioResult} />
                    {recs && <RecsTable recs={recs} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Command() {
  const { data: scores = [] } = useGetRiskScores();
  const { data: signals = [] } = useListSignals({ limit: 10 });
  const { data: timeline = [] } = useGetTimeline();

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#EF4444";
    if (score >= 40) return "#F5A623";
    return "#10B981";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <Layout>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Global Supply Chain Risk</h1>
            <p className="text-sm text-muted-foreground mt-1">Live monitoring of critical maritime chokepoints</p>
          </div>
          <Link
            href="/simulate"
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            Run Scenario <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* NL Scenario Interpreter */}
        <NLScenarioPanel />

        {/* Risk Gauges */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {["hormuz", "redsea", "persian_gulf"].map((corridorId) => {
            const scoreData = scores.find((s) => s.corridor === corridorId) || {
              corridor: corridorId,
              label: corridorId.replace("_", " ").toUpperCase(),
              currentScore: 0,
              trend: "stable",
            };
            const chartData = [{ name: scoreData.label, value: scoreData.currentScore, fill: getScoreColor(scoreData.currentScore) }];
            return (
              <motion.div key={corridorId} variants={itemVariants} className="bg-card border border-white/10 rounded-xl p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-foreground">{scoreData.label}</h3>
                  <div className="flex items-center space-x-1 px-2 py-1 rounded bg-background/50 border border-white/5">
                    {scoreData.trend === "up" && <ArrowUpRight className="w-4 h-4 text-destructive" />}
                    {scoreData.trend === "down" && <ArrowDownRight className="w-4 h-4 text-success" />}
                    {scoreData.trend === "stable" && <Minus className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Trend</span>
                  </div>
                </div>
                <div className="h-40 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={15} data={chartData} startAngle={180} endAngle={0}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-end justify-center pb-6">
                    <div className="text-4xl font-mono font-bold" style={{ color: getScoreColor(scoreData.currentScore) }}>
                      <AnimatedNumber value={scoreData.currentScore} decimals={1} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
          {/* Signal Feed */}
          <motion.div
            className="lg:col-span-2 bg-card border border-white/10 rounded-xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          >
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-background/30">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Live Intelligence Feed</h3>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span>Uplink Active</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {signals.map((signal) => (
                <div key={signal.id} className="bg-background/50 border border-white/5 rounded-lg p-4 hover:bg-background/80 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {signal.severity === "critical" && <ShieldAlert className="w-4 h-4 text-destructive" />}
                      {signal.severity === "high" && <AlertTriangle className="w-4 h-4 text-warning" />}
                      {signal.severity === "medium" && <Activity className="w-4 h-4 text-primary" />}
                      {signal.severity === "low" && <ShieldCheck className="w-4 h-4 text-success" />}
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{signal.source}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{format(new Date(signal.timestamp), "HH:mm:ss")}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{signal.headline}</p>
                  <div className="mt-3 flex items-center space-x-3 text-xs font-mono">
                    <span className="text-muted-foreground">Corridor: {signal.corridor.toUpperCase()}</span>
                    <span className={signal.riskDelta > 0 ? "text-destructive" : "text-success"}>
                      Δ {signal.riskDelta > 0 ? "+" : ""}{signal.riskDelta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Timeline */}
          <motion.div
            className="bg-card border border-white/10 rounded-xl flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          >
            <div className="p-4 border-b border-white/10 bg-background/30">
              <h3 className="font-semibold text-foreground">Response Audit Log</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {timeline.map((entry, index) => (
                  <div key={entry.id} className="relative pl-6 border-l border-white/10 last:border-transparent">
                    <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-card border-2 border-primary" />
                    <div className="mb-1 flex justify-between items-start">
                      <span className="text-sm font-medium text-foreground">{entry.event}</span>
                      <span className="text-xs font-mono text-muted-foreground shrink-0 ml-2">{format(new Date(entry.timestamp), "MMM dd")}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.detail}</p>
                    <div className="mt-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-background inline-block border border-white/5">{entry.status}</div>
                    {index < timeline.length - 1 && <div className="h-6" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <AIAssistant />
    </Layout>
  );
}
