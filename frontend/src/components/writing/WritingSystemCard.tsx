"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { PenLine, Lock } from "lucide-react";
import { WritingSystemOverview } from "@/lib/types";
import { isValidCourseId } from "@/lib/ids";
import DuoButton from "@/components/DuoButton";

interface WritingSystemCardProps {
  courseId: string;
  languageName: string;
  flagIcon: string;
  overview: WritingSystemOverview | null;
  loading?: boolean;
  unavailable?: boolean;
}

export const WritingSystemCard: React.FC<WritingSystemCardProps> = ({
  courseId,
  languageName,
  flagIcon,
  overview,
  loading,
  unavailable = false,
}) => {
  const primary = overview?.sections[0];
  const learned = overview?.progress?.characters_learned ?? overview?.characters_learned ?? 0;
  const total = overview?.progress?.total_characters ?? overview?.total_characters ?? primary?.total_characters ?? 0;
  const completed = overview?.progress?.primary_completed ?? overview?.primary_completed ?? false;
  const progressPct = total > 0 ? Math.round((learned / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[600px] mb-10 rounded-3xl border-2 border-[#37464F] bg-gradient-to-br from-[#1F2E35] to-[#182228] overflow-hidden shadow-xl"
    >
      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <img src={flagIcon} alt="" className="w-10 h-10 rounded-lg object-cover" />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#1CB0F6]">
              Writing System
            </p>
            <h2 className="text-xl font-extrabold text-slate-100 font-nunito">
              {overview?.language ?? languageName}
            </h2>
          </div>
        </div>

        <p className="text-sm text-[#8E9FA8] font-semibold leading-relaxed">
          {unavailable && !loading
            ? "Writing system coming soon for this course — continue with your regular lessons."
            : `${primary?.title ?? "Alphabet & Characters"} — learn the script before Unit 1`}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-[#AAB7C2]">
            <span>Characters learned</span>
            <span>
              {loading ? "…" : `${learned} / ${total}`}
            </span>
          </div>
          <div className="h-3 rounded-full bg-[#202F36] border border-[#37464F] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-[#1CB0F6] to-[#58CC02] rounded-full"
            />
          </div>
        </div>

        {overview?.sections.map((section) => (
          <div
            key={section.id}
            className={`flex items-center justify-between text-xs font-semibold px-3 py-2 rounded-xl ${
              section.unlocked ? "bg-[#202F36]/80 text-slate-300" : "bg-[#202F36]/40 text-[#6B7A85]"
            }`}
          >
            <span className="flex items-center gap-2">
              {!section.unlocked && <Lock className="w-3.5 h-3.5" />}
              {section.title}
            </span>
            <span>
              {section.characters_learned}/{section.total_characters}
            </span>
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          {isValidCourseId(courseId) && !unavailable ? (
            <Link href={`/writing/${courseId}`} className="flex-1">
              <DuoButton variant="primary" className="w-full py-3.5 gap-2">
                <PenLine className="w-5 h-5" />
                {completed ? "Practice Characters" : "Start Writing System"}
              </DuoButton>
            </Link>
          ) : (
            <DuoButton variant="primary" className="w-full py-3.5 gap-2 opacity-60" disabled>
              <PenLine className="w-5 h-5" />
              Writing System Unavailable
            </DuoButton>
          )}
        </div>

        {completed && (
          <p className="text-center text-xs font-extrabold text-[#58CC02] uppercase tracking-wide">
            ✓ Ready for Unit 1
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default WritingSystemCard;
