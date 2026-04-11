"use client";

import React from "react";
import { motion } from "framer-motion";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Button } from "../ui/button";
import { InfiniteSlider } from "../ui/infinite-slider";
import { useNavigate } from "react-router-dom";
import { 
  BsShieldLock as BsShieldLockRaw, 
  BsLock as BsLockRaw 
} from "react-icons/bs";
import { AiOutlineEye as AiOutlineEyeRaw } from "react-icons/ai";
import { RiAlertLine as RiAlertLineRaw } from "react-icons/ri";

const BsShieldLock = BsShieldLockRaw as any;
const BsLock = BsLockRaw as any;
const AiOutlineEye = AiOutlineEyeRaw as any;
const RiAlertLine = RiAlertLineRaw as any;

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen w-full bg-black text-white overflow-hidden flex flex-col items-center">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full" />
      </div>

      {/* Nav Placeholder (matches floating pill style from previous chats) */}
      <nav className="fixed top-6 z-50 px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full flex items-center gap-8">
        <div className="flex items-center gap-2">
          <BsShieldLock className="w-5 h-5 text-white" />
          <span className="font-bold tracking-tighter">TrustLink</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400 font-medium">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#security" className="hover:text-white transition-colors">Security</a>
          <a href="#community" className="hover:text-white transition-colors">Community</a>
        </div>
        <Button 
          variant="default" 
          size="sm" 
          className="rounded-full bg-white text-black font-bold h-8 px-4"
          onClick={() => navigate('/auth')}
        >
          Sign In
        </Button>
      </nav>

      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 lg:pt-48 flex flex-col lg:flex-row items-center justify-between w-full">
        {/* Left Content */}
        <div className="lg:w-1/2 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-widest text-zinc-300 mb-6 font-mono">
              <BsLock className="w-3 h-3" />
              Verified Trust Architecture
            </div>
            
            <h1 className="text-6xl md:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.9] text-white">
              TrustLink
            </h1>
            
            <p className="mt-6 text-2xl md:text-3xl font-bold text-zinc-400 tracking-tight">
              Verify Before You Trust
            </p>
            
            <p className="mt-6 text-lg text-zinc-500 max-w-lg leading-relaxed">
              AI-powered scam detection using NLP + community verification.
              Protect yourself from phishing, fraud, and malicious links with real-time intelligence.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full sm:w-auto bg-white text-black px-10 py-7 text-lg font-bold rounded-2xl hover:scale-105 transition-all shadow-2xl shadow-white/10"
              >
                Authenticate →
              </Button>
              <Button 
                variant="ghost" 
                className="text-white text-lg font-bold px-8 hover:bg-white/10"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Right Animation */}
        <div className="lg:w-1/2 flex justify-center mt-20 lg:mt-0 relative lg:translate-x-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Glow backing */}
            <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full scale-75 animate-pulse" />
            
            <DotLottieReact
              src="https://lottie.host/64780a8b-9efe-4150-a0a5-b3cd13778c68/yNYY2hjcwe.lottie"
              loop
              autoplay
              className="w-[450px] md:w-[700px] lg:w-[900px] relative z-10 drop-shadow-[0_0_80px_rgba(255,255,255,0.05)]"
            />
          </motion.div>
        </div>
      </div>

      {/* Social Proof / Infinite Slider */}
      <div className="mt-auto py-20 w-full overflow-hidden">
        <div className="text-center mb-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Trusted by modern security teams</p>
          <div className="h-[1px] w-20 bg-zinc-800 mx-auto" />
        </div>
        
        <InfiniteSlider duration={30} gap={80} className="py-4">
          {[
            { icon: BsShieldLock, name: "SecuNet" },
            { icon: BsLock, name: "SafeNode" },
            { icon: AiOutlineEye, name: "OmniView" },
            { icon: RiAlertLine, name: "RiskRadar" },
            { icon: BsShieldLock, name: "CyberWard" },
            { icon: BsLock, name: "AuthGuard" }
          ].map((brand, i) => {
            const BrandIcon = brand.icon as any;
            return (
              <div key={i} className="flex items-center gap-3 grayscale opacity-30 hover:opacity-100 transition-opacity group cursor-default">
                <BrandIcon className="w-6 h-6 text-white" />
                <span className="font-bold text-xl tracking-tighter text-white">{brand.name}</span>
              </div>
            );
          })}
        </InfiniteSlider>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl w-full px-6 mb-24 mt-12">
        {[
          { label: "Analyses", value: "1.2M+" },
          { label: "Detections", value: "482K" },
          { label: "Accuracy", value: "99.9%" },
          { label: "Community", value: "85K+" }
        ].map((stat, i) => (
          <div key={i} className="text-center lg:text-left">
            <div className="text-4xl font-black tracking-tight text-white">{stat.value}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
