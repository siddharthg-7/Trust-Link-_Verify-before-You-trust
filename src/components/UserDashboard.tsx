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
    }, (err) => {
      console.error("User doc listener error:", err);
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

  const weekActivity = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => {
    const dayCount = myReports.filter(report => {
      const reportDate = report.timestamp?.toDate ? report.timestamp.toDate() : null;
      return reportDate && reportDate.getDay() === i;
    }).length;
    return { day, reports: dayCount };
  });

  const stats = [
    { label: "Reports Submitted", value: userData?.reportsCount || 0, icon: Shield, color: "bg-cyan-500/10 text-cyan-500" },
    { label: "Trust Score", value: `${userData?.trustScore || 50}%`, icon: Trophy, color: "bg-black text-white" },
    { label: "Votes Given", value: userData?.votesCount || 0, icon: Target, color: "bg-zinc-900 text-zinc-400" },
    { label: "Comments", value: userData?.commentsCount || 0, icon: MessageSquare, color: "bg-blue-500/10 text-blue-500" },
  ];

  const badges = [
    { name: "Top Reporter", icon: Award, color: "bg-cyan-500/10 text-cyan-500", unlock: (userData?.reportsCount || 0) >= 5, req: "5+ reports" },
    { name: "Trust Guardian", icon: Shield, color: "bg-white text-black", unlock: (userData?.trustScore || 0) >= 70, req: "70%+ trust" },
    { name: "Community Star", icon: Zap, color: "bg-zinc-900 text-zinc-400", unlock: (userData?.commentsCount || 0) >= 10, req: "10+ comments" },
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
    <div className="relative min-h-screen font-sans">
      {/* Background Glow */}
      <div className="absolute inset-0 flex justify-center overflow-hidden pointer-events-none">
        <div className="w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full mt-[-100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-12 pb-20 px-4 md:px-0">
        {/* ── Profile Header ─────────────────────────────────── */}
        <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 mt-12 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-24 h-24 rounded-2xl bg-white text-black flex items-center justify-center text-3xl font-semibold shadow-inner border-4 border-zinc-800">
              {(userData?.username || auth.currentUser?.email || "U")[0].toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left min-w-0">
              {editingName ? (
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/5 transition-all w-full max-w-xs"
                    onKeyDown={e => e.key === "Enter" && saveName()}
                    autoFocus
                  />
                  <button onClick={saveName} className="p-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition-all"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingName(false)} className="p-2 bg-zinc-800 text-zinc-500 rounded-lg hover:text-white transition-all"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h2 className="text-4xl font-semibold tracking-tighter text-white truncate">{userData?.username || "Global User"}</h2>
                  <button onClick={() => setEditingName(true)} className="p-2 text-zinc-500 hover:text-white transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm text-zinc-500 font-medium">
                <Mail className="w-3.5 h-3.5" />
                {auth.currentUser?.email}
              </div>
            </div>
            <div className="flex flex-col items-center md:items-end gap-3">
              <div className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-zinc-700/50 bg-black/40 shadow-sm",
                userData?.role === "admin" ? "text-red-400" : "text-zinc-400"
              )}>
                {userData?.role || "Protocol User"}
              </div>
              {userData?.banned && (
                <div className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-white text-black uppercase tracking-widest shadow-lg">
                  ⚠ Access Restricted
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats Row ──────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300 shadow-lg shadow-black/20 group">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-6 border border-zinc-800/50 shadow-inner group-hover:scale-110 transition-transform", color.split(' ')[0])}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-semibold tracking-tighter text-white">{value}</p>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1.5 opacity-60">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Main Dashboard Insights ────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Visualizer */}
          <div className="lg:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-lg shadow-black/20">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-8 opacity-50">
              <TrendingUp className="w-4 h-4 text-white" /> Intelligence Contribution
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekActivity}>
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="day" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0a0a0a", border: "1px solid #27272a", borderRadius: "12px", color: "#fff", fontSize: "10px", fontWeight: "bold" }}
                    cursor={{ stroke: '#ffffff', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="reports" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#cyanGrad)" name="Activity" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Achievement Milestones */}
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-lg shadow-black/20">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 mb-8 opacity-50">
              <Award className="w-4 h-4 text-white" /> Security Status
            </h3>
            <div className="space-y-4">
              {badges.map(({ name, icon: Icon, color, unlock, req }) => (
                <div key={name} className={cn("flex items-center gap-4 p-4 rounded-xl border transition-all shadow-sm",
                  unlock ? "bg-black/40 border-zinc-800" : "opacity-20 border-transparent grayscale"
                )}>
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-zinc-800/50 shadow-inner", color.split(' ')[0])}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white tracking-tight truncate">{name}</p>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">{unlock ? "Achieved" : `Required: ${req}`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Submission Log ─────────────────────────────────── */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-500 opacity-50 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Submission Log
            </h3>
            <span className="text-[10px] font-bold text-zinc-600 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md">{myReports.length} Historical Entries</span>
          </div>

          {myReports.length === 0 ? (
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800 rounded-2xl p-16 text-center shadow-lg">
              <Shield className="w-10 h-10 text-zinc-800 mx-auto mb-4 opacity-50" />
              <p className="text-zinc-500 font-medium">No activity recorded on network.</p>
              <p className="text-zinc-700 text-xs mt-2 uppercase tracking-widest font-bold">Awaiting first vulnerability analysis</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myReports.map(report => (
                <div key={report.id} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 hover:border-zinc-700 transition-all duration-300 shadow-lg group">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-black border border-zinc-800/50 shadow-inner",
                    report.riskScore > 65 ? "text-red-400 bg-red-400/5" :
                      report.riskScore > 35 ? "text-yellow-400 bg-yellow-400/5" :
                        "text-zinc-400 bg-zinc-400/5"
                  )}>
                    {report.riskScore}%
                  </div>
                  <div className="flex-1 min-w-0 w-full text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1">
                      <span className="font-semibold text-white tracking-tight truncate">{report.title || "Intelligence Entry"}</span>
                      <div className="flex justify-center md:justify-start">
                        <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tight border",
                          report.status === "Verified" ? "bg-black/40 text-green-400 border-green-500/20" :
                            report.status === "Scam" ? "bg-black/40 text-red-400 border-red-500/20" :
                              "bg-black/40 text-zinc-500 border-zinc-800"
                        )}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-500 truncate font-normal opacity-70">{report.content}</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-widest shrink-0 opacity-60">
                    <Clock className="w-3.5 h-3.5" />
                    {report.timestamp?.toDate ? report.timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Recently Logged"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

