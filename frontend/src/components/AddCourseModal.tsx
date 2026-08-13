"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useCourseStore } from "@/store/useCourseStore";
import { ONBOARDING_LANGUAGES } from "@/lib/onboarding";
import { getLanguageName } from "@/lib/languageRegistry";
import LanguageFlag from "./LanguageFlag";
import DuoButton from "./DuoButton";

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnrolled?: (firstLessonId: string | null) => void;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({ isOpen, onClose, onEnrolled }) => {
  const { availableCourses, loadAvailableCourses, enrollCourse, loading } = useCourseStore();

  useEffect(() => {
    if (isOpen) {
      loadAvailableCourses();
    }
  }, [isOpen, loadAvailableCourses]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen, onClose]);

  const handleSelect = async (courseId: string) => {
    const result = await enrollCourse(courseId, { redirectToFirstLesson: true });
    onClose();
    onEnrolled?.(result.firstLessonId);
  };

  const getDisplay = (courseId: string, targetLang: string) => {
    const lang = ONBOARDING_LANGUAGES.find((l) => l.courseId === courseId || l.id === targetLang);
    return {
      name: lang?.name ?? getLanguageName(targetLang),
      code: targetLang,
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-[20px] border-2 border-[#37464F] bg-[#1A2830] shadow-[0_24px_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#37464F]">
              <div>
                <h2 className="text-xl font-extrabold text-slate-100 font-nunito">Add a course</h2>
                <p className="text-sm text-[#8E9FA8] font-semibold mt-0.5">Pick a language to start learning</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[#AAB7C2] hover:bg-[#243840] transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {availableCourses.length === 0 && !loading && (
                <p className="col-span-2 text-center text-[#8E9FA8] font-semibold py-8">
                  You&apos;re enrolled in all available courses!
                </p>
              )}
              {availableCourses.map((course) => {
                const display = getDisplay(course.id, course.target_language);
                return (
                  <motion.button
                    key={course.id}
                    type="button"
                    disabled={loading}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(course.id)}
                    className="flex flex-col items-center gap-2 p-5 rounded-[18px] border-2 border-[#37464F] bg-[#202F36] hover:border-sky-500/50 hover:bg-[#243840] transition-colors text-center"
                  >
                    <LanguageFlag code={display.code} size="xl" />
                    <span className="font-extrabold text-slate-100 text-sm">{display.name}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="px-6 py-4 border-t border-[#37464F]">
              <DuoButton variant="secondary" className="w-full" onClick={onClose}>
                Cancel
              </DuoButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddCourseModal;
