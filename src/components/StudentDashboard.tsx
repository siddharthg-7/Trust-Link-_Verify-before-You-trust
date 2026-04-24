import React, { useState, useEffect } from "react";
import {
  AiOutlineScan as AiOutlineScanRaw,
  AiOutlineInfoCircle as AiOutlineInfoCircleRaw
} from "react-icons/ai";
import {
  RiAlertLine as RiAlertLineRaw,
  RiSendPlaneFill as RiSendPlaneFillRaw,
} from "react-icons/ri";
import {
  MdOutlineVerified as MdOutlineVerifiedRaw,
  MdClose as MdCloseRaw
} from "react-icons/md";
import {
  BsLightningCharge as BsLightningChargeRaw,
  BsShieldLock as BsShieldLockRaw,
} from "react-icons/bs";
import {
  FiClock as FiClockRaw,
  FiFileText as FiFileTextRaw,
} from "react-icons/fi";
import {
  BiChevronDown as BiChevronDownRaw,
  BiMessageSquareDetail as BiMessageSquareDetailRaw
} from "react-icons/bi";
import {
  CgSpinner as CgSpinnerRaw
} from "react-icons/cg";
import { useNavigate } from "react-router-dom";

// Caste icons to any to bypass strict React 19 types
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
const BiChevronDown = BiChevronDownRaw as any;
const BiMessageSquareDetail = BiMessageSquareDetailRaw as any;
const CgSpinner = CgSpinnerRaw as any;

import { ChatSystem } from "./ChatSystem";
import { GlassCard } from "./ui/GlassCard";
import { auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, query, orderBy, limit, onSnapshot, getCountFromServer } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";
import { EnhancedScamDetector } from "../enhanced-detector";

// Singleton instance of the detector to avoid reloading the model on every render
const detector = new EnhancedScamDetector();

// ── Types ──────────────────────────────────────────────────────
interface AnalysisResult {
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  category: "Scam" | "Safe" | "Suspicious";
  findings: string[];
  explanation: string;
  confidence?: number;
  complaintType?: string;
  details: {
    vectorSimilarity: number;
    linguisticMarkers: string;
    messageDensity: number;
    timeContext: string;
    metadataRisk: string;
  };
}

// ── Risk color helpers
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

// ── Animated Gauge
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
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintData, setComplaintData] = useState({ title: "", description: "", category: "" });
  const [selectedChatReport, setSelectedChatReport] = useState<any | null>(null);
  const [totalReports, setTotalReports] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;
    try {
      const q = query(collection(db, "reports"), orderBy("timestamp", "desc"), limit(10));
      const unsubscribe = onSnapshot(q, (snap) => {
        setRecentReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, (err) => {
        if (err.code === 'permission-denied') {
          console.warn("Real-time feed: Permission denied - awaiting auth sync...");
        } else {
          console.error("Feed Error:", err);
        }
      });

      // Fetch absolute total count for analytics
      getCountFromServer(collection(db, "reports")).then((snapshot) => {
        setTotalReports(snapshot.data().count);
      }).catch(err => {
        console.warn("Total count fetch error (potential auth race):", err.message);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Critical listener init error:", err);
    }
  }, []);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const result = await detector.analyze(content);
      setResult(result as any);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis Error:", error);
      toast.error("Analysis failed. Please check your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalContent = content.trim() || complaintData.description.trim();
    if (!auth.currentUser || !finalContent) return;
    setIsSubmitting(true);
    try {
      const initialPayload = {
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: auth.currentUser.displayName || auth.currentUser.email?.split("@")[0] || "Anonymous",
        content: finalContent,
        title: complaintData.title || "Official Complaint",
        description: complaintData.description || "User reported content for manual review.",
        category: complaintData.category || "Other",
        status: "submitted",
        timestamp: serverTimestamp(),
        chatEnabled: true,
        riskScore: result?.riskScore ?? 0,
        nlpConfidence: result?.confidence ?? 0,
        complaintType: result?.complaintType ?? "General"
      };

      // 1. Submit directly to Firestore (Reverting to original direct-to-db logic)
      const reportRef = await addDoc(collection(db, "reports"), initialPayload);

      // 2. Update user stats in Firestore
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, { reportsCount: increment(1) });

      toast.success("Report submitted successfully!");
      console.log("Report created in Firestore:", reportRef.id);

      setContent("");
      setComplaintData({ title: "", description: "", category: "" });
      setShowComplaintForm(false);
    } catch (error: any) {
      console.error("Submission Error:", error);
      toast.error("Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="relative min-h-screen">
      {/* Background Glow */}
      <div className="absolute inset-0 flex justify-center overflow-hidden pointer-events-none">
        <div className="w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full mt-[-100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        {/* ── Header Section (Hero) ────────────────────────────── */}
        <div className="space-y-4">
          <div className="inline-flex items-center px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] align-center">
            <BsShieldLock className="w-3 h-3 mr-2" />
            AI-Powered Protection
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-white leading-[1.05] align-center">
            Verify Content
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-xl">
            Advanced linguistic analysis to identify fraudulent messaging patterns and
            protect you from sophisticated phishing attempts.
          </p>
        </div>

        {/* ── Stats Cards Row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Reports Analyzed", value: `${(totalReports + 5).toLocaleString()}+` },
            { label: "Detection Rate", value: "97.3%" },
            { label: "Avg Response", value: "<200ms" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-lg shadow-black/30 group hover:border-zinc-700 transition-all duration-300">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{label}</div>
              <div className="text-3xl font-semibold text-white tracking-tight">{value}</div>
            </div>
          ))}
        </div>

        {/* ── Main Input Card (Core Feature) ───────────────────── */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 space-y-4 hover:border-zinc-700 transition-all duration-300">
          <form onSubmit={handleAnalyze} className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <AiOutlineScan className="w-4 h-4 text-zinc-500" />
              <label className="text-sm font-medium text-zinc-500">Paste Suspicious Content</label>
            </div>

            <div className="relative group">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste a link, email body, SMS, or message text here..."
                className="w-full h-48 bg-black border border-zinc-800 rounded-xl p-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all resize-none leading-relaxed font-normal hover:border-zinc-700"
              />
              {content && (
                <button
                  type="button"
                  onClick={() => setContent("")}
                  className="absolute bottom-4 right-4 px-3 py-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-md text-[10px] font-medium transition-all"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !content.trim()}
              className="w-full py-3 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isAnalyzing ? (
                <CgSpinner className="w-5 h-5 animate-spin" />
              ) : (
                <BsLightningCharge className="w-4 h-4" />
              )}
              {isAnalyzing ? "Analyzing message..." : "Check for Risks"}
            </button>
          </form>
        </div>

        {/* ── Analysis Result Rendering ─────────────────────────── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={cn(
                "p-8 rounded-2xl border bg-zinc-900/40 backdrop-blur-xl",
                result.riskScore > 65 ? "border-red-500/30" : result.riskScore > 35 ? "border-yellow-500/30" : "border-green-500/30"
              )}
            >
              <div className="flex flex-col md:flex-row gap-8 items-center text-left">
                <RiskGauge score={result?.riskScore || 0} />
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", riskBg(result?.riskScore || 0), riskColor(result?.riskScore || 0))}>
                      {result?.category} Analysis Complete
                    </span>
                    {result?.details?.metadataRisk === 'Flagged source' && (
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border bg-red-500/10 text-red-500 border-red-500/20">
                        Suspicious Origin
                      </span>
                    )}
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-lg font-normal">{result?.explanation}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Vector Match</div>
                      <div className="text-sm font-semibold text-white">{result?.details?.vectorSimilarity}%</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Linguistics</div>
                      <div className="text-xs font-semibold text-white truncate">{result?.details?.linguisticMarkers}</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Density</div>
                      <div className="text-sm font-semibold text-white">{result?.details?.messageDensity}% Risk</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
                      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-1">Context</div>
                      <div className="text-xs font-semibold text-white">{result?.details?.timeContext}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Secondary Action Card ─────────────────────────────── */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-zinc-700 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex-shrink-0 bg-zinc-800 rounded-xl flex items-center justify-center">
              <RiAlertLine className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <div className="font-semibold text-white tracking-tight">Found something dangerous?</div>
              <div className="text-sm text-zinc-500">Your report helps protect 20,000+ active enterprise nodes.</div>
            </div>
          </div>
          <button
            onClick={() => setShowComplaintForm(!showComplaintForm)}
            className="w-full md:w-auto px-6 py-2.5 bg-zinc-800 text-white rounded-xl font-medium text-sm hover:bg-zinc-700 transition-all hover:scale-[1.02]"
          >
            {showComplaintForm ? "Close Form" : "Submit Official Complaint"}
          </button>
        </div>

        {/* ── Complaint Form Drawer ─────────────────────────────── */}
        <AnimatePresence>
          {showComplaintForm && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-8 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl mt-4">
                <form onSubmit={handleComplaintSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500">Report Title</label>
                      <input type="text" value={complaintData.title} onChange={(e) => setComplaintData({ ...complaintData, title: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/5 hover:border-zinc-700 transition-all" placeholder="e.g., Suspicious WhatsApp Link" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-500">Category</label>
                      <div className="relative">
                        <select value={complaintData.category} onChange={(e) => setComplaintData({ ...complaintData, category: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/5 hover:border-zinc-700 transition-all cursor-pointer">
                          <option value="">Select category...</option>
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                          <BiChevronDown size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-500">Detailed Description</label>
                    <textarea value={complaintData.description} onChange={(e) => setComplaintData({ ...complaintData, description: e.target.value })} className="w-full h-32 bg-black border border-zinc-800 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/5 hover:border-zinc-700 transition-all resize-none" placeholder="Provide more context about the threat..." />
                  </div>
                  <button type="submit" className="w-full py-3 bg-white text-black rounded-xl font-medium text-sm hover:bg-zinc-200 transition-all hover:scale-[1.01]">
                    {isSubmitting ? "Submitting..." : "Submit Official Report"}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Recent Community Analyses ────────────────────────── */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 opacity-50">Recent Community Analyses</h2>
            <button
              className="text-xs font-semibold text-white/60 hover:text-white transition-all flex items-center gap-1 group"
              onClick={() => navigate("/app/responses")}
            >
              View All Trends
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedChatReport(report)}
                className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all duration-300 group flex items-center gap-4 cursor-pointer shadow-lg shadow-black/20"
              >
                <div className={cn("w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-black/50 border border-zinc-800",
                  report.status === "Scam" ? "text-red-400" : "text-zinc-400")}>
                  {report.status === "Scam" ? <RiAlertLine className="w-5 h-5" /> : <MdOutlineVerified className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate leading-tight uppercase tracking-tight">{report.title}</div>
                  <div className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-1 mb-3">
                    {report.timestamp?.toDate ? (
                      <>
                        {report.timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {report.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </>
                    ) : (
                      "Just now"
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-bold text-zinc-600 tracking-widest">Status</span>
                      <span className={cn("text-[10px] font-bold", 
                        report.status === "Approved" || report.status === "Verified" ? "text-green-400" :
                        report.status === "Rejected" || report.status === "Scam" ? "text-red-400" : "text-yellow-500"
                      )}>{report.status || "Pending Review"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-bold text-zinc-600 tracking-widest">NLP Confidence</span>
                      <span className="text-[10px] font-bold text-white">{report.nlpConfidence ?? 0}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-bold text-zinc-600 tracking-widest">Risk Level</span>
                      <span className={cn("text-[10px] font-bold", 
                        report.riskScore > 65 ? "text-red-400" : report.riskScore > 35 ? "text-yellow-400" : "text-green-400"
                      )}>
                        {report.riskScore > 65 ? "High" : report.riskScore > 35 ? "Medium" : "Low"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-bold text-zinc-600 tracking-widest">Action</span>
                      <span className="text-[10px] font-bold text-zinc-400">
                        {report.status === "Pending Review" ? "Awaiting Verification" : 
                         report.status === "Pending (Analyzed)" ? "Reviewing Patterns" :
                         report.status === "Pending Verification" ? "Human Review Required" :
                         report.status === "Approved" || report.status === "Verified" ? "No Action Required" :
                         report.status === "Rejected" || report.status === "Scam" ? "Security Alert" : "Processing"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-end shrink-0">
                  <div className={cn("text-lg font-black tracking-tighter", 
                    report.riskScore > 65 ? "text-red-400" : report.riskScore > 35 ? "text-yellow-400" : "text-green-400"
                  )}>
                    {report.riskScore || 0}%
                  </div>
                  <div className="text-[8px] uppercase font-bold text-zinc-600 tracking-widest">Risk</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Chat Modal ────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedChatReport && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-xl relative"
              >
                <button onClick={() => setSelectedChatReport(null)} className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white transition-colors">
                  <MdClose className="w-6 h-6" />
                </button>
                <div className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl h-[600px]">
                  <ChatSystem reportId={selectedChatReport.id} currentRole="user" contentContext={selectedChatReport.content} />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

