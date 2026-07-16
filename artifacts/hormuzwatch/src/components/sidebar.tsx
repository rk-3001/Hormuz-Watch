import { Link, useLocation } from "wouter";
import {
  Activity,
  AlertTriangle,
  Map as MapIcon,
  ShieldAlert,
  Database,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", label: "Command Center", icon: Activity },
  { path: "/simulate", label: "Simulator", icon: AlertTriangle },
  { path: "/recommendations", label: "Procurement", icon: Compass },
  { path: "/reserves", label: "SPR Reserves", icon: Database },
  { path: "/map", label: "Geospatial", icon: MapIcon },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 h-screen bg-card border-r border-white/10 flex flex-col shrink-0 relative z-20">
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <ShieldAlert className="w-6 h-6 text-primary mr-3" />
        <span className="font-bold text-lg tracking-wide uppercase text-foreground">
          Hormuz<span className="text-primary">Watch</span>
        </span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 mr-3",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <div className="bg-background rounded-lg p-4 border border-white/10">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 font-mono">
            System Status
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              Secure Uplink Active
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
