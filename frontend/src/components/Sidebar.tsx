"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sidebarHover, interactionEase, tapPress } from "@/lib/interactions";
import { useInteractionMotion } from "@/components/interactions";

// Custom SVG Icons matching real Duolingo styling
const LearnIcon = ({ active }: { active: boolean }) => (
  <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 3L2 11H5V20H19V11H22L12 3Z"
      fill={active ? "#FF4B4B" : "none"}
      stroke={active ? "#FF4B4B" : "#AFBFC6"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 4.5L5 10.2V19.5H19.5V10.2L12 4.5Z"
      fill={active ? "#58CC02" : "none"}
      stroke={active ? "#58CC02" : "#AFBFC6"}
      strokeWidth="2"
    />
    <path
      d="M9 13.5H15V19.5H9V13.5Z"
      fill={active ? "#FFC800" : "none"}
      stroke={active ? "#FFC800" : "#AFBFC6"}
      strokeWidth="2"
    />
  </svg>
);

const SoundsIcon = ({ active }: { active: boolean }) => (
  <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 12C3 9 7.5 5 12 5C16.5 5 21 9 21 12C21 15 16.5 19 12 19C7.5 19 3 15 3 12Z"
      fill={active ? "#FF4B4B" : "none"}
      stroke={active ? "#EA2B2B" : "#AFBFC6"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 11.5C7 11.5 9 14.5 12 14.5C15 14.5 17 11.5 17 11.5"
      stroke={active ? "#FFFFFF" : "#AFBFC6"}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const LeaderboardsIcon = ({ active }: { active: boolean }) => (
  <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 2C6.5 2 2 6.5 2 12C2 16.5 6.5 22 12 22C17.5 22 22 16.5 22 12C22 6.5 17.5 2 12 2Z"
      fill={active ? "#FFC800" : "none"}
      stroke={active ? "#E5A000" : "#AFBFC6"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 17V10H10V17H8ZM11 17V7H13V17H11ZM14 17V12H16V17H14Z"
      fill={active ? "#FFFFFF" : "#AFBFC6"}
    />
  </svg>
);

const QuestsIcon = ({ active }: { active: boolean }) => (
  <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 8H20V20C20 20.55 19.55 21 19 21H5C4.45 21 4 20.55 4 20V8Z"
      fill={active ? "#FF9600" : "none"}
      stroke={active ? "#E57B00" : "#AFBFC6"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 5C2 4.45 2.45 4 3 4H21C21.55 4 22 4.45 22 5V8H2V5Z"
      fill={active ? "#FF9600" : "none"}
      stroke={active ? "#E57B00" : "#AFBFC6"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect
      x="10"
      y="8"
      width="4"
      height="5"
      rx="1"
      fill={active ? "#FFD700" : "none"}
      stroke={active ? "#E5A000" : "#AFBFC6"}
      strokeWidth="2"
    />
  </svg>
);

const ShopIcon = ({ active }: { active: boolean }) => (
  <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 9H21V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V9Z"
      fill={active ? "#1CD0CD" : "none"}
      stroke={active ? "#18A6A6" : "#AFBFC6"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 2L3 9H21L12 2Z"
      fill={active ? "#FF4B4B" : "none"}
      stroke={active ? "#EA2B2B" : "#AFBFC6"}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProfileIcon = ({ active }: { active: boolean }) => (
  <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle
      cx="12"
      cy="7"
      r="4"
      fill={active ? "#FFC800" : "none"}
      stroke={active ? "#E5A000" : "#AFBFC6"}
      strokeWidth="2.5"
    />
    <path
      d="M4 21C4 17.13 8.13 14 12 14C15.87 14 20 17.13 20 21"
      fill={active ? "#FF5858" : "none"}
      stroke={active ? "#E54848" : "#AFBFC6"}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const MoreIcon = ({ active }: { active: boolean }) => (
  <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle
      cx="12"
      cy="12"
      r="10"
      fill={active ? "#A55EEA" : "none"}
      stroke={active ? "#8854D0" : "#AFBFC6"}
      strokeWidth="2.5"
    />
    <circle cx="7" cy="12" r="1.5" fill={active ? "#FFFFFF" : "#AFBFC6"} />
    <circle cx="12" cy="12" r="1.5" fill={active ? "#FFFFFF" : "#AFBFC6"} />
    <circle cx="17" cy="12" r="1.5" fill={active ? "#FFFFFF" : "#AFBFC6"} />
  </svg>
);

interface SidebarItemProps {
  href: string;
  label: string;
  iconName: string;
  active: boolean;
  hasNotification?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  href,
  label,
  iconName,
  active,
  hasNotification = false,
  onClick,
}) => {
  const { enabled } = useInteractionMotion();

  // Render corresponding icon dynamically
  const renderIcon = () => {
    switch (iconName) {
      case "learn":
        return <LearnIcon active={active} />;
      case "sounds":
        return <SoundsIcon active={active} />;
      case "leaderboards":
        return <LeaderboardsIcon active={active} />;
      case "quests":
        return <QuestsIcon active={active} />;
      case "shop":
        return <ShopIcon active={active} />;
      case "profile":
        return <ProfileIcon active={active} />;
      default:
        return null;
    }
  };

  const itemClass = `flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl font-extrabold uppercase tracking-[0.08em] border-2 text-[13px] leading-none transition-[background-color,border-color,box-shadow] duration-[170ms] ${
    active
      ? "bg-[#183949] border-[#84D8FF] text-[#84D8FF] shadow-[inset_0_0_0_1px_rgba(132,216,255,0.15),0_0_16px_rgba(132,216,255,0.12)] scale-[1.02]"
      : "bg-transparent border-transparent text-[#AFBFC6] hover:bg-[#202F36] hover:text-[#D1DEE4] hover:shadow-[0_4px_14px_rgba(0,0,0,0.18)]"
  }`;

  const inner = (
    <>
      <motion.div
        className="w-9 h-9 flex items-center justify-center shrink-0 relative"
        whileHover={enabled ? { scale: 1.08, y: -1 } : undefined}
        transition={interactionEase}
      >
        {renderIcon()}
        {hasNotification && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-red border-2 border-[#131F24] rounded-full" />
        )}
      </motion.div>
      <span className={`pt-0.5 transition-colors duration-[170ms] ${active ? "" : "group-hover:text-[#D1DEE4]"}`}>
        {label}
      </span>
    </>
  );

  return (
    <Link href={href} onClick={onClick} className="block select-none group">
      {enabled ? (
        <motion.div
          whileHover={sidebarHover}
          whileTap={tapPress}
          transition={interactionEase}
          className={itemClass}
        >
          {inner}
        </motion.div>
      ) : (
        <div className={itemClass}>{inner}</div>
      )}
    </Link>
  );
};

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/", label: "Learn", iconName: "learn" },
    { href: "/sounds", label: "Sounds", iconName: "sounds" },
    { href: "/leaderboard", label: "Leaderboards", iconName: "leaderboards" },
    { href: "/quests", label: "Quests", iconName: "quests" },
    { href: "/shop", label: "Shop", iconName: "shop" },
    { href: "/profile", label: "Profile", iconName: "profile", hasNotification: true },
  ];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setMoreDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-[#131F24] p-3 text-left">
      {/* Branding Header with exact user logo.svg */}
      <div className="px-3 py-5 mb-2 select-none">
        <img src="/logo/logo.svg" alt="Duolingo" className="h-[38px] w-auto" />
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <SidebarItem
              key={item.href}
              href={item.href}
              label={item.label}
              iconName={item.iconName}
              active={isActive}
              hasNotification={item.hasNotification}
              onClick={() => isMobile && setMobileOpen(false)}
            />
          );
        })}
      </nav>

      {/* 'More' Button at bottom with simple dropdown */}
      <div className="relative pt-3 mt-1 border-t border-light-border" ref={dropdownRef}>
        <motion.button
          onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
          whileHover={{ scale: 1.02, x: 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl font-extrabold uppercase tracking-[0.08em] border-2 text-[13px] leading-none select-none cursor-pointer ${
            moreDropdownOpen
              ? "bg-[#183949] border-[#84D8FF] text-[#84D8FF]"
              : "bg-transparent border-transparent text-[#AFBFC6] hover:bg-[#202F36] hover:text-[#D1DEE4]"
          }`}
        >
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            <MoreIcon active={moreDropdownOpen} />
          </div>
          <span className="pt-0.5">More</span>
        </motion.button>

        {/* Dropdown Options */}
        <AnimatePresence>
          {moreDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 left-0 right-0 bg-[#1F2E35] border-2 border-light-border rounded-2xl p-2 shadow-xl z-50 flex flex-col gap-1"
            >
              <Link
                href="/settings"
                onClick={() => {
                  setMoreDropdownOpen(false);
                  if (isMobile) setMobileOpen(false);
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-[#AFBFC6] hover:bg-[#2A3B43] transition text-sm flex items-center gap-2"
              >
                ⚙️ Settings
              </Link>
              <div className="px-4 py-2.5 rounded-xl font-bold text-[#AFBFC6]/60 text-xs border-t border-light-border pt-2">
                v1.2.0 (Stable)
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex flex-col w-[256px] h-full fixed left-0 top-0 border-r border-light-border bg-[#131F24] z-40">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-[50px] bg-[#131F24] border-b border-light-border flex items-center px-4 justify-between lg:hidden z-50">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-[#AFBFC6] hover:opacity-90 active:scale-95 transition-transform"
        >
          <Menu className="w-7 h-7" />
        </button>
        <img src="/logo/logo.svg" alt="Duolingo" className="h-6 w-auto" />
        <div className="w-7 h-7" />
      </div>

      {/* Mobile sliding drawer drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[256px] bg-[#131F24] border-r border-light-border z-50 lg:hidden shadow-xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 active:scale-95 transition-transform"
              >
                <X className="w-6 h-6" />
              </button>
              <SidebarContent isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
