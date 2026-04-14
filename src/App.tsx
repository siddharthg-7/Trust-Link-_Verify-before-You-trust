import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { auth, db, signOut, handleFirestoreError, OperationType } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Toaster } from "react-hot-toast";
import { LandingPage } from "./components/LandingPage";
import { AuthPage } from "./components/AuthPage";
import { Sidebar } from "./components/Sidebar";
import { StudentDashboard } from "./components/StudentDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { CommunityPage } from "./components/CommunityPage";
import { ResponsesPage } from "./components/ResponsesPage";
import { UserDashboard } from "./components/UserDashboard";
import { FiMenu as FiMenuRaw } from "react-icons/fi";
import { BsShieldLock as BsShieldLockRaw } from "react-icons/bs";

const FiMenu = FiMenuRaw as any;
const BsShieldLock = BsShieldLockRaw as any;

// ─── Admin email — must match Firebase Auth account ──────────
const ADMIN_EMAIL = "siddharth@gmail.com";

export default function App() {
  const [user, setUser]             = useState<any>(null);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          const userRef = doc(db, "users", u.uid);
          const userDoc = await getDoc(userRef);
          const adminByEmail = u.email === ADMIN_EMAIL;
          
          let role = "user";
          if (userDoc.exists()) {
            role = userDoc.data().role;
            setIsAdmin(role === "admin" || adminByEmail);
          } else {
            // Auto-create user document
            role = adminByEmail ? "admin" : "user";
            await setDoc(userRef, {
              uid: u.uid,
              email: u.email,
              username: u.displayName || u.email?.split("@")[0],
              role,
              reportsCount: 0,
              votesCount: 0,
              commentsCount: 0,
              trustScore: 50,
              createdAt: serverTimestamp(),
            });
            setIsAdmin(role === "admin");
          }

          // Initial redirect when auth is ready
          if (role === "admin" || adminByEmail) {
            if (!location.pathname.startsWith("/admin")) {
              navigate("/admin", { replace: true });
            }
          } else {
            if (location.pathname === "/" || location.pathname === "/auth") {
              navigate("/app/home", { replace: true });
            }
          }
        } catch (error: any) {
          console.error("Auth init error:", error);
          if (error.code === 'permission-denied') {
            setUser(null);
            setIsAdmin(false);
          }
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        // User logged out, redirect to /
        if (location.pathname !== "/" && location.pathname !== "/auth") {
          navigate("/", { replace: true });
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [navigate, location.pathname, isAuthReady]);

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdmin(false);
    navigate("/", { replace: true });
  };

  // Loading spinner
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-medium">Loading TrustLink...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: "#0f172a", color: "#fff", border: "1px solid #ffffff15" } }} />
      <Routes>
        {/* Public Routes */}
        {!user ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          /* Authenticated Routes (Common Layout) */
          <Route path="/*" element={
            <div className="flex min-h-screen bg-black text-zinc-100 selection:bg-cyan-500/30">
              <Sidebar 
                onLogout={handleLogout} 
                isAdmin={isAdmin} 
                isOpen={isSidebarOpen} 
                setIsOpen={setIsSidebarOpen} 
              />
              
              <div className="flex-1 flex flex-col min-h-screen relative">
                {/* Mobile Top Bar */}
                <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-md border-b border-zinc-900">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <BsShieldLock size={16} className="text-black" />
                    </div>
                    <span className="font-bold tracking-tighter text-white">TrustLink</span>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <FiMenu size={24} />
                  </button>
                </header>

                <main className="flex-1 p-0 overflow-y-auto w-full">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-0">
                    <Routes>
                      <Route path="/app/home" element={<StudentDashboard />} />
                      <Route path="/app/responses" element={<ResponsesPage />} />
                      <Route path="/app/community" element={<CommunityPage />} />
                      <Route path="/app/dashboard" element={<UserDashboard />} />
                      {isAdmin && (
                        <Route path="/admin/*" element={<AdminDashboard user={user} onLogout={handleLogout} />} />
                      )}
                      <Route path="/" element={<Navigate to={isAdmin ? "/admin" : "/app/home"} replace />} />
                      <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/app/home"} replace />} />
                    </Routes>
                  </div>
                </main>
              </div>

              {/* Background blobs */}
              <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
              </div>
            </div>
          } />
        )}
        
        {/* Fallback route if authenticated user tries to access / */}
        {user && !isAdmin && <Route path="/" element={<Navigate to="/app/home" replace />} />}
        {user && !isAdmin && <Route path="*" element={<Navigate to="/app/home" replace />} />}
      </Routes>
    </>
  );
}
