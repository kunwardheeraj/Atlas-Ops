"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-12 h-full w-full overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">
            Settings
          </h1>

          <div className="backdrop-blur-3xl bg-white/60 dark:bg-slate-950/50 border border-slate-200/60 dark:border-white/10 shadow-2xl rounded-2xl p-6 lg:p-8">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="bg-slate-200/50 dark:bg-black/20 border border-slate-300/50 dark:border-white/5 p-1 rounded-xl mb-8">
                <TabsTrigger value="account" className="rounded-lg data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white">Account</TabsTrigger>
                <TabsTrigger value="appearance" className="rounded-lg data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white">Appearance</TabsTrigger>
                <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white/80 dark:data-[state=active]:bg-white/10 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white">Notifications</TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="space-y-6 outline-none">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Full Name</label>
                    <Input 
                      defaultValue="Dheeraj K." 
                      className="bg-white/40 dark:bg-black/20 border-slate-300/50 dark:border-white/10 focus-visible:ring-indigo-500/30 text-slate-900 dark:text-white shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Email Address</label>
                    <Input 
                      defaultValue="dheeraj@atlas-ops.com" 
                      className="bg-white/40 dark:bg-black/20 border-slate-300/50 dark:border-white/10 focus-visible:ring-indigo-500/30 text-slate-900 dark:text-white shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Role</label>
                    <Input 
                      defaultValue="Dispatcher" 
                      disabled
                      className="bg-slate-100/50 dark:bg-white/5 border-slate-300/50 dark:border-white/5 text-slate-500 dark:text-slate-500 opacity-70"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 mt-6 flex justify-end">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                    Save Changes
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6 outline-none">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/10 border border-slate-200/50 dark:border-white/5">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">Theme Preference</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Switch between light and dark mode across the entire app.</p>
                    </div>
                    {mounted && (
                      <div className="flex bg-slate-200/50 dark:bg-black/40 border border-slate-300/50 dark:border-white/10 p-1 rounded-xl">
                        <button
                          onClick={() => setTheme('light')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                        >
                          Light
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${theme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                        >
                          Dark
                        </button>
                        <button
                          onClick={() => setTheme('system')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'}`}
                        >
                          System
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 mt-6 flex justify-end">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                    Save Changes
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6 outline-none">
                <div className="space-y-3">
                  {[
                    { title: "Email Alerts", desc: "Receive daily summaries and critical job updates via email.", defaultChecked: true },
                    { title: "SMS Updates", desc: "Get text messages when field technicians are delayed.", defaultChecked: false },
                    { title: "AI Report Summaries", desc: "Automatically generate and notify you of AI job reports.", defaultChecked: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/30 dark:bg-black/10 border border-slate-200/50 dark:border-white/5">
                      <div className="pr-4">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{item.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                      </div>
                      <Switch defaultChecked={item.defaultChecked} className="data-[state=checked]:bg-indigo-500" />
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 mt-6 flex justify-end">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                    Save Changes
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
