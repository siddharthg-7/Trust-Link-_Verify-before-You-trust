import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiHome as FiHomeRaw, FiLogOut as FiLogOutRaw, FiX as FiXRaw } from "react-icons/fi";
import { HiOutlineChatAlt2 as HiOutlineChatAlt2Raw } from "react-icons/hi";
import { RiTeamLine as RiTeamLineRaw } from "react-icons/ri";
import { BiGridAlt as BiGridAltRaw } from "react-icons/bi";
import { MdOutlineAdminPanelSettings as MdOutlineAdminPanelSettingsRaw } from "react-icons/md";
import { BsShieldLock as BsShieldLockRaw } from "react-icons/bs";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// ── Icons cast to any for React 19 compatibility if needed ──
const FiHome = FiHomeRaw as any;
const FiLogOut = FiLogOutRaw as any;
const FiX = FiXRaw as any;
const HiOutlineChatAlt2 = HiOutlineChatAlt2Raw as any;
const RiTeamLine = RiTeamLineRaw as any;
const BiGridAlt = BiGridAltRaw as any;
const MdOutlineAdminPanelSettings = MdOutlineAdminPanelSettingsRaw as any;
const BsShieldLock = BsShieldLockRaw as any;

interface SidebarProps {
  onLogout: () => void;
  isAdmin?: boolean;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

interface MenuItem {
  id: string;
  path: string;
  label: string;
  icon: any;
}

const MENU: MenuItem[] = [
  { id: "home", path: "/app/home", label: "Home", icon: FiHome },
  { id: "responses", path: "/app/responses", label: "Responses", icon: HiOutlineChatAlt2 },
  { id: "community", path: "/app/community", label: "Community", icon: RiTeamLine },
  { id: "dashboard", path: "/app/dashboard", label: "Dashboard", icon: BiGridAlt },
];

export function Sidebar({ onLogout, isAdmin, isOpen, setIsOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const SidebarContent = (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Logo Section */}
      <div className="p-8 pb-4">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate("/app/home")}
        >
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <BsShieldLock size={16} className="text-black" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tighter text-white leading-none">TrustLink</span>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-[0.2em] mt-1.5 opacity-70">Safety First</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <div className="mb-4 px-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-4 opacity-50">Menu</p>
        </div>
        
        {MENU.map(({ id, path, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          return (
            <Link
              key={id}
              to={path}
              onClick={() => setIsOpen?.(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 group",
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              )}
            >
              <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-white" : "group-hover:text-white")} />
              <span className="font-medium text-sm tracking-tight">{label}</span>
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="ml-auto w-1 h-4 bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-6 mt-6 border-t border-zinc-900">
            <div className="mb-4 px-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 opacity-50">
              Admin
            </div>
            <Link
              to="/admin"
              onClick={() => setIsOpen?.(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 group",
                location.pathname.startsWith("/admin")
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
              )}
            >
              <MdOutlineAdminPanelSettings className="w-4 h-4" />
              <span className="font-medium text-sm tracking-tight">Portal</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-zinc-900">
        <button
          onClick={() => {
            onLogout();
            setIsOpen?.(false);
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all duration-300 group"
        >
          <FiLogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 h-screen sticky top-0 bg-black border-r border-zinc-900 flex-col z-20 shrink-0">
        {SidebarContent}
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen?.(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-black border-r border-zinc-900 z-50 lg:hidden"
            >
              {SidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}



