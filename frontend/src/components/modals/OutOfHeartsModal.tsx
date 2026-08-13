"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, RefreshCw, Dumbbell } from "lucide-react";
import DuoButton from "../DuoButton";
import Mascot from "../Mascot";
import { playSound } from "@/lib/sounds";
import { modalBackdrop, modalContent } from "@/lib/animations";

interface OutOfHeartsModalProps {
  onRefill: () => Promise<void>;
  onPractice: () => void;
  onAbandon: () => void;
  loadingRefill?: boolean;
}

export const OutOfHeartsModal: React.FC<OutOfHeartsModalProps> = ({
  onRefill,
  onPractice,
  onAbandon,
  loadingRefill = false,
}) => {
  useEffect(() => {
    playSound("modalOpen");
    playSound("heartLost");
  }, []);

  return (
    <motion.div
      variants={modalBackdrop}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        variants={modalContent}
        initial="hidden"
        animate="visible"
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="bg-[#1F2E35] border-2 border-[#37464F] max-w-md w-full p-6 sm:p-8 rounded-3xl text-center space-y-6 shadow-2xl flex flex-col items-center font-nunito"
      >
        <Mascot size={100} mood="sad" message="Don't give up!" showBubble />

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 leading-tight">
            You ran out of hearts!
          </h2>
          <p className="text-slate-400 font-semibold text-sm sm:text-base leading-relaxed">
            Practice this lesson without losing hearts, buy a gem refill, or head back to the path.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full pt-2">
          <DuoButton
            onClick={onPractice}
            variant="primary"
            className="w-full py-4 text-base font-extrabold flex justify-center items-center"
          >
            <Dumbbell className="w-5 h-5 mr-2" />
            Practice to refill hearts
          </DuoButton>

          <DuoButton
            disabled={loadingRefill}
            onClick={onRefill}
            variant="secondary"
            className="w-full py-4 text-base font-extrabold flex justify-center items-center"
          >
            {loadingRefill ? (
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Heart className="w-5 h-5 fill-current mr-2" />
            )}
            <span>Refill hearts (10 gems)</span>
          </DuoButton>

          <DuoButton
            onClick={onAbandon}
            variant="ghost"
            className="w-full py-3 text-sm border-[#37464F] text-slate-400 hover:bg-[#131F24]"
          >
            Leave lesson
          </DuoButton>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OutOfHeartsModal;
