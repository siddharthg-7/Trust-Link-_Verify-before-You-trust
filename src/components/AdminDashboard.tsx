import React, { useState, useEffect } from "react";
import {
  LayoutDashboard, Shield, Users, BarChart3, Settings, ClipboardList,
  Bell, Search, RefreshCw, LogOut, AlertTriangle, CheckCircle, Clock,
  Trash2, Check, X, Eye, Ban, UserCog, Filter, Download, Zap,
  TrendingUp, Activity, Globe, Lock, ChevronRight, FileWarning,
  MessageSquare, Star, Info, PieChart as PieChartIcon, Send,
  BookOpen, Database, Cpu, ToggleLeft, ToggleRight, MoreVertical,
  ArrowUpRight, Loader2, Menu
} from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { db, auth } from "../lib/firebase";
import {
  collection, query, orderBy, onSnapshot, updateDoc, doc,
  deleteDoc, where, getDocs, writeBatch, addDoc, serverTimestamp,
  limit, getDoc, setDoc, Timestamp, increment
} from "firebase/firestore";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";
import axios from "axios";
import { logAudit } from "../lib/audit";
import { ChatSystem } from "./ChatSystem";
import { sendUserEmail } from "../services/emailService";
import { motion, AnimatePresence } from "framer-motion";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

// ─── Types ─────────────────────────────────────────────────────
type AdminTab =
  | "overview" | "moderation" | "scam-analysis" | "users"
  | "reports" | "analytics" | "settings" | "audit" | "notifications";

const CHART_COLORS = ["#ef4444", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899"];
const TOOLTIP_STYLE = {
  backgroundColor: "#0f172a", border: "1px solid #ffffff10",
  borderRadius: "12px", color: "#fff", fontSize: "12px"
};

// ─── Sidebar Nav Items ──────────────────────────────────────────
const NAV = [
  { id: "overview",       label: "Dashboard",       icon: LayoutDashboard, badge: null },
  { id: "moderation",     label: "Moderation",      icon: Shield,          badge: "reports" },
  { id: "scam-analysis",  label: "Scam Analysis",   icon: Cpu,             badge: null },
  { id: "users",          label: "Users",           icon: Users,           badge: null },
  { id: "reports",        label: "Reports",         icon: ClipboardList,   badge: "pending" },
  { id: "analytics",      label: "Analytics",       icon: BarChart3,       badge: null },
  { id: "settings",       label: "Settings",        icon: Settings,        badge: null },
  { id: "audit",          label: "Audit Logs",      icon: BookOpen,        badge: null },
  { id: "notifications",  label: "Notifications",   icon: Bell,            badge: null },
] as const;

// ─── Main AdminDashboard Component ─────────────────────────────
interface AdminDashboardProps { user: any; onLogout: () => void; }

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [reports, setReports]     = useState<any[]>([]);
  const [users, setUsers]         = useState<any[]>([]);
  const [community, setCommunity] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isAdminSidebarOpen, setIsAdminSidebarOpen] = useState(false);

  // Derive active tab from URL path
  const pathParts = location.pathname.split('/');
  const activeTab = pathParts[2] || "overview";

  const pendingCount  = reports.filter(r => r.status === "Pending").length;
  const highRiskCount = reports.filter(r => r.riskScore > 65).length;

  // Live Firestore subscriptions
  useEffect(() => {
    const handleError = (collection: string) => (err: any) => {
      if (err.code === 'permission-denied') {
        console.warn(`Admin ${collection} feed: Permission denied - syncing auth state...`);
      } else {
        console.error(`Admin ${collection} error:`, err);
      }
    };

    const unsubReports = onSnapshot(
      query(collection(db, "reports"), orderBy("timestamp", "desc")),
      snap => setReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      handleError("reports")
    );
    const unsubUsers = onSnapshot(
      query(collection(db, "users"), orderBy("createdAt", "desc")),
      snap => setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      handleError("users")
    );
    const unsubComm = onSnapshot(
      query(collection(db, "community"), orderBy("timestamp", "desc")),
      snap => setCommunity(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      handleError("community")
    );
    const unsubAudit = onSnapshot(
      query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(100)),
      snap => setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      handleError("audit")
    );
    return () => { unsubReports(); unsubUsers(); unsubComm(); unsubAudit(); };
  }, []);

  const AdminSidebarContent = (
    <div className="flex flex-col h-full bg-black">
      {/* Logo */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 cursor-default group">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <Shield size={16} className="text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tighter text-white leading-none">Admin</span>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-[0.2em] mt-1.5 opacity-70">Intelligence</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="mb-4 px-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-4 opacity-50">Systems</p>
        </div>
        {NAV.map(({ id, label, icon: Icon, badge }) => {
          const isActive = activeTab === id;
          const badgeCount = badge === "reports" ? reports.length : badge === "pending" ? pendingCount : 0;
          return (
            <button
              key={id}
              onClick={() => { 
                navigate(`/admin/${id === 'overview' ? '' : id}`); 
                setIsAdminSidebarOpen(false); 
              }}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2 rounded-xl text-sm transition-all duration-300 group",
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-500 hover:text-white hover:bg-zinc-900/50"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-white" : "group-hover:text-white")} />
                <span className="font-medium tracking-tight">{label}</span>
              </div>
              {badgeCount > 0 && (
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-tight",
                  isActive ? "bg-white text-black" : "bg-zinc-800 text-zinc-400"
                )}>
                  {badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Admin user */}
      <div className="p-4 border-t border-zinc-900">
        <div className="flex items-center gap-3 px-4 mb-4">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-700/50 shadow-inner">
            {user?.email?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate tracking-tight">{user?.displayName || "Administrator"}</p>
            <p className="text-[9px] text-zinc-600 truncate font-medium uppercase tracking-tight">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 group"
        >
          <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Exit Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden relative font-sans">
      {/* ── Desktop Sidebar ──────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 h-full bg-black border-r border-zinc-900 flex-col shrink-0 z-20">
        {AdminSidebarContent}
      </aside>

      {/* ── Mobile Sidebar Drawer ─────────────────────────────── */}
      <AnimatePresence>
        {isAdminSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 h-full z-50 lg:hidden shadow-2xl"
            >
              {AdminSidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ───────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Glow */}
        <div className="absolute inset-0 flex justify-center overflow-hidden pointer-events-none">
          <div className="w-[800px] h-[800px] bg-white/5 blur-[120px] rounded-full mt-[-200px]" />
        </div>

        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-xl border-b border-zinc-800/50 px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAdminSidebarOpen(true)}
              className="lg:hidden p-2 bg-zinc-900/50 rounded-lg text-zinc-500 hover:text-white"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="font-semibold text-sm lg:text-base tracking-tight text-white">
                {NAV.find(n => n.id === activeTab)?.label || "Dashboard"}
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest hidden sm:block opacity-60">Trust Intelligence Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {highRiskCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-400 uppercase tracking-tight">
                <AlertTriangle className="w-3 h-3" />
                <span className="hidden xs:inline">{highRiskCount} Threat Alerts</span>
                <span className="xs:hidden">{highRiskCount}</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-400 uppercase tracking-tight shadow-inner">
                <Clock className="w-3 h-3" />
                <span className="hidden xs:inline">{pendingCount} Verification Requests</span>
                <span className="xs:hidden">{pendingCount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
            <Routes>
              <Route path="/" element={<OverviewTab reports={reports} users={users} community={community} />} />
              <Route path="/moderation" element={<ModerationTab reports={reports} user={user} />} />
              <Route path="/scam-analysis" element={<ScamAnalysisTab />} />
              <Route path="/users" element={<UsersTab users={users} />} />
              <Route path="/reports" element={<ReportsTab reports={reports} />} />
              <Route path="/analytics" element={<AnalyticsTab reports={reports} users={users} community={community} />} />
              <Route path="/settings" element={<SettingsTab />} />
              <Route path="/audit" element={<AuditTab logs={auditLogs} />} />
              <Route path="/notifications" element={<NotificationsTab reports={reports} />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  1. OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════
function OverviewTab({ reports, users, community }: { reports: any[]; users: any[]; community: any[] }) {
  const scamCount    = reports.filter(r => r.category === "Scam").length;
  const safeCount    = reports.filter(r => r.category === "Safe").length;
  const pendingCount = reports.filter(r => r.status === "Pending").length;
  const highRisk     = reports.filter(r => r.riskScore > 65);

  const weekData = {
    labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    datasets: [
      {
        label: 'Scams',
        data: [0,0,0,0,0,0,0].map((_, i) => reports.filter(r => r.riskScore > 65 && r.timestamp?.toDate && r.timestamp.toDate().getDay() === (i + 1) % 7).length),
        backgroundColor: '#ef4444',
        borderRadius: 4,
      },
      {
        label: 'Safe',
        data: [0,0,0,0,0,0,0].map((_, i) => reports.filter(r => r.riskScore <= 35 && r.timestamp?.toDate && r.timestamp.toDate().getDay() === (i + 1) % 7).length),
        backgroundColor: '#22c55e',
        borderRadius: 4,
      }
    ]
  };

  const categoryData = {
    labels: ["Phishing", "Investment", "Impersonation", "Tech Support"],
    datasets: [{
      data: [
        reports.filter(r => r.category === "Phishing").length || 1,
        reports.filter(r => r.category === "Investment").length || 1,
        reports.filter(r => r.category === "Impersonation").length || 1,
        reports.filter(r => r.category === "Tech Support").length || 1,
      ],
      backgroundColor: CHART_COLORS,
      borderWidth: 0,
    }]
  };

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Reports",   value: reports.length,   icon: ClipboardList, color: "from-blue-500/20 to-blue-600/10",    text: "text-blue-400" },
          { label: "Scam Detected",   value: scamCount,        icon: AlertTriangle,  color: "from-red-500/20 to-red-600/10",     text: "text-red-400" },
          { label: "Pending Review",  value: pendingCount,     icon: Clock,          color: "from-yellow-500/20 to-yellow-600/10",text: "text-yellow-400" },
          { label: "Registered Users",value: users.length,     icon: Users,          color: "from-green-500/20 to-green-600/10", text: "text-green-400" },
        ].map(({ label, value, icon: Icon, color, text }) => (
          <GlassCard key={label} className="p-5">
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", color)}>
              <Icon className={cn("w-5 h-5", text)} />
            </div>
            <p className="text-2xl font-black">{value}</p>
            <p className="text-xs text-white/40 font-medium mt-0.5">{label}</p>
          </GlassCard>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly activity */}
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Weekly Submission Activity
            </h3>
            <span className="text-xs text-white/30">Last 7 days</span>
          </div>
          <div className="h-52">
            <Bar 
              data={weekData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { backgroundColor: '#0f172a' } },
                scales: { 
                  x: { grid: { display: false }, ticks: { color: '#ffffff40' } },
                  y: { grid: { color: '#ffffff05' }, ticks: { color: '#ffffff40' } }
                }
              }} 
            />
          </div>
        </GlassCard>

        {/* Category heatmap */}
        <GlassCard className="p-6">
          <h3 className="font-bold flex items-center gap-2 mb-6">
            <PieChartIcon className="w-4 h-4 text-purple-400" /> Scam Category Heatmap
          </h3>
          <div className="h-40">
            <Pie 
              data={categoryData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }} 
            />
          </div>
          <div className="mt-3 space-y-1.5">
            {categoryData.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i] }} />
                  <span className="text-white/50">{label}</span>
                </div>
                <span className="font-bold">{categoryData.datasets[0].data[i]}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* High-risk alerts */}
      {highRisk.length > 0 && (
        <GlassCard className="p-5 border border-red-500/20">
          <h3 className="font-bold text-red-400 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4" /> 🚨 Real-Time High-Risk Alerts
          </h3>
          <div className="space-y-2">
            {highRisk.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center gap-4 p-3 bg-red-500/5 rounded-xl border border-red-500/10">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{r.title || "Untitled Report"}</p>
                  <p className="text-xs text-white/30 truncate">{r.content?.substring(0, 80)}...</p>
                </div>
                <div className="text-xs font-black text-red-400 bg-red-500/10 px-2 py-1 rounded-lg shrink-0">
                  {r.riskScore}%
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

{/* Platform stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Community Posts", value: community.length, icon: MessageSquare, color: "text-indigo-400" },
          { label: "High-Risk Flagged", value: reports.filter(r => r.riskScore > 65).length, icon: FileWarning, color: "text-red-400" },
          { label: "Verified Reports", value: reports.filter(r => r.status === "Verified").length, icon: CheckCircle, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <GlassCard key={label} className="p-4 flex items-center gap-3">
            <Icon className={cn("w-5 h-5 shrink-0", color)} />
            <div>
              <p className="text-xl font-black">{value}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  2. MODERATION TAB
// ═══════════════════════════════════════════════════════════════
function ModerationTab({ reports, user }: { reports: any[]; user: any }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [reviewingReport, setReviewingReport] = useState<any>(null);
  const [adminScore, setAdminScore] = useState<number>(50);
  const [adminFeedback, setAdminFeedback] = useState("");

  const filtered = reports.filter(r => {
    const matchSearch = (r.title || r.content || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status?.toLowerCase() === filterStatus;
    return matchSearch && matchStatus;
  });

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      await updateDoc(doc(db, "reports", id), { status });
      await logAudit(
        status === "Verified" ? "report_approved" : "report_rejected",
        `Report ${status}: ${id}`, id
      );
      toast.success(`Marked as ${status}`);
    } catch { toast.error("Update failed"); }
    finally { setUpdatingId(null); }
  }

  async function assignLabel(id: string, label: "Verified" | "Suspicious" | "Scam") {
    setUpdatingId(id);
    try {
      const fixedScore = label === "Verified" ? 0 : label === "Scam" ? 100 : 50;
      const r = reports.find(x => x.id === id);
      const aiScore = r?.riskScore || 0;
      const weightedScore = Math.round((aiScore * 0.7) + (fixedScore * 0.3));

      await updateDoc(doc(db, "reports", id), { 
        trustLabel: label, 
        status: label === "Verified" ? "Verified" : label,
        adminScore: fixedScore,
        weightedScore
      });
      await logAudit("report_flagged", `Trust label set to ${label}`, id);
      toast.success(`Label set: ${label}`);
    } catch { toast.error("Label update failed"); }
    finally { setUpdatingId(null); }
  }

  async function submitDetailedReview() {
    if (!reviewingReport) return;
    setUpdatingId(reviewingReport.id);
    try {
      const aiScore = reviewingReport.riskScore || 0;
      const weightedScore = Math.round((aiScore * 0.7) + (adminScore * 0.3));
      const status = weightedScore > 50 ? "Scam" : "Verified";

      await updateDoc(doc(db, "reports", reviewingReport.id), {
        adminScore,
        weightedScore,
        adminFeedback,
        status,
        lastReviewedAt: serverTimestamp(),
        reviewedBy: user?.email
      });

      // Trigger User Email via Resend Service
      if (reviewingReport.userEmail) {
        try {
          await sendUserEmail({
            to: reviewingReport.userEmail,
            userName: reviewingReport.userName || 'User',
            trustScore: weightedScore,
            status,
            feedback: adminFeedback || 'No specific feedback provided.',
            reportId: reviewingReport.id
          });
        } catch (e) {
          console.error("User Email Failure:", e);
        }
      }

      await logAudit("detailed_review_submitted", `Review submitted for ${reviewingReport.id}. Weighted Score: ${weightedScore}`, reviewingReport.id);
      toast.success("Review submitted and user notified!");
      setReviewingReport(null);
    } catch (error) { 
      console.error("Review Error:", error);
      toast.error("Review failed"); 
    } finally { setUpdatingId(null); }
  }

  async function deleteReport(id: string) {
    if (!confirm("Delete this report permanently?")) return;
    try {
      await deleteDoc(doc(db, "reports", id));
      await logAudit("report_deleted", `Deleted report ${id}`, id);
      toast.success("Deleted");
    } catch { toast.error("Delete failed"); }
  }

  async function bulkAction(action: "verify" | "delete") {
    if (!selected.length) return;
    const batch = writeBatch(db);
    selected.forEach(id => {
      const ref = doc(db, "reports", id);
      if (action === "verify") batch.update(ref, { status: "Verified" });
      else batch.delete(ref);
    });
    try {
      await batch.commit();
      await logAudit("bulk_action", `Bulk ${action} on ${selected.length} reports`);
      toast.success(`Bulk ${action} complete (${selected.length})`);
      setSelected([]);
    } catch { toast.error("Bulk action failed"); }
  }

  return (
    <div className="space-y-5">
      {/* ── Detailed Review Panel ────────────────────────────────── */}
      {reviewingReport && (
        <GlassCard gradient className="p-6 border-2 border-blue-500/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" /> Trust Intelligence Review
            </h3>
            <button onClick={() => setReviewingReport(null)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Original Content</p>
                <h4 className="font-bold text-sm mb-1">{reviewingReport.title}</h4>
                <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">{reviewingReport.content}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-400/50 mb-1">NLP AI Contribution (70%)</p>
                  <p className="text-2xl font-black">{reviewingReport.riskScore}%</p>
                </div>
                <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-400/50 mb-1">Final Weighted Score</p>
                  <p className="text-2xl font-black text-white/80">
                    {Math.round((reviewingReport.riskScore * 0.7) + (adminScore * 0.3))}%
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-black uppercase tracking-widest text-white/40">Admin Review Score (30%)</label>
                  <span className={cn("text-xl font-black transition-colors", adminScore > 50 ? "text-red-400" : "text-green-400")}>{adminScore}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" step="1"
                  value={adminScore} onChange={(e) => setAdminScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-white/20 uppercase">
                  <span>Safe (0)</span>
                  <span>Moderate (50)</span>
                  <span>Scam (100)</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/40">Moderator Feedback (Visible to User)</label>
                <textarea 
                  value={adminFeedback} onChange={(e) => setAdminFeedback(e.target.value)}
                  placeholder="Explain why this was marked as scam or safe..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                />
              </div>

              <button 
                onClick={submitDetailedReview}
                disabled={updatingId === reviewingReport.id}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]"
              >
                {updatingId === reviewingReport.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                Submit 70/30 Hybrid Verification
              </button>

              <div className="mt-6">
                <ChatSystem 
                  reportId={reviewingReport.id} 
                  currentRole="admin" 
                  contentContext={reviewingReport.content} 
                />
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search reports..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm focus:outline-none"
        >
          {["all","pending","verified","scam"].map(s => <option key={s} value={s} className="bg-[#0f172a] capitalize">{s}</option>)}
        </select>
        {selected.length > 0 && (
          <div className="flex gap-2 ml-auto">
            <button onClick={() => bulkAction("verify")} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all">
              ✓ Verify {selected.length}
            </button>
            <button onClick={() => bulkAction("delete")} className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all">
              ✕ Delete {selected.length}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-xs font-bold uppercase tracking-wider text-white/30">
                <th className="px-4 py-3 w-10 text-center">
                  <input type="checkbox" className="rounded"
                    onChange={e => e.target.checked ? setSelected(filtered.map(r => r.id)) : setSelected([])}
                  />
                </th>
                <th className="px-4 py-3 text-left">Content</th>
                <th className="px-4 py-3 text-left">Trust Metrics</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Verified By</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" className="rounded" checked={selected.includes(r.id)}
                      onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(i => i !== r.id))}
                    />
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm truncate">{r.title || "Untitled"}</p>
                      {r.adminScore !== undefined && (
                        <span className="text-[8px] bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded uppercase font-black tracking-tighter">Analyzed</span>
                      )}
                    </div>
                    <p className="text-xs text-white/30 truncate">{r.content}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 w-32">
                      <div className="flex justify-between text-[10px] font-black uppercase text-white/20">
                        <span>Risk</span>
                        <span className={cn(
                          r.weightedScore !== undefined ? "text-blue-400" : "text-white/40"
                        )}>{r.weightedScore ?? r.riskScore}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className={cn("h-full transition-all",
                          (r.weightedScore ?? r.riskScore) > 65 ? "bg-red-500" : (r.weightedScore ?? r.riskScore) > 35 ? "bg-yellow-500" : "bg-green-500"
                        )} style={{ width: `${r.weightedScore ?? r.riskScore}%` }} />
                      </div>
                      <div className="flex gap-2 text-[8px] font-bold text-white/30 uppercase mt-0.5">
                        <span>AI: {r.riskScore}%</span>
                        {r.adminScore !== undefined && <span>Admin: {r.adminScore}%</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider",
                      r.status === "Pending"  ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/10" :
                      r.status === "Verified" ? "bg-green-500/10 text-green-500 border border-green-500/10"   :
                      r.status === "Scam"     ? "bg-red-500/10 text-red-400 border border-red-500/10"       :
                      "bg-white/5 text-white/40"
                    )}>
                      {r.status || "Unknown"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.reviewedBy ? (
                      <div className="flex flex-col">
                        <span className="text-xs font-bold truncate max-w-[100px]">{r.reviewedBy.split('@')[0]}</span>
                        <span className="text-[9px] text-white/20 uppercase font-black">Moderator</span>
                      </div>
                    ) : (
                      <span className="text-[9px] text-white/20 uppercase font-black">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => { setReviewingReport(r); setAdminScore(r.adminScore ?? 50); setAdminFeedback(r.adminFeedback ?? ""); }}
                        className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all" title="Detailed Review"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteReport(r.id)}
                        className="p-2 bg-white/5 text-white/30 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">No reports found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  3. SCAM ANALYSIS TAB
function ScamAnalysisTab() {
  const [content, setContent] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.post("/api/analyze", { content });
      setResult(data);
    } catch { toast.error("Analysis failed"); }
    finally { setLoading(false); }
  }

  const urlMatch = content.match(/https?:\/\/([^\s/]+)/i);
  const domain = urlMatch?.[1];

  return (
    <div className="space-y-6 max-w-3xl">
      <GlassCard gradient className="p-6">
        <h3 className="font-bold flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-blue-400" /> Scam Analysis Engine
        </h3>
        <textarea value={content} onChange={e => setContent(e.target.value)}
          placeholder="Paste URL, email, or message content for deep NLP analysis..."
          className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
        />
        <button onClick={analyze} disabled={loading || !content.trim()}
          className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Running Analysis...</> : <><Cpu className="w-4 h-4" /> Analyze with AI</>}
        </button>
      </GlassCard>

      {result && (
        <div className="space-y-4">
          {/* Risk Score */}
          <GlassCard className={cn("p-6 border-l-4",
            result.riskScore > 65 ? "border-l-red-500" : result.riskScore > 35 ? "border-l-yellow-500" : "border-l-green-500"
          )}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className={cn("text-4xl font-black",
                  result.riskScore > 65 ? "text-red-400" : result.riskScore > 35 ? "text-yellow-400" : "text-green-400"
                )}>{result.riskScore}%</span>
                <span className="text-white/30 text-sm ml-2">Risk Score</span>
              </div>
              <span className={cn("px-4 py-2 rounded-xl text-sm font-bold border",
                result.category === "Scam"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-green-500/10 text-green-400 border-green-500/20"
              )}>
                {result.category === "Scam" ? "🚨 SCAM" : "✅ SAFE"}
              </span>
            </div>
            <div className="h-2 bg-white/5 rounded-full mb-4">
              <div className={cn("h-full rounded-full transition-all duration-700",
                result.riskScore > 65 ? "bg-red-500" : result.riskScore > 35 ? "bg-yellow-500" : "bg-green-500"
              )} style={{ width: `${result.riskScore}%` }} />
            </div>
            <p className="text-sm text-white/60">{result.explanation}</p>
            {result.bayesScore && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-semibold text-blue-400">
                <Cpu className="w-3 h-3" /> Naive Bayes Confidence: {result.bayesScore}%
              </div>
            )}
          </GlassCard>

          {/* Findings */}
          {result.findings?.length > 0 && (
            <GlassCard className="p-5">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-yellow-400" /> Detection Findings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.findings.map((f: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-white/50 bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500/60 shrink-0 mt-0.5" />
                    {f}
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Domain Info */}
          {domain && (
            <GlassCard className="p-5">
              <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" /> Domain Analysis
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/30 mb-1">Domain</p>
                  <p className="font-mono font-semibold text-blue-400 truncate">{domain}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/30 mb-1">SSL Status</p>
                  <p className={cn("font-semibold", content.startsWith("https") ? "text-green-400" : "text-red-400")}>
                    {content.startsWith("https") ? "✅ Secure (HTTPS)" : "⚠️ No SSL (HTTP)"}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/30 mb-1">Risk Level</p>
                  <p className={cn("font-semibold",
                    result.riskScore > 65 ? "text-red-400" : result.riskScore > 35 ? "text-yellow-400" : "text-green-400"
                  )}>
                    {result.riskLevel?.toUpperCase()}
                  </p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl">
                  <p className="text-xs text-white/30 mb-1">Blacklist Status</p>
                  <p className={cn("font-semibold", result.riskScore > 65 ? "text-red-400" : "text-green-400")}>
                    {result.riskScore > 65 ? "🚨 Flagged" : "✅ Clear"}
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  4. USERS TAB
// ═══════════════════════════════════════════════════════════════
function UsersTab({ users }: { users: any[] }) {
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  async function updateRole(uid: string, role: string) {
    setUpdatingId(uid);
    try {
      await updateDoc(doc(db, "users", uid), { role });
      await logAudit("user_role_changed", `Changed role to ${role} for user ${uid}`, uid);
      toast.success(`Role updated to ${role}`);
    } catch { toast.error("Failed to update role"); }
    finally { setUpdatingId(null); }
  }

  async function banUser(uid: string, banned: boolean) {
    setUpdatingId(uid);
    try {
      await updateDoc(doc(db, "users", uid), { banned, banTime: banned ? serverTimestamp() : null });
      await logAudit("user_banned", `User ${banned ? "banned" : "unbanned"}: ${uid}`, uid);
      toast.success(banned ? "User banned" : "User unbanned");
    } catch { toast.error("Action failed"); }
    finally { setUpdatingId(null); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none"
          />
        </div>
        <span className="text-xs text-white/30">{filtered.length} users</span>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-xs font-bold uppercase tracking-wider text-white/30">
                <th className="px-5 py-3 text-left">User</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Trust Score</th>
                <th className="px-5 py-3 text-left">Reports</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold shrink-0">
                        {u.email?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{u.username || u.email?.split("@")[0]}</p>
                        <p className="text-xs text-white/30">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <select value={u.role || "user"}
                      onChange={e => updateRole(u.id, e.target.value)}
                      className={cn("bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-xs font-bold focus:outline-none",
                        u.role === "admin" ? "text-red-400" : u.role === "moderator" ? "text-yellow-400" : "text-blue-400"
                      )}
                    >
                      {["user","moderator","admin"].map(r => (
                        <option key={r} value={r} className="bg-[#0f172a] capitalize">{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <div className="w-24 h-1.5 bg-white/10 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${u.trustScore || 50}%` }} />
                    </div>
                    <span className="text-xs text-white/40 mt-1">{u.trustScore || 50}%</span>
                  </td>
                  <td className="px-5 py-3 text-center text-sm font-bold">{u.reportsCount || 0}</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-lg font-semibold",
                      u.banned ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
                    )}>
                      {u.banned ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => banUser(u.id, !u.banned)}
                      disabled={updatingId === u.id}
                      className={cn("p-1.5 rounded-lg transition-all text-xs font-bold px-2.5",
                        u.banned
                          ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          : "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                      )}
                    >
                      {updatingId === u.id ? "..." : u.banned ? "Unban" : "Ban"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-white/30 text-sm">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  5. REPORTS TAB (Flag Handling)
// ═══════════════════════════════════════════════════════════════
function ReportsTab({ reports }: { reports: any[] }) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"warn" | "verify" | null>(null);
  const sorted = [...reports].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

  async function warnUser(report: any) {
    if (!report.userId) {
      toast.error("User ID missing from report");
      return;
    }
    
    setUpdatingId(report.id);
    setActionType("warn");
    try {
      const userRef = doc(db, "users", report.userId);
      // Update user doc
      await updateDoc(userRef, { 
        warned: true, 
        warnCount: increment(1) 
      });
      // Also update report status to 'Scam' if it was verified/pending
      await updateDoc(doc(db, "reports", report.id), { status: "Scam" });
      
      await logAudit("user_warned", `Warning sent for report ${report.id}`, report.id);
      toast.success("User warned and report flagged as Scam");
    } catch (e: any) { 
      console.error("Warn User Error:", e);
      toast.error("Failed to warn user: " + (e.message || "Unknown error")); 
    } finally {
      setUpdatingId(null);
      setActionType(null);
    }
  }

  async function markSafe(id: string) {
    setUpdatingId(id);
    setActionType("verify");
    try {
      await updateDoc(doc(db, "reports", id), { status: "Verified" });
      await logAudit("report_approved", `Report marked safe: ${id}`, id);
      toast.success("Marked as Safe");
    } catch (e: any) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
      setActionType(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Filter className="w-4 h-4 text-white/30" />
        <span className="text-sm text-white/40">Sorted by risk score — highest first</span>
      </div>
      {sorted.map(r => (
        <GlassCard key={r.id} className={cn("p-5 border-l-4",
          r.riskScore > 65 ? "border-l-red-500" : r.riskScore > 35 ? "border-l-yellow-500" : "border-l-green-500"
        )}>
          <div className="flex items-start gap-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg font-black",
              r.riskScore > 65 ? "bg-red-500/10" : r.riskScore > 35 ? "bg-yellow-500/10" : "bg-green-500/10"
            )}>
              {r.riskScore}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-bold text-sm">{r.title || "Untitled Report"}</span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                  r.status === "Pending"  ? "bg-yellow-500/10 text-yellow-400" :
                  r.status === "Verified" ? "bg-green-500/10 text-green-400"   :
                  "bg-red-500/10 text-red-400"
                )}>
                  {r.status}
                </span>
              </div>
              <p className="text-xs text-white/40 line-clamp-2">{r.content}</p>
              {r.findings?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.findings.slice(0, 3).map((f: string, i: number) => (
                    <span key={i} className="text-[10px] bg-yellow-500/5 border border-yellow-500/10 text-yellow-400/60 px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button 
                onClick={() => warnUser(r)} 
                disabled={updatingId === r.id}
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-lg transition-all font-semibold flex items-center justify-center gap-2",
                  r.status === "Scam" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                )}
              >
                {updatingId === r.id && actionType === "warn" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : r.status === "Scam" ? (
                   <AlertTriangle className="w-3 h-3" />
                ) : (
                  "⚠ Warn User"
                )}
              </button>
              <button 
                onClick={() => markSafe(r.id)} 
                disabled={updatingId === r.id}
                className={cn(
                  "text-xs px-2.5 py-1.5 rounded-lg transition-all font-semibold flex items-center justify-center gap-2",
                  r.status === "Verified" ? "bg-green-500/20 text-green-400" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                )}
              >
                {updatingId === r.id && actionType === "verify" ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : r.status === "Verified" ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  "✅ Mark Safe"
                )}
              </button>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  6. ANALYTICS TAB
// ═══════════════════════════════════════════════════════════════
function AnalyticsTab({ reports, users, community }: { reports: any[]; users: any[]; community: any[] }) {
  const categoryDist = {
    labels: ["Scam", "Safe", "Pending"],
    datasets: [{
      data: [
        reports.filter(r => r.category === "Scam").length,
        reports.filter(r => r.category === "Safe").length,
        reports.filter(r => r.status === "Pending").length,
      ],
      backgroundColor: ["#ef4444", "#22c55e", "#f59e0b"],
      borderWidth: 0,
    }]
  };

  const riskBandsData = {
    labels: ["0–25% (Low)", "26–50% (Moderate)", "51–75% (High)", "76–100% (Critical)"],
    datasets: [{
      label: 'Reports',
      data: [
        reports.filter(r => r.riskScore <= 25).length,
        reports.filter(r => r.riskScore > 25 && r.riskScore <= 50).length,
        reports.filter(r => r.riskScore > 50 && r.riskScore <= 75).length,
        reports.filter(r => r.riskScore > 75).length,
      ],
      backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"],
      borderRadius: 4,
    }]
  };

  const weeklyTrendData = {
    labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
    datasets: [
      {
        label: 'Reports',
        data: [0,0,0,0,0,0,0].map((_, i) => reports.filter(r => r.timestamp?.toDate && r.timestamp.toDate().getDay() === (i + 1) % 7).length),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Users',
        data: [0,0,0,0,0,0,0].map((_, i) => users.filter(u => u.createdAt?.toDate && u.createdAt.toDate().getDay() === (i + 1) % 7).length),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Category distribution */}
        <GlassCard className="p-6">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 text-purple-400" /> Category Distribution
          </h3>
          <div className="h-56">
            <Pie 
              data={categoryDist} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#ffffff40', font: { size: 10 } } } }
              }} 
            />
          </div>
        </GlassCard>

        {/* Risk bands */}
        <GlassCard className="p-6">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" /> Risk Score Distribution
          </h3>
          <div className="h-56">
            <Bar 
              data={riskBandsData} 
              options={{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                  x: { grid: { display: false }, ticks: { color: '#ffffff40' } },
                  y: { grid: { display: false }, ticks: { color: '#ffffff40', font: { size: 9 } } }
                }
              }} 
            />
          </div>
        </GlassCard>
      </div>

      {/* Weekly trend */}
      <GlassCard className="p-6">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-400" /> Weekly Trend — Reports vs New Users
        </h3>
        <div className="h-64">
          <Line 
            data={weeklyTrendData} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top', labels: { color: '#ffffff40' } } },
              scales: { 
                x: { grid: { display: false }, ticks: { color: '#ffffff40' } },
                y: { grid: { color: '#ffffff05' }, ticks: { color: '#ffffff40' } }
              }
            }} 
          />
        </div>
      </GlassCard>

      {/* Summary metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Avg Risk Score", value: reports.length ? Math.round(reports.reduce((s,r) => s + (r.riskScore||0), 0) / reports.length) + "%" : "N/A" },
          { label: "Scam Rate",      value: reports.length ? Math.round(reports.filter(r=>r.category==="Scam").length / reports.length * 100) + "%" : "N/A" },
          { label: "Community Posts",value: community.length },
          { label: "Total Users",    value: users.length },
        ].map(({ label, value }) => (
          <GlassCard key={label} className="p-4 text-center">
            <p className="text-2xl font-black">{value}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider mt-1">{label}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  7. SETTINGS TAB
// ═══════════════════════════════════════════════════════════════
function SettingsTab() {
  const [sensitivity, setSensitivity] = useState<"strict"|"moderate"|"lenient">("moderate");
  const [autoApprove, setAutoApprove] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveSettings() {
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "nlp"), { sensitivity, autoApprove, updatedAt: serverTimestamp() });
      await logAudit("settings_updated", `NLP sensitivity set to ${sensitivity}, auto-approve: ${autoApprove}`);
      toast.success("Settings saved");
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  }

  async function syncIntel() {
    setIsSyncing(true);
    try {
      const { data } = await axios.post("/api/admin/sync-threat-intel");
      await logAudit("threat_intel_synced", `Synced ${data.keywords?.length || 0} threat keywords`);
      toast.success(data.message);
    } catch { toast.error("Sync failed"); }
    finally { setIsSyncing(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <GlassCard className="p-6">
        <h3 className="font-bold mb-5 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" /> NLP Engine Configuration
        </h3>
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-white/40 block mb-3">Detection Sensitivity</label>
            <div className="grid grid-cols-3 gap-2">
              {(["strict","moderate","lenient"] as const).map(s => (
                <button key={s} onClick={() => setSensitivity(s)}
                  className={cn("py-3 rounded-xl font-bold text-sm capitalize transition-all border",
                    sensitivity === s
                      ? s === "strict"   ? "border-red-500 bg-red-500/10 text-red-400"
                      : s === "moderate" ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                      : "border-green-500 bg-green-500/10 text-green-400"
                      : "border-white/10 text-white/30 hover:border-white/30"
                  )}>
                  {s === "strict" ? "🔴" : s === "moderate" ? "🟡" : "🟢"} {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-2">
              {sensitivity === "strict"   ? "Flags any content with >30% risk. More false positives." :
               sensitivity === "moderate" ? "Balanced mode. Flags >50% risk. Recommended." :
               "Only flags very obvious scams (>70% risk). More lenient."}
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="font-semibold text-sm">Auto-Approve Safe Content</p>
              <p className="text-xs text-white/30 mt-0.5">Reports with risk &lt;20% are auto-approved</p>
            </div>
            <button onClick={() => setAutoApprove(!autoApprove)}
              className={cn("w-12 h-6 rounded-full transition-all relative", autoApprove ? "bg-blue-600" : "bg-white/10")}>
              <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-all", autoApprove ? "left-7" : "left-1")} />
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={saveSettings} disabled={saving}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save Settings
            </button>
            <button onClick={syncIntel} disabled={isSyncing}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              Sync Threat Intel
            </button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-yellow-400" /> Security Settings
        </h3>
        <div className="space-y-3 text-sm">
          {[
            { label: "Admin Email", value: auth.currentUser?.email || "—" },
            { label: "Session", value: "Active" },
            { label: "Last Login", value: new Date().toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
              <span className="text-white/40">{label}</span>
              <span className="font-semibold text-xs font-mono">{value}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  8. AUDIT LOGS TAB
// ═══════════════════════════════════════════════════════════════
function AuditTab({ logs }: { logs: any[] }) {
  const actionColor: Record<string, string> = {
    report_approved:   "text-green-400 bg-green-500/10",
    report_rejected:   "text-red-400 bg-red-500/10",
    report_deleted:    "text-red-400 bg-red-500/10",
    report_flagged:    "text-yellow-400 bg-yellow-500/10",
    user_banned:       "text-red-400 bg-red-500/10",
    user_role_changed: "text-blue-400 bg-blue-500/10",
    user_warned:       "text-yellow-400 bg-yellow-500/10",
    bulk_action:       "text-purple-400 bg-purple-500/10",
    settings_updated:  "text-blue-400 bg-blue-500/10",
    threat_intel_synced:"text-green-400 bg-green-500/10",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-white/40">
        <BookOpen className="w-4 h-4" />
        <span>{logs.length} actions logged — all admin activity tracked</span>
      </div>

      {logs.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <BookOpen className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No audit logs yet. Actions will appear here.</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-xs font-bold uppercase tracking-wider text-white/30">
                <th className="px-5 py-3 text-left">Action</th>
                <th className="px-5 py-3 text-left">Details</th>
                <th className="px-5 py-3 text-left">Admin</th>
                <th className="px-5 py-3 text-left">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-lg", actionColor[log.action] || "text-white/40 bg-white/5")}>
                      {log.action?.replace(/_/g, " ").toUpperCase() || "ACTION"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-white/50 max-w-xs truncate">{log.details}</td>
                  <td className="px-5 py-3 text-xs text-white/40 font-mono truncate max-w-[160px]">{log.adminEmail}</td>
                  <td className="px-5 py-3 text-xs text-white/30">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : "Just now"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  9. NOTIFICATIONS TAB
// ═══════════════════════════════════════════════════════════════
function NotificationsTab({ reports }: { reports: any[] }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const alerts = [
    ...reports.filter(r => r.riskScore > 80).map(r => ({
      type: "danger",
      title: "🚨 Critical Risk Report",
      body: `"${r.title || r.content?.substring(0, 60)}" scored ${r.riskScore}% risk.`,
      time: r.timestamp?.toDate?.()?.toLocaleString() || "Recent",
    })),
    ...reports.filter(r => r.status === "Pending").slice(0, 3).map(r => ({
      type: "warning",
      title: "⏳ Pending Verification",
      body: `Report "${r.title || "Untitled"}" awaiting admin review.`,
      time: r.timestamp?.toDate?.()?.toLocaleString() || "Recent",
    })),
  ].slice(0, 10);

  async function sendAlert() {
    if (!message.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "platformAlerts"), {
        message, sentBy: auth.currentUser?.email, sentAt: serverTimestamp()
      });
      await logAudit("notification_sent", `Platform alert sent: ${message.substring(0, 60)}`);
      toast.success("Alert sent to all users");
      setMessage("");
    } catch { toast.error("Failed to send alert"); }
    finally { setSending(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <GlassCard className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-blue-400" /> Send Platform Alert
        </h3>
        <textarea value={message} onChange={e => setMessage(e.target.value)}
          placeholder="Type a platform-wide security alert or announcement..."
          className="w-full h-28 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
        />
        <button onClick={sendAlert} disabled={sending || !message.trim()}
          className="mt-3 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          Send to All Users
        </button>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-yellow-400" /> System Alerts ({alerts.length})
        </h3>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">No alerts. System is running normally ✅</p>
          ) : alerts.map((a, i) => (
            <div key={i} className={cn("p-4 rounded-xl border",
              a.type === "danger"
                ? "bg-red-500/5 border-red-500/20"
                : "bg-yellow-500/5 border-yellow-500/20"
            )}>
              <p className="font-semibold text-sm">{a.title}</p>
              <p className="text-xs text-white/40 mt-1">{a.body}</p>
              <p className="text-[10px] text-white/20 mt-2">{a.time}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
