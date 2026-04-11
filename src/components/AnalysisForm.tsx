import React, { useState } from "react";
import { Search, ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { motion } from "motion/react";

interface AnalysisFormProps {
  onAnalyze: (content: string) => Promise<void>;
  isLoading: boolean;
}

export function AnalysisForm({ onAnalyze, isLoading }: AnalysisFormProps) {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onAnalyze(content);
    }
  };

  return (
    <GlassCard className="w-full max-w-2xl mx-auto" gradient>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold">TrustLink Scanner</h2>
        </div>
        
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste a suspicious link or message here..."
            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Search className="w-5 h-5" />
              Analyze Security
            </>
          )}
        </button>
      </form>
    </GlassCard>
  );
}
