import { useState } from "react";
import { useGetRecommendations } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { AIAssistant } from "@/components/ai-assistant";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { CheckCircle2, ChevronDown, Anchor, Calendar, DollarSign, Activity, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Recommendations() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const scenarioId = searchParams.get("scenario") || "hormuz-closure";
  
  const { data: recommendations = [], isLoading } = useGetRecommendations(scenarioId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAccept = (id: string, sourceName: string) => {
    toast({
      title: "Procurement Route Activated",
      description: `Initiated spot procurement for ${sourceName} via secure channel.`,
      className: "bg-success/10 border-success/20 text-success-foreground",
    });
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return "text-success bg-success/10 border-success/20";
    if (score >= 75) return "text-warning bg-warning/10 border-warning/20";
    return "text-destructive bg-destructive/10 border-destructive/20";
  };

  return (
    <Layout>
      <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Procurement Intelligence</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-ranked spot market alternatives based on refinery compatibility and transit risk</p>
        </div>

        <div className="bg-card border border-white/10 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10 bg-background/30 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Recommended Routes</h3>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Scenario: {scenarioId}
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {recommendations.map((rec, idx) => (
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
                          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{rec.transitDays} days</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1">Compatibility</div>
                        <div className={cn("px-2 py-0.5 rounded text-xs font-mono font-bold border", getCompatibilityColor(rec.refineryCompatibilityScore))}>
                          {rec.refineryCompatibilityScore}%
                        </div>
                      </div>
                      <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", expandedId === rec.id && "rotate-180")} />
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === rec.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 border-t border-white/5 bg-card/30">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            <div className="md:col-span-2 space-y-4">
                              <div>
                                <h5 className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">AI Rationale</h5>
                                <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-primary/50 pl-3">
                                  {rec.rationale}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-background border border-white/5 rounded-lg p-3">
                                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center"><Anchor className="w-3 h-3 mr-1"/> Tanker Availability</div>
                                  <div className={cn(
                                    "text-sm font-semibold capitalize",
                                    rec.tankerAvailability === "high" ? "text-success" : rec.tankerAvailability === "medium" ? "text-warning" : "text-destructive"
                                  )}>{rec.tankerAvailability}</div>
                                </div>
                                <div className="bg-background border border-white/5 rounded-lg p-3">
                                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1 flex items-center"><Activity className="w-3 h-3 mr-1"/> Premium vs Benchmark</div>
                                  <div className="text-sm font-semibold text-warning">+{rec.premiumVsBenchmark}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col justify-end">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAccept(rec.id, rec.sourceName); }}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Accept Route
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
          )}
        </div>
      </div>
      <AIAssistant />
    </Layout>
  );
}
