import React from "react";
import { ShieldAlert, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { motion } from "motion/react";

interface AnalysisResultProps {
  result: {
    score: number;
    riskLevel: "low" | "medium" | "high";
    findings: string[];
    aiAnalysis?: string;
  };
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return "text-red-400";
      case "medium": return "text-yellow-400";
      case "low": return "text-green-400";
      default: return "text-blue-400";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "high": return <ShieldAlert className="w-8 h-8 text-red-400" />;
      case "medium": return <AlertTriangle className="w-8 h-8 text-yellow-400" />;
      case "low": return <ShieldCheck className="w-8 h-8 text-green-400" />;
      default: return <Info className="w-8 h-8 text-blue-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto mt-8 space-y-6"
    >
      <GlassCard className="border-l-4 border-l-current" style={{ borderLeftColor: result.riskLevel === 'high' ? '#f87171' : result.riskLevel === 'medium' ? '#fbbf24' : '#4ade80' }}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/5 rounded-2xl">
            {getRiskIcon(result.riskLevel)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xl font-bold capitalize">{result.riskLevel} Risk Detected</h3>
              <span className="text-2xl font-mono font-bold">{(result.score * 100).toFixed(0)}%</span>
            </div>
            <p className="text-white/60 text-sm mb-4">
              Our automated system has evaluated the content and assigned a risk score based on known scam patterns.
            </p>
            
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">Key Findings</h4>
              <div className="flex flex-wrap gap-2">
                {result.findings.map((finding, i) => (
                  <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs">
                    {finding}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {result.aiAnalysis && (
        <GlassCard gradient>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-blue-400">AI Deep Analysis</h4>
          </div>
          <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
            {result.aiAnalysis}
          </p>
        </GlassCard>
      )}
    </motion.div>
  );
}
