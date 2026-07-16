import { useState } from "react";
import { useGetReserves } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { AnimatedNumber } from "@/components/animated-number";
import { AIAssistant } from "@/components/ai-assistant";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Database, AlertTriangle, Info } from "lucide-react";

export default function Reserves() {
  const [disruptionDays, setDisruptionDays] = useState(14);
  const { data: reserves } = useGetReserves({ disruptionDays });

  const getStatusColor = (days: number) => {
    if (days > 45) return "text-success";
    if (days > 20) return "text-warning";
    return "text-destructive";
  };

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Strategic Petroleum Reserve</h1>
          <p className="text-sm text-muted-foreground mt-1">Live modeling of depletion curves based on disruption duration</p>
        </div>

        {reserves && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-card border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">Depletion Projection</h3>
                    <p className="text-xs text-muted-foreground mt-1">Estimated SPR cover over time</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs font-mono bg-background border border-white/5 px-3 py-1.5 rounded-lg">
                    <Database className="w-3 h-3 text-primary" />
                    <span className="text-muted-foreground">Capacity: {reserves.maxCapacityDays} Days</span>
                  </div>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reserves.drawdownSchedule} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCover" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="day" 
                        stroke="rgba(255,255,255,0.3)" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(v) => `Day ${v}`}
                      />
                      <YAxis 
                        stroke="rgba(255,255,255,0.3)" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        domain={[0, 'dataMax']}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--primary))', fontFamily: 'var(--font-mono)' }}
                        labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '12px', marginBottom: '4px' }}
                        formatter={(value: number) => [`${value} Days`, 'Remaining Cover']}
                        labelFormatter={(label) => `Day ${label}`}
                      />
                      <ReferenceLine y={20} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeOpacity={0.5} />
                      <Area 
                        type="monotone" 
                        dataKey="projectedDays" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorCover)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-card border border-white/10 rounded-xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Database className="w-32 h-32" />
                  </div>
                  <h3 className="font-semibold text-sm text-foreground mb-4 relative z-10">Current Status</h3>
                  <div className="mb-6 relative z-10">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Days of Cover</div>
                    <div className={`text-6xl font-mono font-bold ${getStatusColor(reserves.currentDaysCover)}`}>
                      <AnimatedNumber value={reserves.currentDaysCover} />
                    </div>
                  </div>
                  <div className="space-y-3 relative z-10">
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className="text-foreground">{reserves.utilizationPercent}%</span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${reserves.utilizationPercent}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-white/10 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <h3 className="font-semibold text-sm text-foreground">Scenario Input</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-2">
                        <span className="text-muted-foreground">Disruption Duration</span>
                        <span className="text-warning font-bold">{disruptionDays} Days</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="30" 
                        value={disruptionDays}
                        onChange={(e) => setDisruptionDays(parseInt(e.target.value))}
                        className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-warning"
                        style={{
                          background: `linear-gradient(to right, hsl(var(--warning)) ${(disruptionDays / 30) * 100}%, hsl(var(--background)) ${(disruptionDays / 30) * 100}%)`
                        }}
                      />
                    </div>
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start space-x-2 mt-4">
                      <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      <p className="text-xs text-warning/80 leading-relaxed">
                        Adjusting this slider recalculates the SPR depletion curve assuming a 100% loss of inbound shipments for the selected duration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <AIAssistant />
    </Layout>
  );
}
