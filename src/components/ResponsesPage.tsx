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
    <div className="max-w-5xl mx-auto space-y-12 pb-20 px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 pt-12">
        <div>
          <h2 className="text-5xl font-bold tracking-tighter text-white mb-4">Archive</h2>
          <p className="text-zinc-500 text-lg font-medium max-w-md leading-relaxed">Browse and learn from previously analyzed messages to stay ahead of threats.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* My/All Toggle */}
          <div className="flex bg-zinc-950 border border-zinc-900 rounded-full p-1 shrink-0">
             <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === "all" ? "bg-white text-black" : "text-zinc-600 hover:text-zinc-300"
              )}
            >
              All Data
            </button>
            <button
              onClick={() => setActiveTab("mine")}
              className={cn(
                "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                activeTab === "mine" ? "bg-white text-black" : "text-zinc-600 hover:text-zinc-300"
              )}
            >
              My Reports
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="bg-zinc-950 border border-zinc-900 rounded-full py-2.5 pl-12 pr-6 text-sm text-white focus:border-zinc-700 outline-none transition-all min-w-[240px]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-8 hover:border-zinc-800 transition-all group">
            <div className="flex items-start gap-8">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border",
                report.category === "Scam" ? "bg-red-500/5 text-red-500 border-red-500/10" : "bg-cyan-500/5 text-cyan-500 border-cyan-500/10"
              )}>
                {report.category === "Scam" ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white truncate pr-6 tracking-tight">{report.title || "Threat Intelligence Report"}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-700 uppercase tracking-widest shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {report.timestamp?.toDate().toLocaleDateString()}
                  </div>
                </div>
                
                <p className="text-zinc-500 text-sm line-clamp-2 mb-6 leading-relaxed font-medium">
                  {report.content}
                </p>

                <div className="flex items-center justify-between gap-4 pt-6 border-t border-zinc-900">
                  <div className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                    report.category === "Scam" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
                  )}>
                    {report.category} ({report.riskScore}%)
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Voting */}
                    <div className="flex items-center bg-black rounded-full px-2 py-1 border border-zinc-900">
                      <button 
                        onClick={() => handleVote(report.id, 'up')}
                        className={cn(
                          "p-2 rounded-full transition-all",
                          report.votes?.[auth.currentUser?.uid || ""] === 'up' 
                            ? "bg-cyan-500/10 text-cyan-500" 
                            : "text-zinc-600 hover:text-white"
                        )}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-zinc-900 mx-1" />
                      <button 
                        onClick={() => handleVote(report.id, 'down')}
                        className={cn(
                          "p-2 rounded-full transition-all",
                          report.votes?.[auth.currentUser?.uid || ""] === 'down' 
                            ? "bg-red-500/10 text-red-500" 
                            : "text-zinc-600 hover:text-white"
                        )}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>

                    <button 
                      onClick={() => setSelectedChatReport(report)}
                      className={cn(
                        "flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                        report.userId === auth.currentUser?.uid
                          ? "bg-white text-black border-white hover:bg-zinc-200"
                          : "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed opacity-40"
                      )}
                      disabled={report.userId !== auth.currentUser?.uid}
                    >
                      <MessageSquareIcon className="w-3.5 h-3.5" />
                      Chat
                    </button>

                    <button 
                      onClick={() => navigate('/app/home')}
                      className="p-2.5 bg-zinc-900 rounded-full text-zinc-600 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedChatReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg relative"
            >
              <button 
                onClick={() => setSelectedChatReport(null)}
                className="absolute -top-14 right-0 p-3 text-zinc-500 hover:text-white transition-all bg-zinc-900 rounded-full"
              >
                <MdClose className="w-5 h-5" />
              </button>
              <div className="bg-zinc-950 border border-zinc-900 rounded-[32px] overflow-hidden shadow-2xl">
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
  );
}

