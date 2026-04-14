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

  // My reports
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "reports"),
      orderBy("timestamp", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      const allReports = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMyReports(allReports.filter((r: any) => r.userId === uid));
    }, (err) => {
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
    { label: "Reports Submitted", value: userData?.reportsCount || 0,   icon: Shield,        color: "bg-cyan-500/10 text-cyan-500" },
    { label: "Trust Score",       value: `${userData?.trustScore || 50}%`,icon: Trophy,       color: "bg-white text-black" },
    { label: "Votes Given",       value: userData?.votesCount || 0,      icon: Target,        color: "bg-zinc-900 text-zinc-400" },
    { label: "Comments",          value: userData?.commentsCount || 0,   icon: MessageSquare, color: "bg-blue-500/10 text-blue-500" },
  ];

  const badges = [
    { name: "Top Reporter",    icon: Award,  color: "bg-cyan-500/10 text-cyan-500",    unlock: (userData?.reportsCount || 0) >= 5,  req: "5+ reports" },
    { name: "Trust Guardian",  icon: Shield, color: "bg-white text-black", unlock: (userData?.trustScore || 0) >= 70,  req: "70%+ trust" },
    { name: "Community Star",  icon: Zap,    color: "bg-zinc-900 text-zinc-400", unlock: (userData?.commentsCount || 0) >= 10, req: "10+ comments" },
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
    <div className="max-w-5xl mx-auto space-y-12 pb-20 px-6">
      {/* ── Profile Header ─────────────────────────────────── */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-8 mt-12">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 rounded-[32px] bg-white text-black flex items-center justify-center text-3xl font-bold shadow-2xl">
            {(userData?.username || auth.currentUser?.email || "U")[0].toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left min-w-0">
            {editingName ? (
              <div className="flex items-center justify-center md:justify-start gap-2">
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="bg-black border border-zinc-800 rounded-full px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none transition-all"
                  onKeyDown={e => e.key === "Enter" && saveName()}
                  autoFocus
                />
                <button onClick={saveName} className="p-2 bg-white text-black rounded-full hover:bg-zinc-200 transition-colors"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingName(false)} className="p-2 bg-zinc-900 text-zinc-500 rounded-full hover:bg-zinc-800"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center justify-center md:justify-start gap-3">
                <h2 className="text-3xl font-bold tracking-tighter text-white truncate">{userData?.username || "Anonymous"}</h2>
                <button onClick={() => setEditingName(true)} className="p-2 text-zinc-600 hover:text-white transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm text-zinc-500 font-medium">
              <Mail className="w-4 h-4" />
              {auth.currentUser?.email}
            </div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border",
              userData?.role === "admin" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-cyan-500/10 text-cyan-500 border-cyan-500/20"
            )}>
              {userData?.role || "Verified User"}
            </div>
            {userData?.banned && (
              <div className="px-4 py-1.5 rounded-full text-[10px] font-bold bg-white text-black uppercase tracking-widest">
                ⚠ Account Restricted
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-6 hover:border-zinc-800 transition-all">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", color)}>
              <Icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold tracking-tighter text-white">{value}</p>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 rounded-[32px] p-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-8">
            <TrendingUp className="w-4 h-4 text-cyan-500" /> Activity Insights
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekActivity}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor:"#09090b", border:"1px solid #27272a", borderRadius:"16px", color:"#fff", fontSize: "12px" }}
                  cursor={{ stroke: '#06b6d4', strokeWidth: 1 }}
                />
                <Area type="monotone" dataKey="reports" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#cyanGrad)" name="Reports" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Badges */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-8">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-8">
            <Award className="w-4 h-4 text-white" /> Milestones
          </h3>
          <div className="space-y-4">
            {badges.map(({ name, icon: Icon, color, unlock, req }) => (
              <div key={name} className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all",
                unlock ? "bg-black border-zinc-800" : "opacity-30 border-transparent grayscale"
              )}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{name}</p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{unlock ? "Unlocked" : `Locked: ${req}`}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── My Reports ───────────────────────── */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Submission Log ({myReports.length})
        </h3>

        {myReports.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-20 text-center">
            <Shield className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 text-lg font-medium">No activity recorded yet.</p>
            <p className="text-zinc-700 text-sm mt-2">Start by analyzing suspicious content in the main dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {myReports.map(report => (
              <div key={report.id} className="bg-zinc-950 border border-zinc-900 rounded-[28px] p-6 flex items-center gap-6 hover:border-zinc-700 transition-all">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold",
                  report.riskScore > 65 ? "bg-red-500/10 text-red-500" :
                  report.riskScore > 35 ? "bg-yellow-500/10 text-yellow-500" :
                  "bg-cyan-500/10 text-cyan-500"
                )}>
                  {report.riskScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-white truncate">{report.title || "Scam Analysis"}</span>
                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 border",
                      report.status === "Verified" ? "bg-green-500/5 text-green-500 border-green-500/20" :
                      report.status === "Scam"     ? "bg-red-500/5 text-red-500 border-red-500/20" :
                      "bg-zinc-900 text-zinc-500 border-zinc-800"
                    )}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 truncate font-medium">{report.content}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-700 font-bold uppercase tracking-widest shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString() : "Recent"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

