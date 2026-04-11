import React, { useState, useEffect } from "react";
import { 
  AiOutlineScan as AiOutlineScanRaw, 
  AiOutlineInfoCircle as AiOutlineInfoCircleRaw 
} from "react-icons/ai";
import { 
  RiAlertLine as RiAlertLineRaw, 
  RiSendPlaneFill as RiSendPlaneFillRaw, 
  RiTimeLine 
} from "react-icons/ri";
import { 
  MdOutlineVerified as MdOutlineVerifiedRaw, 
  MdOutlineCategory, 
  MdClose as MdCloseRaw 
} from "react-icons/md";
import { 
  BsLightningCharge as BsLightningChargeRaw, 
  BsShieldLock as BsShieldLockRaw, 
  BsChatDots 
} from "react-icons/bs";
import { 
  FiClock as FiClockRaw, 
  FiFileText as FiFileTextRaw, 
  FiTrendingUp as FiTrendingUpRaw 
} from "react-icons/fi";
import { 
  VscGraph as VscGraphRaw 
} from "react-icons/vsc";
import { 
  BiChevronDown as BiChevronDownRaw, 
  BiMessageSquareDetail as BiMessageSquareDetailRaw 
} from "react-icons/bi";
import { 
  CgSpinner as CgSpinnerRaw 
} from "react-icons/cg";

// ── Caste icons to any to bypass strict React 19 types ──
const AiOutlineScan = AiOutlineScanRaw as any;
const AiOutlineInfoCircle = AiOutlineInfoCircleRaw as any;
const RiAlertLine = RiAlertLineRaw as any;
const RiSendPlaneFill = RiSendPlaneFillRaw as any;
const MdOutlineVerified = MdOutlineVerifiedRaw as any;
const MdClose = MdCloseRaw as any;
const BsLightningCharge = BsLightningChargeRaw as any;
const BsShieldLock = BsShieldLockRaw as any;
const FiClock = FiClockRaw as any;
const FiFileText = FiFileTextRaw as any;
const FiTrendingUp = FiTrendingUpRaw as any;
const VscGraph = VscGraphRaw as any;
const BiChevronDown = BiChevronDownRaw as any;
const BiMessageSquareDetail = BiMessageSquareDetailRaw as any;
const CgSpinner = CgSpinnerRaw as any;

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
  richScore?: number;
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
  "Fake Shopping Site",
  "Other",
];

export function StudentDashboard() {
  const [content, setContent] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState({ 
    scamsDetected: 0, 
    verifications: 0, 
    activeReports: 0 
  });
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintData, setComplaintData] = useState({ title: "", description: "", category: "" });
  const [selectedChatReport, setSelectedChatReport] = useState<any | null>(null);

  // Live Stats Listener
  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"), limit(10));
    const unsubscribe = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRecentReports(docs);
      
      // Compute simple stats from last 100 (demo logic)
      setStats({
        scamsDetected: docs.filter((d: any) => d.status === "Scam").length,
        verifications: docs.filter((d: any) => d.status === "Verified").length,
        activeReports: docs.filter((d: any) => d.status === "Pending").length
      });
    });
    return unsubscribe;
  }, []);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await axios.post("http://localhost:3001/api/analyze", { content });
      setResult(response.data);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Analysis failed. Is the server running?");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) throw new Error("User not logged in");
      if (!result) throw new Error("No analysis data");

      setIsSubmitting(true);
      
      const payload = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        content,
        title: complaintData.title || (result.category === "Scam" ? "Potential Fraud Detected" : "Security Notice"),
        description: complaintData.description || result.explanation,
        category: complaintData.category || selectedCategory,
        aiScore: result.bayesScore ?? result.richScore ?? result.riskScore,
        riskScore: result.riskScore,
        adminScore: null,
        weightedScore: null,
        status: "Pending",
        findings: result.findings,
        aiAnalysis: result.explanation,
        timestamp: serverTimestamp(),
        chatEnabled: true
      };

      await addDoc(collection(db, "reports"), payload);

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
          <BsShieldLock className="w-3.5 h-3.5" />
          AI-Powered Scam Detection
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white">Verify Content</h1>
        <p className="text-white/40 text-base leading-relaxed max-w-xl">
          Paste any suspicious link, email, or message. Our Naive Bayes + NLP ensemble
          will instantly detect scam patterns.
        </p>
      </div>

      {/* ── Stats bar ────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: VscGraph, label: "Reports Analyzed", value: recentReports.length + "+" },
          { icon: FiTrendingUp, label: "Detection Rate", value: "97.3%" },
          { icon: BsLightningCharge, label: "Avg Response", value: "<200ms" },
        ].map(({ icon: IconComponent, label, value }) => (
          <GlassCard key={label} className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
              <IconComponent className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-lg font-bold leading-none text-white">{value}</div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">{label}</div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* ── Analysis Form ─────────────────────────────────────── */}
      <GlassCard gradient className="p-6">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <AiOutlineScan className="w-4 h-4 text-blue-400" />
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
                <CgSpinner className="w-5 h-5 animate-spin" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <AiOutlineScan className="w-5 h-5" />
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
                          <RiAlertLine className="w-3.5 h-3.5 text-yellow-500/60 shrink-0 mt-0.5" />
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
                    <RiSendPlaneFill className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-sm text-white">Submit Official Complaint</div>
                    <div className="text-xs text-white/40">Report this content to our admin team for review</div>
                  </div>
                </div>
                <BiChevronDown
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
                          <CgSpinner className="w-4 h-4 animate-spin" />
                        ) : (
                          <RiSendPlaneFill className="w-4 h-4" />
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
            <FiFileText className="w-4 h-4 text-white/40" />
            <h2 className="font-bold text-sm uppercase tracking-widest text-white/40">
              Recent Community Analyses
            </h2>
          </div>
          <span className="text-xs text-white/20">{recentReports.length} reports</span>
        </div>

        {recentReports.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <BsShieldLock className="w-10 h-10 text-white/10 mx-auto mb-3" />
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
                      <BsShieldLock className="w-6 h-6" />
                    ) : report.status === "Verified" ? (
                      <MdOutlineVerified className="w-6 h-6" />
                    ) : (
                      <FiClock className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-base truncate text-white">{report.title || "Security Analysis"}</span>
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
                      <FiClock className="w-3 h-3" />
                      {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : "Pending"}
                    </div>
                    {report.userId === auth.currentUser?.uid && (
                      <button 
                        onClick={() => setSelectedChatReport(report)}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase transition-all border border-blue-500/10"
                      >
                        <BiMessageSquareDetail className="w-3 h-3" />
                        Chat with Mod
                      </button>
                    )}
                  </div>
                </div>

                {report.adminFeedback && (
                  <div className="px-5 py-3 bg-blue-500/5 border-t border-white/5">
                    <div className="flex gap-2">
                      <AiOutlineInfoCircle className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-300/80 leading-relaxed italic">
                        <span className="font-bold uppercase tracking-wider mr-1 not-italic text-blue-400">Moderator Feedback:</span>
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
                <MdClose className="w-5 h-5" />
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
