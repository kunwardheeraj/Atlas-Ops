"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  FileText,
  Map,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Live Board", icon: LayoutGrid },
  { href: "/dashboard/reports", label: "AI Reports", icon: FileText },
  { href: "/dashboard/map-view", label: "Map View", icon: Map },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex h-full flex-col overflow-hidden shrink-0 glass"
    >
      {/* Subtle top glow orb */}
      <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-indigo-500/20 blur-3xl" />

      {/* Logo */}
      <Link href="/dashboard" className="flex h-16 items-center gap-3 px-4 border-b border-border relative z-10 hover:opacity-80 transition-opacity">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="text-base font-bold tracking-tight text-foreground whitespace-nowrap"
            >
              Atlas<span className="text-indigo-500 dark:text-indigo-400"> Ops</span>
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3 mt-2 relative z-10">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "text-indigo-700 dark:text-indigo-300"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl bg-indigo-500/10 dark:bg-white/10 border border-indigo-500/20 dark:border-white/20 backdrop-blur-sm shadow-inner"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {!active && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900/5 dark:bg-white/5" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 relative z-10 transition-colors",
                  active ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    transition={{ duration: 0.15 }}
                    className="relative z-10 whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-border relative z-10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-xl p-2 text-muted-foreground hover:bg-slate-900/5 dark:hover:bg-white/10 hover:text-foreground transition-all duration-150"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
