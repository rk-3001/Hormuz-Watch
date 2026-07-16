import { useState } from "react";
import { useListScenarios, useRunScenario } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { AnimatedNumber } from "@/components/animated-number";
import { AIAssistant } from "@/components/ai-assistant";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, TrendingDown, DollarSign, Database, Activity, ShieldAlert, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function Simulator() {
  const { data: scenarios = [] } = useListScenarios();
  const runScenarioMutation = useRunScenario();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleRun = () => {
    if (!selectedId) return;
    
    setIsSimulating(true);
    setResult(null);

    // Artificial delay to sell the "complex simulation" feel
    setTimeout(() => {
      runScenarioMutation.mutate({ id: selectedId }, {
        onSuccess: (data) => {
          setResult(data);
          setIsSimulating(false);
        },
        onError: () => {
          setIsSimulating(false);
        }
      });
    }, 1800);
  };

  const getChartData = () => {
    if (!result) return [];
    return [
      { name: "Run Rate Drop", value: Math.abs(result.refineryRunRateDrop), fill: "#EF4444" },
      { name: "Fuel Price Δ", value: result.fuelPriceDeltaPercent, fill: "#F5A623" },
      { name: "GDP Drag", value: Math.abs(result.gdpDragPercent), fill: "#3B82F6" }
    ];
  };

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Scenario Simulator</h1>
          <p className="text-sm text-muted-foreground mt-1">Project macro-economic and supply chain impacts of disruption events</p>
        </div>

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
              {selectedId === scenario.id && (
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              )}
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
            onClick={handleRun}
            disabled={!selectedId || isSimulating || runScenarioMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Simulation Models...
              </>
            ) : (
              <>
                Execute Scenario <Activity className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isSimulating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-card border border-white/10 rounded-xl p-12 flex flex-col items-center justify-center space-y-6"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-white/5 border-t-primary animate-spin" />
                <div className="w-16 h-16 rounded-full border-4 border-transparent border-b-warning animate-spin absolute inset-0 animation-delay-150" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold font-mono uppercase tracking-wider text-primary animate-pulse">Computing Macro Impacts</h3>
                <p className="text-sm text-muted-foreground font-mono">Running Monte Carlo distribution • Analyzing tanker routing • Assessing SPR reserves</p>
              </div>
            </motion.div>
          )}

          {result && !isSimulating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-destructive mb-1">Scenario Outcome: {result.scenarioName}</h4>
                  <p className="text-sm text-destructive/80 leading-relaxed">{result.narrative}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-white/10 rounded-xl p-5">
                  <div className="flex items-center space-x-2 text-muted-foreground mb-3">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">Run Rate Drop</span>
                  </div>
                  <div className="text-3xl font-mono font-bold text-destructive">
                    <AnimatedNumber value={result.refineryRunRateDrop} decimals={1} />%
                  </div>
                </div>
                <div className="bg-card border border-white/10 rounded-xl p-5">
                  <div className="flex items-center space-x-2 text-muted-foreground mb-3">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">Fuel Price Surge</span>
                  </div>
                  <div className="text-3xl font-mono font-bold text-warning">
                    +<AnimatedNumber value={result.fuelPriceDeltaPercent} decimals={1} />%
                  </div>
                </div>
                <div className="bg-card border border-white/10 rounded-xl p-5">
                  <div className="flex items-center space-x-2 text-muted-foreground mb-3">
                    <Database className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">SPR Remaining</span>
                  </div>
                  <div className="text-3xl font-mono font-bold text-primary">
                    <AnimatedNumber value={result.sprDaysRemaining} decimals={0} />d
                  </div>
                </div>
                <div className="bg-card border border-white/10 rounded-xl p-5">
                  <div className="flex items-center space-x-2 text-muted-foreground mb-3">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-wider">GDP Drag</span>
                  </div>
                  <div className="text-3xl font-mono font-bold text-destructive">
                    <AnimatedNumber value={result.gdpDragPercent} decimals={2} />%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-white/10 rounded-xl p-6 h-[300px]">
                  <h3 className="font-semibold text-sm mb-4">Impact Distribution (%)</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {getChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-card border border-white/10 rounded-xl p-6 flex flex-col justify-center items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Mitigation Required</h3>
                    <p className="text-sm text-muted-foreground mb-6">Current procurement pipeline cannot sustain this disruption. Alternative sourcing recommended.</p>
                  </div>
                  <Link 
                    href={`/recommendations?scenario=${result.scenarioId}`}
                    className="bg-background border border-white/10 hover:border-primary/50 text-foreground px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    View Procurement Strategy <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AIAssistant />
    </Layout>
  );
}
