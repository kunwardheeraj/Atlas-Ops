import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { JobBoard } from "@/components/JobBoard";
import { WelcomeBanner } from "@/components/WelcomeBanner";
import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";

const metricCards = [
  { label: "Active Jobs", value: "12", delta: "+2 since 9am", icon: Activity, color: "text-indigo-500", glow: "shadow-indigo-500/20", accent: "from-indigo-400/15 to-indigo-500/5" },
  { label: "AI Reports", value: "3", delta: "Pending review", icon: BrainCircuit, color: "text-violet-500", glow: "shadow-violet-500/20", accent: "from-violet-400/15 to-violet-500/5" },
  { label: "Completed Today", value: "7", delta: "↑ 40% vs yesterday", icon: CheckCircle2, color: "text-emerald-500", glow: "shadow-emerald-500/20", accent: "from-emerald-400/15 to-emerald-500/5" },
  { label: "Avg. Response", value: "18m", delta: "↓ 3m improvement", icon: Clock, color: "text-amber-500", glow: "shadow-amber-500/20", accent: "from-amber-400/15 to-amber-500/5" },
  { label: "Technicians", value: "5", delta: "2 currently offline", icon: Users, color: "text-sky-500", glow: "shadow-sky-500/20", accent: "from-sky-400/15 to-sky-500/5" },
  { label: "Efficiency", value: "94%", delta: "↑ 6pts this week", icon: TrendingUp, color: "text-rose-500", glow: "shadow-rose-500/20", accent: "from-rose-400/15 to-rose-500/5" },
];

function MetricCard({
  label, value, delta, icon: Icon, color, glow, accent,
}: {
  label: string; value: string; delta: string;
  icon: React.ElementType; color: string; glow: string; accent: string;
}) {
  return (
    <div className={`glass group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${glow}`}>
      {/* Subtle gradient tint per metric */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} rounded-2xl`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${color} opacity-80`} />
        </div>
        <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{value}</p>
        <p className="text-[11px] text-muted-foreground mt-1 font-medium">{delta}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">

        {/* ── Hero Banner ── */}
        <WelcomeBanner />

        {/* ── Metrics Strip ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Real-time Metrics</h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {metricCards.map((card) => (
              <MetricCard key={card.label} {...card} />
            ))}
          </div>
        </section>

        {/* ── Live Job Board ── */}
        <JobBoard />

      </div>
    </DashboardLayout>
  );
}
