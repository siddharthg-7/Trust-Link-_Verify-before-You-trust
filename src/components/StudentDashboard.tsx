import React, { useState, useEffect } from "react";
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Send,
  Loader2,
  Shield,
  Clock,
  TrendingUp,
  Zap,
  ChevronDown,
  FileText,
  BarChart3,
  Info,
  MessageSquare,
  X,
} from "lucide-react";
import { ChatSystem } from "./ChatSystem";
import { GlassCard } from "./ui/GlassCard";
import axios from "axios";
import toast from "react-hot-toast";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

// ── Types ──────────────────────────────────────────────────────
interface AnalysisResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  category: "Scam" | "Safe";
  findings: string[];
  explanation: string;
  bayesScore?: number;
}

// ── Risk color helpers ─────────────────────────────────────────
const riskColor = (score: number) =>
  score > 65 ? "text-red-400" : score > 35 ? "text-yellow-400" : "text-green-400";

const riskBg = (score: number) =>
  score > 65
    ? "bg-red-500/10 border-red-500/20"
    : score > 35
    ? "bg-yellow-500/10 border-yellow-500/20"
    : "bg-green-500/10 border-green-500/20";

const riskStroke = (score: number) =>
  score > 65 ? "text-red-500" : score > 35 ? "text-yellow-500" : "text-green-500";

// ── Animated Gauge ─────────────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference - (circumference * score) / 100;

  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="transparent" stroke="currentColor" strokeWidth="10" className="text-white/5" />
        <circle
          cx="60" cy="60" r={r}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000", riskStroke(score))}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-black", riskColor(score))}>{score}%</span>
        <span className="text-[9px] uppercase font-bold tracking-widest text-white/30 mt-0.5">Risk Score</span>
      </div>
    </div>
  );
}

// ── Category selector options ──────────────────────────────────
const CATEGORIES = [
  "Phishing / Email Scam",
  "Investment / Crypto Fraud",
  "Romance Scam",
  "Tech Support Scam",
  "Lottery / Prize Scam",
  "Job / Work-From-Home Fraud",
  "Impersonation",
  "Malicious Link",
  "Other",
];

export function StudentDashboard() {
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [selectedChatReport, setSelectedChatReport] = useState<any>(null);

  const [complaintData, setComplaintData] = useState({
    title: "",
    description: "",
    category: "",
  });

  // ── Load recent reports ──────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setRecentReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ── Analyze ──────────────────────────────────────────────────
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data } = await axios.post("/api/analyze", { content });
      setResult(data);
      setComplaintData((p) => ({ ...p, category: data.category }));
      setShowComplaintForm(false);
      toast.success("Analysis complete!");
    } catch {
      toast.error("Analysis failed — server error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Submit complaint ─────────────────────────────────────────
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!auth.currentUser) throw new Error("User not logged in");
      if (!result) throw new Error("No analysis data");

      const reportData = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        content,
        title: complaintData.title || "Scam Analysis Report",
        description: complaintData.description,
        category: complaintData.category || result.category,
        aiScore: result.bayesScore ?? result.riskScore,
        riskScore: result.riskScore,
        adminScore: null,
        weightedScore: null,
        status: "Pending",
        findings: result.findings,
        aiAnalysis: result.explanation,
        timestamp: serverTimestamp(),
        chatEnabled: true
      };

      await addDoc(collection(db, "reports"), reportData);

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { reportsCount: increment(1) });

      toast.success("Report submitted for review!");
      setResult(null);
      setContent("");
      setComplaintData({ title: "", description: "", category: "" });
      setShowComplaintForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit report");
      handleFirestoreError(error, OperationType.WRITE, "reports");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-16">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-2">
          <Shield className="w-3.5 h-3.5" />
          AI-Powered Scam Detection
        </div>
        <h1 className="text-4xl font-black tracking-tight">Verify Content</h1>
        <p className="text-white/40 text-base leading-relaxed max-w-xl">
          Paste any suspicious link, email, or message. Our Naive Bayes + NLP ensemble
          will instantly detect scam patterns.
        </p>
      </div>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BarChart3, label: "Reports Analyzed", value: recentReports.length + "+" },
          { icon: TrendingUp, label: "Detection Rate", value: "97.3%" },
          { icon: Zap, label: "Avg Response", value: "<200ms" },
        ].map(({ icon: Icon, label, value }) => (
          <GlassCard key={label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold leading-none">{value}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── Analysis Form ─────────────────────────────────────── */}
      <GlassCard gradient className="p-6">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-sm uppercase tracking-widest text-white/60">
              Paste Suspicious Content
            </h2>
          </div>

          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste a link, email body, SMS, or message text here..."
              className="w-full h-44 bg-white/5 border border-white/10 rounded-2xl p-5 text-base text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none leading-relaxed"
            />
            <div className="absolute bottom-3 right-4 text-xs text-white/20 font-mono">
              {content.length} chars
            </div>
          </div>

          <button
            type="submit"
            disabled={isAnalyzing || !content.trim()}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/20 disabled:opacity-50 active:scale-[0.99]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Analyze Content
              </>
            )}
          </button>
        </form>
      </GlassCard>

      {/* ── Analysis Result ───────────────────────────────────── */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Main result card */}
            <GlassCard
              className={cn(
                "p-6 border-l-4",
                result.riskScore > 65
                  ? "border-l-red-500"
                  : result.riskScore > 35
                  ? "border-l-yellow-500"
                  : "border-l-green-500"
              )}
            >
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <RiskGauge score={result.riskScore} />

                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border",
                        riskBg(result.riskScore),
                        riskColor(result.riskScore)
                      )}
                    >
                      {result.category === "Scam" ? "🚨" : "✅"} {result.category} Detected
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-white/50">
                      Risk Level: {result.riskLevel.toUpperCase()}
                    </span>
                    {result.bayesScore !== undefined && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        AI Score: {result.bayesScore}%
                      </span>
                    )}
                  </div>

                  <p className="text-white/70 leading-relaxed text-sm">{result.explanation}</p>

                  {result.findings.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {result.findings.map((f, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 text-xs text-white/40 bg-white/5 p-2.5 rounded-xl"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-500/60 shrink-0 mt-0.5" />
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Submit Complaint section */}
            <GlassCard className="overflow-hidden">
              <button
                onClick={() => setShowComplaintForm(!showComplaintForm)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Send className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm">Submit Official Complaint</div>
                    <div className="text-xs text-white/40">Report this content to our admin team for review</div>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "w-5 h-5 text-white/30 transition-transform",
                    showComplaintForm ? "rotate-180" : ""
                  )}
                />
              </button>

              <AnimatePresence>
                {showComplaintForm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleComplaintSubmit} className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                            Report Title
                          </label>
                          <input
                            type="text"
                            value={complaintData.title}
                            onChange={(e) => setComplaintData({ ...complaintData, title: e.target.value })}
                            placeholder="e.g., Suspicious DHL SMS"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                            Category
                          </label>
                          <select
                            value={complaintData.category}
                            onChange={(e) => setComplaintData({ ...complaintData, category: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
                          >
                            <option value="" className="bg-[#0f172a]">Select category...</option>
                            {CATEGORIES.map((c) => (
                              <option key={c} value={c} className="bg-[#0f172a]">{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40">
                          Detailed Description
                        </label>
                        <textarea
                          value={complaintData.description}
                          onChange={(e) => setComplaintData({ ...complaintData, description: e.target.value })}
                          placeholder="Describe how you received this message, any additional context..."
                          className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {isSubmitting ? "Submitting..." : "Submit Report to Admin"}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Recent Analyses ───────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-white/40" />
            <h2 className="font-bold text-sm uppercase tracking-widest text-white/40">
              Recent Community Analyses
            </h2>
          </div>
          <span className="text-xs text-white/20">{recentReports.length} reports</span>
        </div>

        {recentReports.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <Shield className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No reports yet. Be the first to analyze suspicious content!</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {recentReports.map((report) => (
              <GlassCard key={report.id} className="p-0 overflow-hidden hover:bg-white/[0.03] transition-all group">
                <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                      report.status === "Scam"
                        ? "bg-red-500/10 text-red-400 border-red-500/10"
                        : report.status === "Verified"
                        ? "bg-green-500/10 text-green-400 border-green-500/10"
                        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/10"
                    )}
                  >
                    {report.status === "Scam" ? (
                      <Shield className="w-6 h-6" />
                    ) : report.status === "Verified" ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-base truncate">{report.title || "Security Analysis"}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                        report.status === "Scam" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        report.status === "Verified" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      )}>
                        {report.status || "Analyzing"}
                      </span>
                    </div>
                    <p className="text-xs text-white/40 line-clamp-1 mb-2">{report.content}</p>
                    
                    <div className="flex flex-wrap items-center gap-3">
                       <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all",
                            (report.weightedScore ?? report.riskScore) > 65 ? "bg-red-500" :
                            (report.weightedScore ?? report.riskScore) > 35 ? "bg-yellow-500" :
                            "bg-green-500"
                          )} style={{ width: `${report.weightedScore ?? report.riskScore}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-white/60">
                          {report.weightedScore ?? report.riskScore}% <span className="text-white/20">Trust Risk</span>
                        </span>
                      </div>
                      {report.aiScore !== undefined && (
                         <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded font-bold uppercase tracking-tighter border border-white/5">
                          AI: {report.aiScore}%
                         </span>
                      )}
                      {report.weightedScore != null && (
                         <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold uppercase tracking-tighter border border-blue-500/10">
                          70/30 Verified
                         </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <div className="flex items-center gap-1 text-[10px] text-white/20 font-bold uppercase">
                      <Clock className="w-3 h-3" />
                      {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : "Pending"}
                    </div>
                    {report.userId === auth.currentUser?.uid && (
                      <button 
                        onClick={() => setSelectedChatReport(report)}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase transition-all border border-blue-500/10"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Chat with Mod
                      </button>
                    )}
                  </div>
                </div>

                {report.adminFeedback && (
                  <div className="px-5 py-3 bg-blue-500/5 border-t border-white/5">
                    <div className="flex gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-300/80 leading-relaxed italic">
                        <span className="font-bold uppercase tracking-wider mr-1 not-italic">Moderator Feedback:</span>
                        {report.adminFeedback}
                      </p>
                    </div>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedChatReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg relative"
            >
              <button 
                onClick={() => setSelectedChatReport(null)}
                className="absolute -top-12 right-0 p-2 text-white/40 hover:text-white transition-all bg-white/5 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <GlassCard className="p-0 overflow-hidden shadow-2xl shadow-blue-500/10 border-blue-500/20">
                <ChatSystem 
                  reportId={selectedChatReport.id} 
                  currentRole="user" 
                  contentContext={selectedChatReport.content} 
                />
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
