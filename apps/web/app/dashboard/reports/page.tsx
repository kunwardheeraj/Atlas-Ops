"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import {
  BrainCircuit,
  Search,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MapPin,
  Calendar,
  Hash,
  Loader2,
  ServerCrash,
  Zap,
  ShieldAlert,
  ClipboardList,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIReport {
  id: string;
  jobId: string;
  jobNumber: string;
  title: string;
  location: string;
  priority: string;
  summary: string;
  flaggedIssues: string[];
  recommendedActions: string[];
  generatedAt: string;
}

// ─── Priority config ──────────────────────────────────────────────────────────

const priorityConfig: Record<string, { label: string; className: string; dot: string }> = {
  high: {
    label: "High",
    className: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    className: "bg-emerald-50 text-emerald-600 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

// ─── Report Card ──────────────────────────────────────────────────────────────

function ReportCard({ report }: { report: AIReport }) {
  const [expanded, setExpanded] = useState(false);
  const priority = priorityConfig[report.priority.toLowerCase()] ?? priorityConfig.medium;
  const date = new Date(report.generatedAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`group rounded-xl border glass shadow-sm transition-all duration-200 overflow-hidden ${
        expanded ? "shadow-md border-indigo-400/50 ring-1 ring-indigo-400/20" : "hover:shadow-md hover:border-border/80"
      }`}
    >
      {/* ── Card Header ── */}
      <button
        className="w-full text-left p-5 flex items-start gap-4"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {/* Icon */}
        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-200/60 mt-0.5">
          <BrainCircuit className="h-5 w-5 text-violet-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-[11px] text-muted-foreground font-medium">
              {report.jobNumber}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] font-semibold px-2 py-0 h-5 ${priority.className}`}
            >
              <span className={`mr-1.5 h-1.5 w-1.5 rounded-full inline-block ${priority.dot}`} />
              {priority.label}
            </Badge>
            {report.flaggedIssues.length > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold px-2 py-0 h-5 bg-red-50 text-red-600 border-red-200"
              >
                <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                {report.flaggedIssues.length} issue{report.flaggedIssues.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-1">
            {report.title}
          </h3>

          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {report.location}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formattedDate} · {formattedTime}
            </span>
          </div>

          {/* Summary preview */}
          {!expanded && (
            <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {report.summary}
            </p>
          )}
        </div>

        {/* Expand toggle */}
        <div className="flex-shrink-0 ml-2 mt-1">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          )}
        </div>
      </button>

      {/* ── Expanded Body ── */}
      {expanded && (
        <div className="border-t border-border/50 px-5 pb-5 pt-4 space-y-5">
          {/* Summary */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Inspection Summary
              </h4>
            </div>
            <p className="text-sm text-foreground leading-relaxed bg-black/5 dark:bg-white/5 rounded-lg p-3 border border-border/50">
              {report.summary}
            </p>
          </div>

          {/* Flagged Issues */}
          {report.flaggedIssues.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="h-4 w-4 text-red-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600">
                  Flagged Issues
                </h4>
                <span className="ml-auto flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                  {report.flaggedIssues.length}
                </span>
              </div>
              <ul className="space-y-2">
                {report.flaggedIssues.map((issue, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50/70 px-3 py-2.5"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-red-800 leading-snug">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Actions */}
          {report.recommendedActions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Recommended Actions
                </h4>
              </div>
              <ol className="space-y-2">
                {report.recommendedActions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2.5"
                  >
                    <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-sm text-emerald-900 leading-snug">{action}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Metadata footer */}
          <div className="pt-2 border-t border-border/50 flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Hash className="h-3 w-3" />
              Report ID: <span className="font-mono">{report.id.slice(0, 8)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Zap className="h-3 w-3 text-violet-400" />
              Generated by Gemini 2.5 Flash
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIReportsPage() {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/reports`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (json.success) setReports(json.data);
        else throw new Error(json.error ?? "Unknown error");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.jobNumber.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const totalIssues = reports.reduce((acc, r) => acc + r.flaggedIssues.length, 0);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-200/60 dark:border-violet-500/20">
                <BrainCircuit className="h-4 w-4 text-violet-500" />
              </div>
              <h1 className="text-xl font-bold text-foreground">AI Reports</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-10">
              Gemini-generated inspection reports for completed field jobs
            </p>
          </div>

          {/* Stats pills */}
          {!loading && !error && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-white/50 dark:bg-black/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                {reports.length} report{reports.length !== 1 ? "s" : ""}
              </div>
              {totalIssues > 0 && (
                <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 shadow-sm">
                  <AlertTriangle className="h-3 w-3" />
                  {totalIssues} flagged issue{totalIssues !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Search Bar ── */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by job title, number, location, or summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-white/40 dark:bg-black/20 text-sm text-foreground placeholder:text-muted-foreground shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 backdrop-blur-sm transition-all"
          />
        </div>

        {/* ── States ── */}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
              <span className="text-sm">Loading reports...</span>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-3">
              <ServerCrash className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">Failed to load reports</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-3">
              <BrainCircuit className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-muted-foreground">
                {search ? "No reports match your search" : "No AI reports yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {search
                  ? "Try a different search term"
                  : "Reports appear here once field jobs are synced and processed by Gemini"}
              </p>
            </div>
          </div>
        )}

        {/* ── Report List ── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {search && (
              <p className="text-xs text-muted-foreground font-medium">
                Showing {filtered.length} of {reports.length} report{reports.length !== 1 ? "s" : ""}
              </p>
            )}
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
