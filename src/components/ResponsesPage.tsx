import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  ExternalLink
} from "lucide-react";
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
  const [search, setSearch] = useState("");

  useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredReports = reports.filter(report => {
    const matchesSearch = (report.title || report.content).toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || report.category.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const handleVote = async (reportId: string, type: 'up' | 'down') => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const reportRef = doc(db, "reports", reportId);
    try {
      await updateDoc(reportRef, {
        [`votes.${userId}`]: type
      });
    } catch (error) {
      toast.error("Failed to vote");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Verification Responses</h2>
          <p className="text-white/40">Browse and learn from previously analyzed messages and links.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports..."
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all">All Categories</option>
            <option value="scam">Scam</option>
            <option value="safe">Safe</option>
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
                    <div className="flex items-center bg-white/5 rounded-lg p-1">
                      <button 
                        onClick={() => handleVote(report.id, 'up')}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          report.votes?.[auth.currentUser?.uid || ""] === 'up' ? "bg-blue-600 text-white" : "text-white/40 hover:text-white"
                        )}
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-white/10 mx-1" />
                      <button 
                        onClick={() => handleVote(report.id, 'down')}
                        className={cn(
                          "p-1.5 rounded-md transition-colors",
                          report.votes?.[auth.currentUser?.uid || ""] === 'down' ? "bg-red-600 text-white" : "text-white/40 hover:text-white"
                        )}
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                    <button className="flex items-center gap-2 text-xs font-bold text-white/40 hover:text-white transition-colors">
                      <MessageSquare className="w-4 h-4" />
                      {report.comments?.length || 0}
                    </button>
                    <button className="p-2 bg-white/5 rounded-xl text-white/40 group-hover:text-white group-hover:bg-blue-600 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
