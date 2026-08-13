"use client";

import React from "react";
import { motion } from "framer-motion";
import { OnboardingLanguageOption } from "@/lib/onboarding";
import LanguageFlag from "@/components/LanguageFlag";

interface LanguageCardProps {
  language: OnboardingLanguageOption;
  selected: boolean;
  onSelect: (language: OnboardingLanguageOption) => void;
  index?: number;
}

export const LanguageCard: React.FC<LanguageCardProps> = ({
  language,
  selected,
  onSelect,
  index = 0,
}) => {
  const isDisabled = !language.available;
  const isSpecial = !["es", "fr", "de", "ja", "ko", "it", "en", "zh", "hi", "ru", "pt"].includes(language.id);

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: selected ? 1.02 : 1,
      }}
      transition={{ duration: 0.4, delay: index * 0.035, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        isDisabled
          ? undefined
          : {
              scale: selected ? 1.02 : 1.04,
              y: -3,
              transition: { duration: 0.2 },
            }
      }
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      disabled={isDisabled}
      onClick={() => !isDisabled && onSelect(language)}
      className={`
        relative w-full text-left rounded-2xl border-2 p-5 sm:p-6 flex flex-col gap-3 font-nunito min-h-[140px]
        transition-shadow duration-200
        ${
          selected
            ? "border-brand-green bg-[#152515] shadow-[0_0_24px_rgba(88,204,2,0.35),0_0_0_1px_rgba(88,204,2,0.5)]"
            : isDisabled
              ? "border-[#2A353C] bg-[#161F24] opacity-55 cursor-not-allowed grayscale-[0.35]"
              : "border-[#37464F] bg-[#1F2E35] hover:border-[#4E606A] hover:shadow-lg cursor-pointer"
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <motion.div
          animate={selected ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 0.35 }}
        >
          {isSpecial ? (
            <span className="text-4xl sm:text-5xl leading-none select-none">
              {language.id === "math" ? "🔢" : "♟️"}
            </span>
          ) : (
            <LanguageFlag code={language.id} size="xl" />
          )}
        </motion.div>

        {selected && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] font-black uppercase tracking-widest text-brand-green bg-brand-green/20 border border-brand-green/40 px-2.5 py-1 rounded-lg"
          >
            Selected
          </motion.span>
        )}

        {isDisabled && (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-[#202F36] px-2.5 py-1 rounded-lg border border-[#37464F]">
            Coming Soon
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 mt-auto">
        <h3
          className={`font-extrabold text-lg sm:text-xl leading-tight ${
            selected ? "text-brand-green" : isDisabled ? "text-slate-500" : "text-slate-100"
          }`}
        >
          {language.name}
        </h3>
        {!isSpecial && (
          <p className={`text-xs font-bold ${isDisabled ? "text-slate-600" : "text-slate-400"}`}>
            {language.nativeName}
          </p>
        )}
        <p className={`text-xs sm:text-sm font-bold ${isDisabled ? "text-slate-600" : "text-slate-400"}`}>
          {language.learnerCount}
        </p>
      </div>
    </motion.button>
  );
};

export default LanguageCard;
