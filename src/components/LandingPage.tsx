import React from "react";
import { Shield, ArrowRight, Info } from "lucide-react";
import { motion } from "motion/react";

import { useNavigate } from "react-router-dom";

export function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="glass-bg">
        <div className="glass-blob bg-blue-600 top-[-10%] left-[-10%]" />
        <div className="glass-blob bg-purple-600 bottom-[-10%] right-[-10%]" />
        <div className="glass-blob bg-indigo-600 top-[40%] left-[30%] w-[300px] h-[300px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 max-w-3xl"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-900/40 transform rotate-12">
            <Shield className="w-12 h-12 text-white" />
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent tracking-tight">
          TrustLink
        </h1>
        <p className="text-2xl md:text-3xl font-medium text-white/80 mb-8">
          Verify Before You Trust
        </p>
        <p className="text-lg text-white/50 mb-12 max-w-xl mx-auto leading-relaxed">
          The ultimate scam-verification platform. Protect yourself from phishing, 
          fraud, and malicious links using our advanced NLP analysis and community-driven security.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/auth')}
            className="group px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg flex items-center gap-2 hover:bg-white/90 transition-all shadow-xl shadow-white/10"
          >
            🔐 Authenticate
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <Info className="w-5 h-5" />
            Learn More
          </button>
        </div>
      </motion.div>

      <div className="absolute bottom-8 text-white/20 text-sm font-medium tracking-widest uppercase">
        Secure • Transparent • Community Driven
      </div>
    </div>
  );
}
