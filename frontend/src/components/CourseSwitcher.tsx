"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useSafeRouter } from "@/hooks/useSafeRouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, Check } from "lucide-react";
import { UserCourse } from "@/lib/types";
import { useCourseStore } from "@/store/useCourseStore";
import LanguageFlag from "./LanguageFlag";

interface CourseSwitcherProps {
  onAddCourse: () => void;
  compact?: boolean;
}

export const CourseSwitcher: React.FC<CourseSwitcherProps> = ({ onAddCourse, compact = false }) => {
  const router = useSafeRouter();
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { enrolledCourses, activeCourse, switching, switchCourse } = useCourseStore();

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (open) {
      document.addEventListener("mousedown", onClickOutside);
      document.addEventListener("keydown", onEscape);
    }
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open, close]);

  const handleSwitch = async (course: UserCourse) => {
    if (course.is_active || switching) return;
    close();
    await switchCourse(course.course_id);
    if (router.isReady) router.push("/");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    const total = enrolledCourses.length + 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => (i + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => (i <= 0 ? total - 1 : i - 1));
    } else if (e.key === "Enter" && focusedIndex >= 0) {
      e.preventDefault();
      if (focusedIndex < enrolledCourses.length) {
        handleSwitch(enrolledCourses[focusedIndex]);
      } else {
        close();
        onAddCourse();
      }
    }
  };

  const label = activeCourse?.language_name ?? "Select course";

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={switching}
        className={`flex items-center gap-2 rounded-[18px] border-2 border-[#37464F] bg-[#1F2E35] hover:bg-[#243840] shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition-colors cursor-pointer ${
          compact ? "px-2.5 py-1.5 min-h-[40px]" : "px-3 py-2 min-h-[44px]"
        } ${switching ? "opacity-60" : ""}`}
      >
        {activeCourse && (
          <LanguageFlag code={activeCourse.language_code} size={compact ? "sm" : "md"} />
        )}
        {!compact && (
          <span className="font-extrabold text-slate-100 text-sm max-w-[120px] truncate">{label}</span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-[#AAB7C2] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 z-50 w-[min(320px,calc(100vw-2rem))] rounded-[20px] border-2 border-[#37464F] bg-[#1A2830] shadow-[0_16px_40px_rgba(0,0,0,0.45)] overflow-hidden"
            role="listbox"
          >
            <div className="px-4 py-3 border-b border-[#37464F]">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8E9FA8]">My Courses</p>
            </div>

            <div className="max-h-[360px] overflow-y-auto py-1">
              {enrolledCourses.map((course, idx) => (
                <motion.button
                  key={course.id}
                  type="button"
                  role="option"
                  aria-selected={course.is_active}
                  onClick={() => handleSwitch(course)}
                  whileHover={{ scale: 1.01, backgroundColor: "#243840" }}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                    course.is_active ? "bg-[#1a3d24]/40" : ""
                  } ${focusedIndex === idx ? "bg-[#243840]" : ""}`}
                >
                  <LanguageFlag code={course.language_code} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-100 text-sm truncate">
                        {course.language_name}
                      </span>
                      {course.is_active && (
                        <Check className="w-4 h-4 text-brand-green shrink-0" aria-label="Active course" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#8E9FA8] font-semibold mt-0.5 truncate">
                      {course.current_unit} • {course.current_lesson}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-[#8E9FA8]">
                      <span>⚡ {course.xp} XP</span>
                      <span>🔥 {course.streak}</span>
                      <span>{course.completion_percent}%</span>
                    </div>
                  </div>
                  {course.is_active && (
                    <span className="w-2 h-2 rounded-full bg-brand-green shrink-0 mt-1.5" title="Active" />
                  )}
                </motion.button>
              ))}
            </div>

            <div className="border-t border-[#37464F] p-2">
              <motion.button
                type="button"
                onClick={() => {
                  close();
                  onAddCourse();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl font-extrabold text-sm text-sky-400 hover:bg-[#243840] transition-colors ${
                  focusedIndex === enrolledCourses.length ? "bg-[#243840]" : ""
                }`}
              >
                <Plus className="w-5 h-5" />
                Add New Course
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseSwitcher;
