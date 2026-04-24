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
    <div className="relative min-h-screen">
      {/* Background Glow */}
      <div className="absolute inset-0 flex justify-center overflow-hidden pointer-events-none">
        <div className="w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full mt-[-100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
          <div className="space-y-4">
            <div className="inline-flex items-center px-3 py-1 bg-white/5 border border-white/10 rounded-full text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">
              Knowledge Base
            </div>
            <h1 className="text-5xl font-semibold tracking-tighter text-white leading-[1.05]">Intelligence Archive</h1>
            <p className="text-zinc-500 text-lg leading-relaxed max-w-xl">
              Browse and learn from previously analyzed messages to stay ahead of sophisticated digital threats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* My/All Toggle */}
            <div className="flex bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl p-1 shrink-0">
               <button
                onClick={() => setActiveTab("all")}
                className={cn(
                  "px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                  activeTab === "all" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Global
              </button>
              <button
                onClick={() => setActiveTab("mine")}
                className={cn(
                  "px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                  activeTab === "mine" ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                Personal
              </button>
            </div>

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search intelligence..."
                className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800 rounded-xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/5 transition-all min-w-[280px] placeholder:text-zinc-600"
              />
            </div>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300 group shadow-lg shadow-black/20">
              <div className="flex flex-col md:flex-row gap-8">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800 bg-black/50 shadow-inner",
                  report.category === "Scam" ? "text-red-400" : "text-zinc-400"
                )}>
                  {report.category === "Scam" ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-white truncate tracking-tight">{report.title || "Intelligence Entry"}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 uppercase tracking-widest opacity-60">
                        <Clock className="w-3.5 h-3.5" />
                        Intelligence logged • {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently logged"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <div className={cn(
                        "px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border",
                        report.status === "Verified" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        report.status === "Scam" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                        "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 whitespace-nowrap"
                      )}>
                        {report.status || "PENDING"}
                      </div>
                      <div className={cn(
                        "px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border border-zinc-700/50 bg-black/40",
                        report.riskScore > 65 ? "text-red-400" : report.riskScore > 35 ? "text-yellow-400" : "text-green-400"
                      )}>
                        {report.category} • {report.riskScore}% Risk
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-zinc-400 text-sm line-clamp-2 leading-relaxed font-normal">
                    {report.content}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                    <div className="flex items-center bg-black/40 rounded-lg p-1 border border-zinc-800">
                      <button 
                        onClick={() => handleVote(report.id, 'up')}
                        className={cn(
                          "px-3 py-1.5 rounded-md transition-all flex items-center gap-2",
                          report.votes?.[auth.currentUser?.uid || ""] === 'up' 
                            ? "bg-zinc-800 text-white" 
                            : "text-zinc-600 hover:text-white"
                        )}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold">{Object.values(report.votes || {}).filter(v => v === 'up').length || 0}</span>
                      </button>
                      <div className="w-px h-4 bg-zinc-800 mx-1" />
                      <button 
                        onClick={() => handleVote(report.id, 'down')}
                        className={cn(
                          "px-3 py-1.5 rounded-md transition-all",
                          report.votes?.[auth.currentUser?.uid || ""] === 'down' 
                            ? "bg-red-500/10 text-red-400" 
                            : "text-zinc-600 hover:text-white"
                        )}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setSelectedChatReport(report)}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border shadow-sm",
                          report.userId === auth.currentUser?.uid
                            ? "bg-white text-black border-white hover:bg-zinc-200"
                            : "bg-zinc-900/50 text-zinc-600 border-zinc-800 cursor-not-allowed opacity-40"
                        )}
                        disabled={report.userId !== auth.currentUser?.uid}
                      >
                        <MessageSquareIcon className="w-3.5 h-3.5" />
                        Chat System
                      </button>

                      <button 
                        onClick={() => navigate('/app/home')}
                        className="p-2.5 bg-zinc-900/50 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800 shadow-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chat Modal */}
        <AnimatePresence>
          {selectedChatReport && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                className="w-full max-w-xl relative"
              >
                <button 
                  onClick={() => setSelectedChatReport(null)}
                  className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white transition-all transition-colors"
                >
                  <MdClose className="w-6 h-6" />
                </button>
                <div className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl h-[600px]">
                  <ChatSystem 
                    reportId={selectedChatReport.id} 
                    currentRole="user" 
                    contentContext={selectedChatReport.content} 
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

