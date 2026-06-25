"use client";

import { useState, useEffect } from "react";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GlobalSearch } from "@/components/GlobalSearch";

export function TopNav() {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 px-6 glass-nav">
      {/* Search Trigger */}
      <div className="relative flex-1 max-w-md">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full h-9 pl-9 pr-4 rounded-xl text-sm bg-white/40 dark:bg-black/20 border border-white/40 dark:border-white/10 text-slate-400 dark:text-slate-500 hover:bg-white/60 dark:hover:bg-white/5 outline-none focus:ring-2 focus:ring-indigo-500/20 backdrop-blur-sm transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Search className="absolute left-3 h-4 w-4 text-slate-400" />
            <span>Search jobs, reports, technicians...</span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <ThemeToggle />

        {/* Notification bell */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex items-center justify-center h-9 w-9 rounded-xl text-slate-500 hover:bg-black/5 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-indigo-400 transition-all cursor-pointer outline-none border-none bg-transparent">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white/60 dark:ring-slate-900/60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 backdrop-blur-3xl bg-white/70 dark:bg-slate-950/80 shadow-2xl border border-white/20 dark:border-white/10 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-semibold">1 New</span>
            </div>
            <div className="flex flex-col">
              <div className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-border/50">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">Job #4821 Update</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">Technician Marcus Webb has arrived at One Liberty Plaza.</p>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">2 mins ago</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer opacity-70">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-slate-500" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">AI Report Generated</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">A new report is ready for review for Job #4806.</p>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5">22 mins ago</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-2 border-t border-border">
              <Button variant="ghost" className="w-full text-xs text-indigo-500 hover:text-indigo-600 hover:bg-indigo-500/10 h-8">
                Mark all as read
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer outline-none border-none bg-transparent">
            <Avatar className="h-7 w-7 border border-black/10 dark:border-white/20 shadow-sm">
              <AvatarImage src="" alt="Dheeraj" />
              <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-violet-500 text-white text-xs font-bold">
                DK
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start leading-tight hidden sm:flex">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Dheeraj K.</span>
              <span className="text-[10px] text-slate-600 dark:text-slate-300">Dispatcher</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 backdrop-blur-3xl bg-white/70 dark:bg-slate-950/80 shadow-2xl border border-white/20 dark:border-white/10">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Dheeraj K.</span>
                <span className="text-xs text-slate-600 dark:text-slate-300">dheeraj@atlas-ops.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-slate-900 dark:text-white rounded-md transition-colors">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-slate-900 dark:text-white rounded-md transition-colors w-full">
                Workspace Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer text-slate-900 dark:text-white rounded-md transition-colors">
              Keyboard Shortcuts
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="text-red-500 hover:text-red-600 hover:bg-red-500/10 cursor-pointer rounded-md transition-colors">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
