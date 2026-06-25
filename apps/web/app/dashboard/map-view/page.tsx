"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LocateFixed } from "lucide-react";
import type { InteractiveMapRef, Job } from "@/components/InteractiveMap";

// ─── Dynamically import Leaflet map with SSR disabled ─────────────────────────
const InteractiveMap = dynamic(() => import("@/components/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-[#05050f]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading map…</p>
      </div>
    </div>
  ),
});

// ─── Status and Priority helpers ──────────────────────────────────────────────

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
};

const STATUS_COLOR: Record<string, string> = {
  unassigned: "text-slate-400",
  in_progress: "text-indigo-400",
  offline_syncing: "text-amber-400",
  needs_ai_review: "text-violet-400",
  completed: "text-emerald-400",
};

const STATUS_LABEL: Record<string, string> = {
  unassigned: "Unassigned",
  in_progress: "In Progress",
  offline_syncing: "Offline Sync",
  needs_ai_review: "AI Review",
  completed: "Completed",
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function MapViewPage() {
  const mapRef = useRef<InteractiveMapRef>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("New York City, NY");

  // ── Fetch jobs from backend ──
  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await fetch("http://localhost:3001/api/jobs");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setJobs(json.data ?? []);
      } catch (e: any) {
        setError(e.message ?? "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  // ── Fly to job when sidebar row clicked ──
  const handleSidebarClick = useCallback((job: Job) => {
    setSelectedJob(job);
    if (job.coordinates) {
      mapRef.current?.flyTo(job.coordinates.lat, job.coordinates.lng);
    }
  }, []);

  // ── Locate User ──
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        mapRef.current?.flyTo(latitude, longitude);

        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          if (res.ok) {
            const data = await res.json();
            const place =
              data.address?.city ||
              data.address?.town ||
              data.address?.village ||
              data.address?.county ||
              "Current Location";
            const state = data.address?.state || "";
            setLocationName(state ? `${place}, ${state}` : place);
          }
        } catch (err) {
          // fallback if API fails
          setLocationName("Current Location");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        alert("Unable to retrieve your location");
      }
    );
  }, []);

  // ── Auto-locate on mount ──
  useEffect(() => {
    handleLocateMe();
  }, [handleLocateMe]);

  const jobsWithCoords = jobs.filter((j) => j.coordinates !== null);
  const activeJobs = jobs.filter(
    (j) => j.status !== "completed" && j.coordinates
  );

  return (
    <DashboardLayout>
      <div className="relative flex h-full w-full overflow-hidden">
      {/* ── Glassmorphic sidebar ────────────────────────────────────────── */}
      <aside className="relative z-10 flex w-80 shrink-0 flex-col backdrop-blur-2xl bg-white/60 dark:bg-slate-950/50 border-r border-slate-200/50 dark:border-white/10 text-slate-900 dark:text-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-200/50 dark:border-white/8">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Live Field Map
            </h2>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 dark:border-emerald-400/20 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {jobsWithCoords.length} active sites · {activeJobs.length} in field
          </p>
        </div>

        {/* Legend */}
        <div className="flex gap-3 px-5 py-3 border-b border-slate-200/50 dark:border-white/8">
          {[
            { label: "High", cls: "bg-red-500" },
            { label: "Medium", cls: "bg-amber-400" },
            { label: "Low", cls: "bg-emerald-500" },
          ].map(({ label, cls }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${cls}`} />
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Job list */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
          )}
          {error && (
            <div className="m-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}
          {!loading && !error && jobs.length === 0 && (
            <p className="text-center text-slate-500 text-sm mt-10">No jobs found.</p>
          )}
          {jobs.map((job) => {
            const isSelected = selectedJob?.id === job.id;
            const dotCls = PRIORITY_DOT[job.priority] ?? "bg-slate-500";
            const statusCls = STATUS_COLOR[job.status] ?? "text-slate-400";
            const hasCoords = !!job.coordinates;

            return (
              <button
                key={job.id}
                onClick={() => hasCoords && handleSidebarClick(job)}
                disabled={!hasCoords}
                className={`
                  w-full text-left px-5 py-3.5 border-b border-slate-200/50 dark:border-white/5 transition-all duration-150
                  ${isSelected
                    ? "bg-indigo-500/10 dark:bg-indigo-500/15 border-l-2 border-l-indigo-500"
                    : "hover:bg-slate-900/5 dark:hover:bg-white/5 border-l-2 border-l-transparent"
                  }
                  ${!hasCoords ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    <span className={`block h-2.5 w-2.5 rounded-full ${dotCls}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-slate-500">
                        {job.jobNumber}
                      </span>
                      <span className={`text-[10px] font-semibold ${statusCls}`}>
                        {STATUS_LABEL[job.status] ?? job.status}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-tight">
                      {job.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      📍 {job.location}
                    </p>
                    {job.technician && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/30 text-[8px] font-bold text-indigo-700 dark:text-indigo-300">
                          {job.technician.initials}
                        </span>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400">
                          {job.technician.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer stat strip */}
        <div className="px-5 py-3 border-t border-slate-200/50 dark:border-white/8 grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Total", val: jobs.length },
            { label: "Active", val: jobs.filter((j) => j.status === "in_progress").length },
            { label: "High Pri", val: jobs.filter((j) => j.priority === "high").length },
          ].map(({ label, val }) => (
            <div key={label}>
              <p className="text-base font-bold text-slate-900 dark:text-white">{val}</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Map area ───────────────────────────────────────────────────── */}
      <div className="relative flex-1 h-full">
        {/* Floating top bar */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/60 dark:border-white/10 rounded-2xl px-4 py-2.5 shadow-xl pointer-events-auto">
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {selectedJob
                ? `📍 Viewing: ${selectedJob.title}`
                : "Click a marker or select a job from the sidebar"}
            </p>
          </div>
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-950/60 border border-slate-200/60 dark:border-white/10 rounded-2xl px-4 py-2.5 shadow-xl transition-all">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {locating ? "Locating..." : locationName}
              </p>
            </div>
            <button
              onClick={handleLocateMe}
              disabled={locating}
              className="backdrop-blur-xl bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-500/80 dark:hover:bg-indigo-600/90 disabled:bg-indigo-300 dark:disabled:bg-indigo-500/50 border border-indigo-400/30 rounded-2xl p-2.5 shadow-xl transition-all text-white"
              title="My Location"
            >
              <LocateFixed className={`h-4 w-4 ${locating ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <InteractiveMap
          ref={mapRef}
          jobs={jobs}
          onJobClick={handleSidebarClick}
          userLocation={userLocation ?? undefined}
        />
      </div>

      {/* ── Custom Leaflet popup styles ─────────────────────────────────── */}
      <style>{`
        .atlas-glass-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.4) inset;
          padding: 0;
          overflow: hidden;
        }
        .dark .atlas-glass-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 15, 35, 0.92);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.08) inset;
        }
        .atlas-glass-popup .leaflet-popup-content {
          margin: 0;
        }
        .atlas-glass-popup .leaflet-popup-tip-container {
          display: none;
        }
        .atlas-glass-popup .leaflet-popup-close-button {
          color: rgba(0,0,0,0.5) !important;
          font-size: 18px;
          top: 8px !important;
          right: 8px !important;
        }
        .dark .atlas-glass-popup .leaflet-popup-close-button {
          color: rgba(255,255,255,0.5) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(255,255,255,0.85) !important;
          backdrop-filter: blur(12px);
          border-color: rgba(0,0,0,0.1) !important;
          color: #334155 !important;
        }
        .dark .leaflet-control-zoom a {
          background: rgba(15,15,35,0.85) !important;
          border-color: rgba(255,255,255,0.12) !important;
          color: #e2e8f0 !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(99,102,241,0.1) !important;
          color: #4f46e5 !important;
        }
        .dark .leaflet-control-zoom a:hover {
          background: rgba(99,102,241,0.3) !important;
          color: white !important;
        }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.5) !important;
          color: rgba(0,0,0,0.5) !important;
          font-size: 9px !important;
          backdrop-filter: blur(8px);
        }
        .dark .leaflet-control-attribution {
          background: rgba(0,0,0,0.5) !important;
          color: rgba(255,255,255,0.3) !important;
        }
        .leaflet-control-attribution a { color: rgba(0,0,0,0.6) !important; }
        .dark .leaflet-control-attribution a { color: rgba(255,255,255,0.4) !important; }
      `}</style>
      </div>
    </DashboardLayout>
  );
}
