import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  MessageCircle,
  MessageSquare as MessageSquareIcon
} from "lucide-react";
import { ChatSystem } from "./ChatSystem";
import { MdClose as MdCloseRaw } from "react-icons/md";
const MdClose = MdCloseRaw as any;
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "./ui/GlassCard";
import { db, auth } from "../lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  where,
  updateDoc,
  doc
} from "firebase/firestore";
import { cn } from "../lib/utils";
import toast from "react-hot-toast";

export function ResponsesPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<"all" | "mine">("all");
  const [search, setSearch] = useState("");
  const [selectedChatReport, setSelectedChatReport] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = (report.title || report.content)?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || report.category?.toLowerCase() === filter.toLowerCase();
    const isMine = report.userId === auth.currentUser?.uid;
    const matchesTab = activeTab === "all" || isMine;
    return matchesSearch && matchesFilter && matchesTab;
  });

  const handleVote = async (reportId: string, type: 'up' | 'down') => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      toast.error("Sign in to vote");
      return;
    }

    const reportRef = doc(db, "reports", reportId);
    const existingVote = reports.find(r => r.id === reportId)?.votes?.[userId];

    try {
      // Toggle logic
      const newVote = existingVote === type ? null : type;
      await updateDoc(reportRef, {
        [`votes.${userId}`]: newVote
      });
      if (newVote) toast.success(`Vote ${type === 'up' ? 'recorded' : 'noted'}`);
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-white mb-1">Verification Archive</h2>
          <p className="text-white/40 text-sm">Browse and learn from previously analyzed messages and links.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* My/All Toggle */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
             <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                activeTab === "all" ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
              )}
            >
              All Reports
            </button>
            <button
              onClick={() => setActiveTab("mine")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                activeTab === "mine" ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"
              )}
            >
              My Responses
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search data..."
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 min-w-[200px]"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none min-w-[140px]"
          >
            <option value="all" className="bg-[#020617]">All Scores</option>
            <option value="scam" className="bg-[#020617]">High Risk</option>
            <option value="safe" className="bg-[#020617]">Verified Safe</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredReports.map((report) => (
          <GlassCard key={report.id} className="p-6 hover:bg-white/[0.02] transition-colors group">
            <div className="flex items-start gap-6">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                report.category === "Scam" ? "bg-red-500/20 text-red-400 shadow-red-900/20" : "bg-green-500/20 text-green-400 shadow-green-900/20"
              )}>
                {report.category === "Scam" ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold truncate pr-4">{report.title || "Scam Analysis Report"}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    {report.timestamp?.toDate().toLocaleDateString()}
                  </div>
                </div>
                
                <p className="text-white/60 text-sm line-clamp-2 mb-4 leading-relaxed">
                  {report.content}
                </p>

                <div className="flex items-center gap-4">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    report.category === "Scam" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                  )}>
                    {report.category} ({report.riskScore}%)
                  </div>
                    <div className="flex items-center gap-4 ml-auto">
                      {/* Voting */}
                      <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                        <button 
                          onClick={() => handleVote(report.id, 'up')}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            report.votes?.[auth.currentUser?.uid || ""] === 'up' 
                              ? "bg-blue-600/20 text-blue-400" 
                              : "text-white/40 hover:text-white"
                          )}
                        >
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <div className="w-px h-3 bg-white/10 mx-1" />
                        <button 
                          onClick={() => handleVote(report.id, 'down')}
                          className={cn(
                            "p-1.5 rounded-md transition-all",
                            report.votes?.[auth.currentUser?.uid || ""] === 'down' 
                              ? "bg-red-600/20 text-red-400" 
                              : "text-white/40 hover:text-white"
                          )}
                        >
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Chat / Detail navigation */}
                      <button 
                        onClick={() => setSelectedChatReport(report)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all border",
                          report.userId === auth.currentUser?.uid
                            ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/10"
                            : "bg-white/5 text-white/20 border-white/5 opacity-50 cursor-not-allowed"
                        )}
                        disabled={report.userId !== auth.currentUser?.uid}
                      >
                        <MessageSquareIcon className="w-3.5 h-3.5" />
                        Chat
                      </button>

                      <button 
                        onClick={() => navigate('/app/home')}
                        title="View Details"
                        className="p-2 bg-white/5 rounded-xl text-white/40 group-hover:text-white group-hover:bg-blue-600 transition-all border border-white/5"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
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
