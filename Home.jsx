
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Brain, CheckCircle, TrendingUp, Lock, Mail, Eye, EyeOff, AlertCircle, Loader2, ArrowRight, Sparkles, Users, Target, Award, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (email && password) {
      navigate(createPageUrl("Applications"));
    } else {
      setError("Invalid credentials");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 relative overflow-hidden">
      {/* Enhanced animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [-20, 20, -20],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
        />
      </div>

      {/* Animated grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Floating particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{
            width: Math.random() * 4 + 2 + 'px',
            height: Math.random() * 4 + 2 + 'px',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100 - Math.random() * 100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-12">
        <div className="max-w-7xl w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Hero Section */}
            <motion.div
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-white space-y-12"
            >
              {/* Logo & Title */}
              <div className="space-y-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 120 }}
                  className="inline-flex items-center gap-6"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] blur-2xl opacity-60"
                    />
                    <div className="relative w-28 h-28 rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                      <Shield className="w-14 h-14 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-7xl font-black tracking-tight">DHRD</h1>
                    <p className="text-2xl text-indigo-300 font-semibold mt-1">Screener AI</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h2 className="text-6xl lg:text-7xl font-black leading-[1.1] mb-8">
                    Transform Your<br />
                    <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Hiring Process
                    </span>
                  </h2>
                  <p className="text-2xl text-indigo-200 leading-relaxed max-w-xl font-medium">
                    State-of-the-art AI that screens, analyzes, and ranks candidates in seconds — built for Hawaii State Government
                  </p>
                </motion.div>
              </div>

              {/* Feature Stats Grid */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="grid grid-cols-2 gap-5"
              >
                {[
                  { icon: Brain, label: "AI Accuracy", value: "95%", subtext: "Precision", color: "from-blue-500 to-cyan-500" },
                  { icon: Zap, label: "Processing", value: "10x", subtext: "Faster", color: "from-purple-500 to-pink-500" },
                  { icon: Target, label: "Match Rate", value: "98%", subtext: "Success", color: "from-green-500 to-emerald-500" },
                  { icon: Award, label: "Security", value: "100%", subtext: "Secure", color: "from-amber-500 to-orange-500" }
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + idx * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="relative group cursor-default"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                    <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all shadow-xl">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 shadow-lg`}>
                        <stat.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-4xl font-black mb-1">{stat.value}</div>
                      <div className="text-sm text-indigo-300 font-medium">{stat.subtext}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 border-4 border-slate-950 flex items-center justify-center shadow-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">Hawaii State Government</p>
                    <p className="text-indigo-300 text-sm">HACC 2025 Innovation Project</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {['AI-Powered', 'Enterprise Grade', 'Real-time Analytics'].map((badge, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.6 + idx * 0.1 }}
                      className="px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-sm font-semibold text-indigo-200"
                    >
                      ✨ {badge}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Login Card */}
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-[2.5rem] blur-3xl" />
              
              <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-12 border-2 border-white/20">
                {/* Header */}
                <div className="text-center mb-10">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="inline-flex items-center justify-center mb-6"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur-2xl opacity-40" />
                      <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl">
                        <Lock className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </motion.div>
                  <h3 className="text-4xl font-black text-slate-900 mb-3">Welcome Back</h3>
                  <p className="text-slate-600 text-lg font-medium">Sign in to access your dashboard</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@hawaii.gov"
                        className="pl-14 h-16 text-lg border-2 border-slate-300 focus:border-indigo-500 rounded-2xl font-medium shadow-sm"
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-14 pr-14 h-16 text-lg border-2 border-slate-300 focus:border-indigo-500 rounded-2xl font-medium shadow-sm"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                        disabled={loading}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 flex items-center gap-3"
                      >
                        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-red-800">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between text-sm pt-2">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
                        disabled={loading} 
                      />
                      <span className="text-slate-700 group-hover:text-slate-900 transition-colors font-medium">Remember me</span>
                    </label>
                    <a href="#" className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors">
                      Forgot password?
                    </a>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={loading || !email || !password}
                      className="w-full h-16 text-lg font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                      {loading ? (
                        <span className="flex items-center justify-center relative z-10">
                          <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                          Signing In...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center relative z-10">
                          Sign In to Dashboard
                          <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>

                {/* Demo Notice */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border-2 border-blue-200"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <p className="text-base font-black text-blue-900 uppercase tracking-wide">Demo Mode</p>
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-center text-blue-700 leading-relaxed font-medium">
                    Enter any valid email and password (6+ characters) to explore the system
                  </p>
                </motion.div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t-2 border-slate-200 text-center space-y-4">
                  <p className="text-sm text-slate-700 font-medium">
                    Need access?{" "}
                    <a href="#" className="text-indigo-600 hover:text-indigo-700 font-black transition-colors">
                      Contact Administrator
                    </a>
                  </p>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="font-bold">Hawaii Department of Human Resources Development</p>
                    <p>HACC 2025 Innovation • Powered by Advanced AI</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-0 right-0 text-center text-indigo-300 text-sm z-10 font-medium"
      >
        <p>© 2025 Hawaii State Government. All Rights Reserved.</p>
      </motion.div>
    </div>
  );
}
