"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  BrainCircuit,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = "High" | "Medium" | "Low";
type ColumnId = "unassigned" | "in_progress" | "offline_syncing" | "needs_ai_review";

interface Technician {
  name: string;
  avatar?: string;
  initials: string;
}

interface Job {
  id: string;
  title: string;
  location: string;
  priority: Priority;
  technician: Technician | null;
  updatedAt: string;
  column: ColumnId;
  jobNumber: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_JOBS: Job[] = [
  {
    id: "j1",
    title: "Rooftop HVAC Pressure Test",
    location: "One Liberty Plaza, FL 23",
    priority: "High",
    technician: null,
    updatedAt: "2 mins ago",
    column: "unassigned",
    jobNumber: "JOB-4821",
  },
  {
    id: "j2",
    title: "Electrical Panel Inspection",
    location: "Harbor Tower, Unit 4B",
    priority: "Medium",
    technician: null,
    updatedAt: "8 mins ago",
    column: "unassigned",
    jobNumber: "JOB-4819",
  },
  {
    id: "j3",
    title: "Emergency Pipe Burst Response",
    location: "Westfield Mall, Bay 12",
    priority: "High",
    technician: { name: "Marcus Webb", initials: "MW" },
    updatedAt: "Just now",
    column: "in_progress",
    jobNumber: "JOB-4820",
  },
  {
    id: "j4",
    title: "Annual Fire Suppression Test",
    location: "Civic Center, Level 2",
    priority: "Medium",
    technician: { name: "Priya Nair", initials: "PN" },
    updatedAt: "14 mins ago",
    column: "in_progress",
    jobNumber: "JOB-4817",
  },
  {
    id: "j5",
    title: "Generator Fuel Level Check",
    location: "Northgate Data Center",
    priority: "Low",
    technician: { name: "Devon Hall", initials: "DH" },
    updatedAt: "34 mins ago",
    column: "in_progress",
    jobNumber: "JOB-4815",
  },
  {
    id: "j6",
    title: "Chiller Unit Bearing Replacement",
    location: "Skyline Tower, Basement",
    priority: "High",
    technician: { name: "Sam Torres", initials: "ST" },
    updatedAt: "Last sync: 51 mins ago",
    column: "offline_syncing",
    jobNumber: "JOB-4812",
  },
  {
    id: "j7",
    title: "Lift Motor Diagnostic",
    location: "Grand Hotel, Shaft C",
    priority: "Medium",
    technician: { name: "Anya Petrov", initials: "AP" },
    updatedAt: "Last sync: 1h 12m ago",
    column: "offline_syncing",
    jobNumber: "JOB-4809",
  },
  {
    id: "j8",
    title: "Cooling Tower Water Quality Report",
    location: "Metro Business Park",
    priority: "High",
    technician: { name: "Marcus Webb", initials: "MW" },
    updatedAt: "Completed 22 mins ago",
    column: "needs_ai_review",
    jobNumber: "JOB-4806",
  },
  {
    id: "j9",
    title: "Rooftop Solar Array Inspection",
    location: "Harbor Green Complex",
    priority: "Low",
    technician: { name: "Priya Nair", initials: "PN" },
    updatedAt: "Completed 1h ago",
    column: "needs_ai_review",
    jobNumber: "JOB-4803",
  },
];

// ─── Column Config ────────────────────────────────────────────────────────────

const COLUMNS: {
  id: ColumnId;
  label: string;
  icon: React.ElementType;
  accentBar: string;
  dotColor: string;
  glowColor: string;
}[] = [
  {
    id: "unassigned",
    label: "Unassigned",
    icon: AlertTriangle,
    accentBar: "bg-amber-400",
    dotColor: "bg-amber-400",
    glowColor: "shadow-amber-500/10",
  },
  {
    id: "in_progress",
    label: "In Progress",
    icon: Wifi,
    accentBar: "bg-indigo-400",
    dotColor: "bg-indigo-400",
    glowColor: "shadow-indigo-500/10",
  },
  {
    id: "offline_syncing",
    label: "Offline / Syncing",
    icon: WifiOff,
    accentBar: "bg-slate-400",
    dotColor: "bg-slate-400",
    glowColor: "shadow-slate-500/10",
  },
  {
    id: "needs_ai_review",
    label: "Needs AI Review",
    icon: BrainCircuit,
    accentBar: "bg-violet-400",
    dotColor: "bg-violet-400",
    glowColor: "shadow-violet-500/10",
  },
];

// ─── Priority Badge ───────────────────────────────────────────────────────────

const priorityConfig: Record<
  Priority,
  { label: string; className: string }
> = {
  High: {
    label: "High",
    className:
      "bg-red-50 text-red-600 border-red-200 hover:bg-red-50",
  },
  Medium: {
    label: "Medium",
    className:
      "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-50",
  },
  Low: {
    label: "Low",
    className:
      "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-50",
  },
};

// ─── JobCard ──────────────────────────────────────────────────────────────────

function JobCard({ job, index }: { job: Job; index: number }) {
  const isOffline = job.column === "offline_syncing";
  const isAiReview = job.column === "needs_ai_review";
  const priority = priorityConfig[job.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07, ease: "easeOut" }}
    >
      <Card
        className={cn(
          "group relative cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg",
          isOffline && "opacity-80"
        )}
      >
        <CardHeader className="px-4 pt-4 pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-mono text-muted-foreground mb-1 tracking-wide">
                {job.jobNumber}
              </p>
              <h3
                className={cn(
                  "text-sm font-semibold text-foreground leading-snug line-clamp-2",
                  isOffline && "text-muted-foreground"
                )}
              >
                {job.title}
              </h3>
            </div>
            <button className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 mt-0.5">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{job.location}</p>
        </CardHeader>

        <CardContent className="px-4 pb-4 space-y-3">
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold px-2 py-0.5 backdrop-blur-sm", priority.className)}
          >
            {priority.label} Priority
          </Badge>

          <div className="flex items-center justify-between">
            {job.technician ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6 border border-white/50 dark:border-white/10 shadow-sm">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-[9px] font-bold bg-indigo-100/80 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {job.technician.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground">
                  {job.technician.name}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">Unassigned</span>
            )}
            {isOffline && (
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" style={{ animationDuration: "2s" }} />
            )}
            {isAiReview && (
              <BrainCircuit className="h-3.5 w-3.5 text-violet-500 animate-pulse" />
            )}
          </div>

          <div className="flex items-center gap-1.5 pt-0.5 border-t border-border">
            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground">{job.updatedAt}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({
  column,
  jobs,
}: {
  column: (typeof COLUMNS)[number];
  jobs: Job[];
}) {
  const Icon = column.icon;

  return (
    <div className="flex flex-col min-w-0">
      {/* Column header — glass pill */}
      <div className="glass flex items-center justify-between rounded-t-2xl px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full shadow-sm", column.dotColor)} />
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">
            {column.label}
          </span>
        </div>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/60 dark:bg-black/40 border border-white/60 dark:border-white/10 px-1.5 text-[10px] font-bold text-muted-foreground backdrop-blur-sm">
          {jobs.length}
        </span>
      </div>

      {/* Accent bar */}
      <div className={cn("h-0.5 w-full", column.accentBar)} />

      {/* Cards area — translucent well */}
      <div className="flex-1 rounded-b-2xl bg-white/20 dark:bg-black/10 backdrop-blur-sm border border-border border-t-0 p-2.5 space-y-2.5 min-h-[480px]">
        {jobs.length === 0 ? (
          <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-border">
            <p className="text-xs text-muted-foreground">No jobs here</p>
          </div>
        ) : (
          jobs.map((job, i) => <JobCard key={job.id} job={job} index={i} />)
        )}
      </div>
    </div>
  );
}

// ─── JobBoard ─────────────────────────────────────────────────────────────────

export function JobBoard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to map backend data to frontend Job structure
  const mapBackendJob = (data: any): Job => {
    return {
      id: data.id,
      title: data.title,
      location: data.location || "Unknown Location",
      priority: (data.priority
        ? data.priority.charAt(0).toUpperCase() + data.priority.slice(1)
        : "Medium") as Priority,
      technician: data.technician || null,
      updatedAt: new Date(data.updatedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      column: data.column || data.status || "unassigned",
      jobNumber: data.jobNumber || data.id.slice(0, 8),
    };
  };

  useEffect(() => {
    // 1. Initial Fetch
    fetch("http://localhost:3001/api/jobs")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setJobs(json.data.map(mapBackendJob));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch jobs:", err);
        setLoading(false);
      });

    // 2. Setup Server-Sent Events (SSE)
    const eventSource = new EventSource("http://localhost:3001/api/events");

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.message === "connected") {
          console.log("🟢 SSE Connected successfully");
          return;
        }

        console.log("📥 Real-time job update received:", payload);
        const updatedJob = mapBackendJob(payload);

        setJobs((prevJobs) => {
          const exists = prevJobs.some((j) => j.id === updatedJob.id);
          if (exists) {
            // Overwrite existing job
            return prevJobs.map((j) =>
              j.id === updatedJob.id ? { ...j, ...updatedJob } : j
            );
          }
          // Or add it if it's new
          return [updatedJob, ...prevJobs];
        });
      } catch (err) {
        console.error("Error parsing SSE data", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
    };

    // 3. Cleanup on unmount
    return () => {
      console.log("🔴 Closing SSE connection");
      eventSource.close();
    };
  }, []);

  return (
    <section className="space-y-4">
      {/* Board header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Live Job Board</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time field operations status
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Loading...
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Live
            </span>
          )}
          <Badge
            variant="outline"
            className="text-[10px] border-border text-muted-foreground"
          >
            {jobs.length} total jobs
          </Badge>
        </div>
      </div>

      {/* Kanban grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            jobs={jobs.filter((j) => j.column === col.id)}
          />
        ))}
      </div>
    </section>
  );
}
