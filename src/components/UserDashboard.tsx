import React, { useState, useEffect } from "react";
import {
  Trophy, Shield, MessageSquare, Target, Award, Zap,
  User, Mail, Edit3, Check, X, Clock, AlertTriangle,
  CheckCircle, TrendingUp, BarChart3
} from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { db, auth, updateProfile } from "../lib/firebase";
import { doc, onSnapshot, collection, query, where, orderBy, updateDoc } from "firebase/firestore";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

export function UserDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");

  const uid = auth.currentUser?.uid;

  // Live user doc
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), d => {
      if (d.exists()) {
        setUserData(d.data());
        setNewName(d.data().username || "");
      }
    });
    return () => unsub();
  }, [uid]);

  // My reports (Query modified to avoid index requirement)
  useEffect(() => {
    if (!uid) return;
    // We use a simple query (single field order) and filter in memory to resolve the 'Failed Precondition' error
    // until the recommended composite index is created in the Firebase Console.
    const q = query(
      collection(db, "reports"),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      const allReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMyReports(allReports.filter((r: any) => r.userId === uid));
    }, (err) => {
      // Graceful handling of permission-denied during auth transitions
      if (err.code === 'permission-denied') {
        console.warn("Permission denied for reports list - awaiting auth...");
      } else {
        console.error("Snapshot error in UserDashboard:", err);
      }
    });
    return () => unsub();
  }, [uid]);

  const weekActivity = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day, i) => {
    const dayCount = myReports.filter(report => {
      const reportDate = report.timestamp?.toDate ? report.timestamp.toDate() : null;
      return reportDate && reportDate.getDay() === i;
    }).length;
    return { day, reports: dayCount };
  });

  const stats = [
    { label: "Reports Submitted", value: userData?.reportsCount || 0,   icon: Shield,        color: "from-blue-500/20 to-blue-600/10   text-blue-400" },
    { label: "Trust Score",       value: `${userData?.trustScore || 50}%`,icon: Trophy,       color: "from-yellow-500/20 to-yellow-600/10 text-yellow-400" },
    { label: "Votes Given",       value: userData?.votesCount || 0,      icon: Target,        color: "from-purple-500/20 to-purple-600/10 text-purple-400" },
    { label: "Comments",          value: userData?.commentsCount || 0,   icon: MessageSquare, color: "from-green-500/20 to-green-600/10   text-green-400" },
  ];

  const badges = [
    { name: "Top Reporter",    icon: Award,  color: "bg-blue-500/20 text-blue-400",    unlock: (userData?.reportsCount || 0) >= 5,  req: "5+ reports" },
    { name: "Trust Guardian",  icon: Shield, color: "bg-purple-500/20 text-purple-400",unlock: (userData?.trustScore || 0) >= 70,  req: "70%+ trust" },
    { name: "Community Star",  icon: Zap,    color: "bg-yellow-500/20 text-yellow-400",unlock: (userData?.commentsCount || 0) >= 10, req: "10+ comments" },
  ];

  async function saveName() {
    if (!newName.trim() || !uid) return;
    try {
      await updateDoc(doc(db, "users", uid), { username: newName.trim() });
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: newName.trim() });
      toast.success("Name updated");
      setEditingName(false);
    } catch { toast.error("Update failed"); }
  }

  return (
    <div className="space-y-8 pb-10">
      {/* ── Profile Header ─────────────────────────────────── */}
      <GlassCard gradient className="p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-black shadow-xl">
            {(userData?.username || auth.currentUser?.email || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  onKeyDown={e => e.key === "Enter" && saveName()}
                  autoFocus
                />
                <button onClick={saveName} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingName(false)} className="p-2 bg-white/5 text-white/40 rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black truncate">{userData?.username || "Anonymous"}</h2>
                <button onClick={() => setEditingName(true)} className="p-1.5 text-white/30 hover:text-white transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 text-sm text-white/40">
              <Mail className="w-3.5 h-3.5" />
              {auth.currentUser?.email}
            </div>
          </div>
          <div className="text-right">
            <div className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase",
              userData?.role === "admin" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
            )}>
              {userData?.role || "user"}
            </div>
            {userData?.banned && (
              <div className="mt-2 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400">
                ⚠ Account Restricted
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => {
          const [bg, text] = color.split("  ");
          return (
            <GlassCard key={label} className="p-5">
              <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", bg)}>
                <Icon className={cn("w-5 h-5", text)} />
              </div>
              <p className="text-2xl font-black">{value}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </GlassCard>
          );
        })}
      </div>

      {/* ── Main Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <GlassCard className="lg:col-span-2 p-6">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-blue-400" /> My Submission Activity
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekActivity}>
                <defs>
                  <linearGradient id="myGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="day" stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff30" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor:"#0f172a", border:"1px solid #ffffff10", borderRadius:"12px", color:"#fff" }} />
                <Area type="monotone" dataKey="reports" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#myGrad)" name="Reports" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Badges */}
        <GlassCard className="p-6">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-5">
            <Award className="w-4 h-4 text-yellow-400" /> Achievements
          </h3>
          <div className="space-y-3">
            {badges.map(({ name, icon: Icon, color, unlock, req }) => (
              <div key={name} className={cn("flex items-center gap-3 p-3.5 rounded-xl border border-white/5 transition-all",
                unlock ? "bg-white/5" : "opacity-40 grayscale"
              )}>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", color)}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className="text-sm font-bold">{name}</p>
                  <p className="text-[10px] text-white/30">{unlock ? "✅ Unlocked" : `🔒 Need ${req}`}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* ── My Complaints / Reports ───────────────────────── */}
      <div>
        <h3 className="font-bold text-sm text-white/40 uppercase tracking-widest flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4" /> My Submitted Reports ({myReports.length})
        </h3>

        {myReports.length === 0 ? (
          <GlassCard className="p-10 text-center">
            <Shield className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No reports submitted yet.</p>
            <p className="text-white/20 text-xs mt-1">Head to Home to analyze & report suspicious content.</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {myReports.map(report => (
              <GlassCard key={report.id} className="p-4 flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-black",
                  report.riskScore > 65 ? "bg-red-500/10 text-red-400" :
                  report.riskScore > 35 ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-green-500/10 text-green-400"
                )}>
                  {report.riskScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{report.title || "Scam Analysis Report"}</span>
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0",
                      report.status === "Verified" ? "bg-green-500/10 text-green-400" :
                      report.status === "Scam"     ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    )}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 truncate mt-0.5">{report.content}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/20 shrink-0">
                  <Clock className="w-3 h-3" />
                  {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : "Recent"}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
