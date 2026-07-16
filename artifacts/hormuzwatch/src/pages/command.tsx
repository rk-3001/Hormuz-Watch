import { useGetRiskScores, useListSignals, useGetTimeline } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { AnimatedNumber } from "@/components/animated-number";
import { AIAssistant } from "@/components/ai-assistant";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, ShieldAlert, Activity, ShieldCheck, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Command() {
  const { data: scores = [] } = useGetRiskScores();
  const { data: signals = [] } = useListSignals({ limit: 10 });
  const { data: timeline = [] } = useGetTimeline();

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#EF4444"; // destructive
    if (score >= 40) return "#F5A623"; // warning
    return "#10B981"; // success
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

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

        {/* Risk Gauges */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {["hormuz", "redsea", "persian_gulf"].map((corridorId) => {
            const scoreData = scores.find(s => s.corridor === corridorId) || {
              corridor: corridorId,
              label: corridorId.replace("_", " ").toUpperCase(),
              currentScore: 0,
              trend: "stable"
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
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="70%" 
                      outerRadius="100%" 
                      barSize={15} 
                      data={chartData}
                      startAngle={180}
                      endAngle={0}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar
                        background={{ fill: 'rgba(255,255,255,0.05)' }}
                        dataKey="value"
                        cornerRadius={10}
                      />
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
                      {signal.severity === 'critical' && <ShieldAlert className="w-4 h-4 text-destructive" />}
                      {signal.severity === 'high' && <AlertTriangle className="w-4 h-4 text-warning" />}
                      {signal.severity === 'medium' && <Activity className="w-4 h-4 text-primary" />}
                      {signal.severity === 'low' && <ShieldCheck className="w-4 h-4 text-success" />}
                      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{signal.source}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {format(new Date(signal.timestamp), 'HH:mm:ss')}
                    </span>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
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
                      <span className="text-xs font-mono text-muted-foreground shrink-0 ml-2">
                        {format(new Date(entry.timestamp), 'MMM dd')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.detail}</p>
                    <div className="mt-2 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-background inline-block border border-white/5">
                      {entry.status}
                    </div>
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
