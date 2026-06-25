"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthGateway() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    // Calculate rotation (-5 to 5 degrees)
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setMousePos({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock network delay before redirect
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#05050f]">
      {/* Deep fluid mesh-gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#05050f] via-slate-950 to-indigo-950/20" />
      
      {/* Floating orbs for 3D depth */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          x: [0, 10, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px]"
      />
      <motion.div
        animate={{
          y: [0, 30, 0],
          x: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-violet-500/20 blur-[100px]"
      />
      <motion.div
        animate={{
          y: [0, -40, 0],
          x: [0, 30, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px]"
      />

      {/* 3D Container Wrapper */}
      <div className="relative z-10 w-full max-w-[400px] perspective-[1000px] p-4">
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          animate={{
            rotateX: mousePos.x,
            rotateY: mousePos.y,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="backdrop-blur-3xl bg-white/10 dark:bg-slate-900/40 border border-white/20 shadow-2xl rounded-3xl p-6 sm:p-8 w-full transform-gpu"
        >
          {/* Header */}
          <div className="text-center mb-8 min-h-[140px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login" : "signup"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
                  <div className="h-6 w-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  {isLogin
                    ? "Sign in to access your dashboard"
                    : "Enter your details to get started"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full h-11 px-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </motion.div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="hello@atlas-ops.com"
                className="w-full h-11 px-4 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                {isLogin && (
                  <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    Forgot Password?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pl-4 pr-11 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="relative w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-70 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? "Sign In" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-xs text-slate-500 uppercase tracking-wider font-medium">Or</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
