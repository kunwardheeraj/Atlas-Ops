"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";

interface JobResult {
  id: string;
  title: string;
  jobNumber: string;
  status: string;
  location: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setLoading(true);
      fetch("/api/jobs")
        .then((res) => res.json())
        .then((data) => {
          setJobs(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch jobs for search:", err);
          setLoading(false);
        });
        
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredJobs = jobs.filter((job) => {
    if (!query) return true;
    const lowerQuery = query.toLowerCase();
    return (
      job.title.toLowerCase().includes(lowerQuery) ||
      job.jobNumber.toLowerCase().includes(lowerQuery) ||
      job.status.toLowerCase().includes(lowerQuery)
    );
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 sm:pt-32">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 backdrop-blur-sm bg-black/20 dark:bg-black/40 transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl px-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="backdrop-blur-3xl bg-white/70 dark:bg-slate-950/80 shadow-2xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col">
          {/* Search Input Area */}
          <div className="flex items-center px-4 py-4 border-b border-slate-200/50 dark:border-white/10">
            <Search className="h-5 w-5 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search jobs, reports, technicians..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none px-3 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
            />
            {loading && <Loader2 className="h-5 w-5 text-indigo-500 animate-spin shrink-0" />}
            <div className="hidden sm:flex items-center gap-1 shrink-0 ml-2">
              <kbd className="h-5 px-1.5 rounded bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-center">ESC</kbd>
            </div>
          </div>

          {/* Results Area */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!loading && filteredJobs.length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No results found for &quot;{query}&quot;
              </div>
            )}
            
            {filteredJobs.map((job) => (
              <button
                key={job.id}
                onClick={onClose}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/5">
                      {job.jobNumber}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {job.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${job.status === 'in_progress' ? 'bg-indigo-500' : job.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className="capitalize">{job.status.replace('_', ' ')}</span>
                    </span>
                    <span>•</span>
                    <span>{job.location}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
