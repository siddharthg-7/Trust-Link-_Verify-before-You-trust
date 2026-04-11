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
    <div className="w-60 h-screen sticky top-0 bg-white/[0.03] border-r border-white/10 flex flex-col p-5 z-20 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
          <BsShieldLock size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-black tracking-tight text-white">TrustLink</h1>
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
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-white/40 group-hover:text-white")} />
                <span className="font-medium text-sm">{label}</span>
              </div>
              {isActive && <FiChevronRight className="w-3.5 h-3.5" />}
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
                <MdOutlineAdminPanelSettings className="w-5 h-5" />
                <span className="font-bold text-sm">Admin Portal</span>
              </div>
              <FiChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </nav>

      <div className="pt-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all font-semibold"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}

