"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function WelcomeBanner() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <div className="glass relative overflow-hidden rounded-3xl p-8 min-h-[200px]" />
    );
  }

  const hour = time.getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 17) greeting = "Good afternoon";

  const dateStr = time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const timeStr = time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div className="glass relative overflow-hidden rounded-3xl p-8 animate-in fade-in duration-500">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 h-40 w-40 rounded-full bg-sky-400/15 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Badge
            variant="secondary"
            className="border-indigo-200/60 dark:border-indigo-500/30 bg-white/50 dark:bg-black/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold backdrop-blur-sm"
          >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 inline-block animate-pulse" />
            Live Operations Active
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-slate-900 via-indigo-600 to-violet-600 dark:from-white dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
              {greeting}, Dheeraj.
            </span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm max-w-lg leading-relaxed">
            Here&apos;s a live overview of your field operations. The AI engine is actively monitoring{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">12 open jobs</span> and has drafted{" "}
            <span className="font-semibold text-violet-600 dark:text-violet-400">3 new reports</span>{" "}
            pending your review.
          </p>
        </div>
        <div className="text-right hidden sm:block text-slate-700 dark:text-slate-300">
          <p className="text-sm font-bold tracking-tight opacity-90 mt-0.5">
            {dateStr}
          </p>
          <p className="text-[10px] mt-1 opacity-60 font-medium">Atlas v1.0 · Production</p>
        </div>
      </div>
    </div>
  );
}
