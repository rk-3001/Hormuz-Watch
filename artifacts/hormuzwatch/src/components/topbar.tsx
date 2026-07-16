import { useEffect, useState } from "react";
import { useGetRiskScores, useRefreshRiskScores } from "@workspace/api-client-react";
import { AnimatedNumber } from "./animated-number";
import { cn } from "@/lib/utils";
import { Bell, Search, User } from "lucide-react";

export function Topbar() {
  const { data: scores } = useGetRiskScores();
  const refreshScores = useRefreshRiskScores();
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    if (scores && scores.length > 0) {
      const avg = scores.reduce((acc, curr) => acc + curr.currentScore, 0) / scores.length;
      setOverallScore(avg);
    }
  }, [scores]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshScores.mutate();
    }, 12000);
    return () => clearInterval(interval);
  }, [refreshScores]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-destructive border-destructive/30 bg-destructive/10";
    if (score >= 40) return "text-warning border-warning/30 bg-warning/10";
    return "text-success border-success/30 bg-success/10";
  };

  return (
    <header className="h-16 bg-card border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-10 relative">
      <div className="flex items-center">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search intelligence feed..."
            className="bg-background border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors w-64 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
            Overall Risk Index
          </span>
          <div
            className={cn(
              "px-3 py-1 rounded-md border flex items-center space-x-2",
              getScoreColor(overallScore)
            )}
          >
            <span className="font-mono text-lg font-bold">
              <AnimatedNumber value={overallScore} decimals={1} />
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex items-center space-x-4">
          <button className="text-muted-foreground hover:text-foreground transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full" />
          </button>
          <button className="w-8 h-8 rounded-full bg-background border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
