"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Course } from "@/lib/types";
import { X, Globe2 } from "lucide-react";
import LanguageFlag from "./LanguageFlag";

interface LanguageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDismissible: boolean;
  onCourseSelected: (courseId: string) => void;
}

export const LanguageSelectModal: React.FC<LanguageSelectModalProps> = ({
  isOpen,
  onClose,
  isDismissible,
  onCourseSelected,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectError, setSelectError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setSelectError(null);
    api.getCourses()
      .then((data) => {
        setCourses(data);
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDismissible) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDismissible, onClose]);

  if (!isOpen) return null;

  const handleSelect = async (courseId: string) => {
    setSubmitting(courseId);
    setSelectError(null);
    try {
      const result = await api.selectCourse(courseId);
      if (!result.success) {
        throw new Error("Course selection was not saved. Please try again.");
      }
      onCourseSelected(courseId);
      onClose();
    } catch (err) {
      console.error("Failed to select course:", err);
      const message =
        err instanceof Error ? err.message : "Failed to select course. Please try again.";
      setSelectError(message);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-nunito animate-fade-in"
      onClick={isDismissible ? onClose : undefined}
    >
      <div
        className="bg-[#1F2E35] border-2 border-[#37464F] rounded-3xl w-full max-w-lg p-6 relative flex flex-col shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {isDismissible && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-[#2A3B43] text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-12 h-12 bg-sky-500/10 text-[#1CB0F6] rounded-2xl flex items-center justify-center mb-3">
            <Globe2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 leading-snug">
            Choose a Language Course
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-1 max-w-xs leading-relaxed">
            Select a course to start learning or switch between your languages!
          </p>
          {selectError && (
            <p className="text-xs font-bold text-rose-400 mt-2 max-w-xs leading-relaxed">
              {selectError}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1CB0F6]"></div>
            <p className="text-xs text-slate-400 font-bold mt-3">Loading available courses...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
            {courses.map((course) => {
              const isPending = submitting === course.id;
              const code = course.target_language ?? course.language_code;
              return (
                <button
                  key={course.id}
                  disabled={submitting !== null}
                  onClick={() => handleSelect(course.id)}
                  className="border-2 border-[#37464F] bg-[#131F24] hover:bg-[#1A272D] disabled:opacity-50 p-4 rounded-2xl flex flex-col items-center text-center gap-3 transition-all duration-150 relative cursor-pointer active:scale-95 group shadow-sm"
                >
                  <LanguageFlag code={code} size="lg" />
                  <span className="font-extrabold text-slate-200 text-sm">
                    {course.title}
                  </span>
                  {isPending && (
                    <div className="absolute inset-0 bg-[#1F2E35]/80 rounded-2xl flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#1CB0F6]"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSelectModal;
