import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ArrowLeft,
  LogIn,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "./ui/GlassCard";
import {
  auth,
  googleProvider,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
} from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

import { useNavigate } from "react-router-dom";

type AuthMode = "login" | "signup";
type RoleTab = "user" | "admin";

// ─── Google Logo SVG ────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ─── Ensure user doc exists in Firestore ────────────────────────
async function ensureUserDoc(u: any, overrideRole?: string) {
  const userRef = doc(db, "users", u.uid);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    const role =
      overrideRole ||
      (u.email === "siddharth@gmail.com" ? "admin" : "user");
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
  }
}

export function AuthPage() {
  const navigate = useNavigate();
  const [roleTab, setRoleTab] = useState<RoleTab>("user");
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ─── Handle redirect result (Google redirect flow) ───────────
  useEffect(() => {
    setGoogleLoading(true);
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await ensureUserDoc(result.user);
          toast.success("Welcome to TrustLink!");
          navigate(result.user.email === "siddharth@gmail.com" ? "/admin" : "/app/home", { replace: true });
        }
      })
      .catch((err) => {
        if (err.code && err.code !== "auth/credential-already-in-use") {
          console.error("Redirect result error:", err);
        }
      })
      .finally(() => setGoogleLoading(false));
  }, [navigate]);

  // ─── Email / Password Login ──────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await ensureUserDoc(result.user);
      toast.success("Welcome back to TrustLink!");
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : err.code === "auth/user-not-found"
          ? "No account found with this email"
          : err.code === "auth/wrong-password"
          ? "Incorrect password"
          : "Login failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Email / Password Sign Up ────────────────────────────────
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Set display name
      await updateProfile(result.user, { displayName: name });
      await ensureUserDoc({ ...result.user, displayName: name });
      toast.success("Account created! Welcome to TrustLink 🎉");
    } catch (err: any) {
      const msg =
        err.code === "auth/email-already-in-use"
          ? "An account already exists with this email"
          : err.code === "auth/weak-password"
          ? "Password is too weak"
          : err.code === "auth/invalid-email"
          ? "Invalid email address"
          : "Sign up failed. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Google Sign In ──────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Try popup first (best UX)
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(result.user);
      toast.success("Welcome to TrustLink!");
      navigate(result.user.email === "siddharth@gmail.com" ? "/admin" : "/app/home", { replace: true });
    } catch (err: any) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-cancelled") {
        // Popup blocked by browser — fall back to redirect
        toast("Opening Google sign-in...", { icon: "🔄" });
        await signInWithRedirect(auth, googleProvider);
        // Page will reload; result handled in useEffect above
      } else if (err.code === "auth/operation-not-allowed") {
        toast.error("Google sign-in is not enabled. Please contact the admin.");
      } else if (err.code !== "auth/popup-closed-by-user") {
        toast.error(`Google sign-in failed: ${err.message}`);
        console.error("Google auth error:", err.code, err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Admin Email Login ───────────────────────────────────────
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Verify admin role in Firestore
      const userRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userRef);
      const role = userDoc.exists() ? userDoc.data().role : null;
      const isAdminEmail =
        result.user.email === "siddharth@gmail.com";

      if (role === "admin" || isAdminEmail) {
        await ensureUserDoc(result.user, "admin");
        toast.success("Admin access granted ✅");
      } else {
        await auth.signOut();
        toast.error("This account does not have admin privileges");
      }
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found"
          ? "Invalid admin credentials"
          : err.code === "auth/wrong-password"
          ? "Incorrect password"
          : "Admin login failed";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm";

  const labelClass = "text-xs font-semibold uppercase tracking-wider text-white/40 mb-1.5 block";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="glass-bg">
        <div className="glass-blob bg-blue-600 top-[-10%] left-[-10%]" />
        <div className="glass-blob bg-purple-600 bottom-[-10%] right-[-10%]" />
        <div className="glass-blob bg-indigo-500 top-[40%] left-[30%] w-[300px] h-[300px]" />
      </div>

      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40 mx-auto mb-4">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">TrustLink</h1>
          <p className="text-white/40 mt-1 text-sm">Verify Before You Trust</p>
        </div>

        {/* Role Tab Toggle */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 mb-6">
          <button
            onClick={() => { setRoleTab("user"); setAuthMode("login"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              roleTab === "user"
                ? "bg-white text-black shadow-lg"
                : "text-white/40 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            User
          </button>
          <button
            onClick={() => { setRoleTab("admin"); setAuthMode("login"); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
              roleTab === "admin"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-white/40 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin
          </button>
        </div>

        <GlassCard gradient className="p-6">
          <AnimatePresence mode="wait">
            {/* ── USER PANEL ── */}
            {roleTab === "user" && (
              <motion.div
                key={`user-${authMode}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="text-center mb-1">
                  <h2 className="text-lg font-bold">
                    {authMode === "login" ? "Welcome Back" : "Create Account"}
                  </h2>
                  <p className="text-xs text-white/40 mt-1">
                    {authMode === "login"
                      ? "Sign in to your TrustLink account"
                      : "Join the community fighting scams"}
                  </p>
                </div>

                {/* Google Sign In */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-3 bg-white text-gray-800 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs text-white/25 bg-[#0f172a]">
                      or continue with email
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={authMode === "login" ? handleEmailLogin : handleEmailSignup}
                  className="space-y-3.5"
                >
                  {/* Name (signup only) */}
                  {authMode === "signup" && (
                    <div>
                      <label className={labelClass}>Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputClass} pr-12`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password (signup only) */}
                  {authMode === "signup" && (
                    <div>
                      <label className={labelClass}>Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={inputClass}
                          required
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/30 disabled:opacity-50 mt-1"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : authMode === "login" ? (
                      <>
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create Account
                      </>
                    )}
                  </button>
                </form>

                {/* Toggle login / signup */}
                <p className="text-center text-xs text-white/30">
                  {authMode === "login" ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        onClick={() => { setAuthMode("signup"); setEmail(""); setPassword(""); setName(""); setConfirmPassword(""); }}
                        className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        onClick={() => { setAuthMode("login"); setEmail(""); setPassword(""); setName(""); setConfirmPassword(""); }}
                        className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            )}

            {/* ── ADMIN PANEL ── */}
            {roleTab === "admin" && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-5">
                  <h2 className="text-lg font-bold">Admin Portal</h2>
                  <p className="text-xs text-white/40 mt-1">Authorized personnel only</p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className={labelClass}>Admin Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@trustlink.com"
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={`${inputClass} pr-12`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-900/30 disabled:opacity-50 mt-2"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Admin Sign In
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-xs text-white/20 mt-4">
                  Admin accounts must be pre-configured in Firebase
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
}
