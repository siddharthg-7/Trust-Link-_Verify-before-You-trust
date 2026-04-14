import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiHome as FiHomeRaw, FiLogOut as FiLogOutRaw, FiChevronRight as FiChevronRightRaw } from "react-icons/fi";
import { HiOutlineChatAlt2 as HiOutlineChatAlt2Raw } from "react-icons/hi";
import { RiTeamLine as RiTeamLineRaw } from "react-icons/ri";
import { BiGridAlt as BiGridAltRaw } from "react-icons/bi";
import { MdOutlineAdminPanelSettings as MdOutlineAdminPanelSettingsRaw } from "react-icons/md";
import { BsShieldLock as BsShieldLockRaw } from "react-icons/bs";
import { IconType } from "react-icons";
import { cn } from "../lib/utils";

// ── Icons as any ──
const FiHome = FiHomeRaw as any;
const FiLogOut = FiLogOutRaw as any;
const FiChevronRight = FiChevronRightRaw as any;
const HiOutlineChatAlt2 = HiOutlineChatAlt2Raw as any;
const RiTeamLine = RiTeamLineRaw as any;
const BiGridAlt = BiGridAltRaw as any;
const MdOutlineAdminPanelSettings = MdOutlineAdminPanelSettingsRaw as any;
const BsShieldLock = BsShieldLockRaw as any;

interface SidebarProps {
  onLogout: () => void;
  isAdmin?: boolean;
}

interface MenuItem {
  id: string;
  path: string;
  label: string;
  icon: any;
}

const MENU: MenuItem[] = [
  { id: "home",      path: "/app/home",      label: "Home",      icon: FiHome },
  { id: "responses", path: "/app/responses", label: "Responses", icon: HiOutlineChatAlt2 },
  { id: "community", path: "/app/community", label: "Community", icon: RiTeamLine },
  { id: "dashboard", path: "/app/dashboard", label: "Dashboard", icon: BiGridAlt },
];

export function Sidebar({ onLogout, isAdmin }: SidebarProps) {
  const location = useLocation();

  return (
    <div className="w-64 h-screen sticky top-0 bg-black border-r border-zinc-900 flex flex-col p-6 z-20 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12 px-2">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
          <BsShieldLock size={20} className="text-black" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tighter text-white">TrustLink</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Safety First</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5">
        <div className="mb-4 px-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600 mb-4">Main Menu</p>
          <div className="space-y-1">
            {MENU.map(({ id, path, label, icon: Icon }) => {
              const isActive = location.pathname.startsWith(path);
              return (
                <Link
                  key={id}
                  to={path}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200 group",
                    isActive
                      ? "bg-zinc-900 text-white border border-zinc-800"
                      : "text-zinc-500 hover:text-white hover:bg-zinc-900/50"
                  )}
                >
                  <Icon className={cn("w-4.5 h-4.5 transition-colors", isActive ? "text-cyan-500" : "group-hover:text-zinc-300")} />
                  <span className="font-semibold text-sm">{label}</span>
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <div className="pt-6 mt-6 border-t border-zinc-900 px-3">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">Admin</p>
            <Link
              to="/admin"
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 rounded-full transition-all duration-200 group",
                location.pathname.startsWith("/admin")
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "text-zinc-500 hover:text-red-400 hover:bg-red-500/5"
              )}
            >
              <MdOutlineAdminPanelSettings className="w-4.5 h-4.5" />
              <span className="font-semibold text-sm">Portal</span>
            </Link>
          </div>
        )}
      </nav>

      <div className="pt-6 border-t border-zinc-900 px-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-zinc-500 hover:text-white hover:bg-zinc-900/50 transition-all font-semibold"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="text-sm">Log out</span>
        </button>
      </div>
    </div>
  );
}


