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

// ─── Admin email — must match Firebase Auth account ──────────
const ADMIN_EMAIL = "siddharth@gmail.com";

export default function App() {
  const [user, setUser]             = useState<any>(null);
  const [isAdmin, setIsAdmin]       = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
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
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-white/30 text-sm">Loading TrustLink...</p>
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
            <div className="flex min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
              <Sidebar onLogout={handleLogout} isAdmin={isAdmin} />
              <main className="flex-1 p-0 overflow-y-auto">
                <div className="max-w-7xl mx-auto min-h-screen">
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

              {/* Background blobs */}
              <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/8 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/8 blur-[120px] rounded-full" />
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
