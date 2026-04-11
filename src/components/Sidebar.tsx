import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home, MessageSquare, Users, LayoutDashboard, Shield, LogOut, ChevronRight
} from "lucide-react";
import { cn } from "../lib/utils";

interface SidebarProps {
  onLogout: () => void;
  isAdmin?: boolean;
}

const MENU = [
  { id: "home",      path: "/app/home",      label: "Home",      icon: Home },
  { id: "responses", path: "/app/responses", label: "Responses", icon: MessageSquare },
  { id: "community", path: "/app/community", label: "Community", icon: Users },
  { id: "dashboard", path: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function Sidebar({ onLogout, isAdmin }: SidebarProps) {
  const location = useLocation();

  return (
    <div className="w-60 h-screen sticky top-0 bg-white/[0.03] border-r border-white/10 flex flex-col p-5 z-20 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight">TrustLink</h1>
          <p className="text-[9px] text-blue-400/70 font-semibold uppercase tracking-widest">Verify Before You Trust</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {MENU.map(({ id, path, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <Link
              key={id}
              to={path}
              className={cn(
                "w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all group",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn("w-4.5 h-4.5", isActive ? "text-white" : "text-white/40 group-hover:text-white")} />
                <span className="font-medium text-sm">{label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5" />}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-white/5">
            <p className="px-3.5 mb-2 text-[10px] font-black uppercase tracking-widest text-white/20">Admin Tools</p>
            <Link
              to="/admin"
              className={cn(
                "w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all group",
                location.pathname.startsWith("/admin")
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                  : "text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
              )}
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4.5 h-4.5" />
                <span className="font-bold text-sm">Admin Portal</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </nav>

      <div className="pt-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
