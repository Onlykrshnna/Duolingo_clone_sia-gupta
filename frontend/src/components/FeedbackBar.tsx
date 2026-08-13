"use client";

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import DuoButton from "./DuoButton";
import ForeignWord from "./ForeignWord";
import { playSound } from "@/lib/sounds";
import { correctAnswerBurst } from "@/lib/confettiUtils";
import { audioManager } from "@/lib/audio/AudioManager";
import type { FeedbackWord } from "@/lib/audio/feedbackWord";

interface FeedbackBarProps {
  isAnswerChecked: boolean;
  isCorrect: boolean;
  correctAnswer: any;
  activeExerciseType: string;
  hasSelection: boolean;
  isIntro?: boolean;
  onCheck: () => void;
  onNext: () => void;
  loading?: boolean;
  onCorrectFeedback?: () => void;
  onWrongFeedback?: () => void;
  feedbackWord?: FeedbackWord | null;
  targetLang?: string;
}

export const FeedbackBar: React.FC<FeedbackBarProps> = ({
  isAnswerChecked,
  isCorrect,
  correctAnswer,
  activeExerciseType,
  hasSelection,
  isIntro = false,
  onCheck,
  onNext,
  loading = false,
  onCorrectFeedback,
  onWrongFeedback,
  feedbackWord,
  targetLang = "",
}) => {
  const prevCheckedRef = useRef(false);
  const spokeRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (isIntro) {
          onNext();
        } else if (isAnswerChecked) {
          onNext();
        } else if (hasSelection && !loading) {
          onCheck();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isIntro, isAnswerChecked, hasSelection, onCheck, onNext, loading]);

  useEffect(() => {
    if (isAnswerChecked && !prevCheckedRef.current) {
      if (isCorrect) {
        playSound("correct");
        playSound("xp");
        correctAnswerBurst();
        onCorrectFeedback?.();
      } else {
        playSound("wrong");
        playSound("heartLost");
        onWrongFeedback?.();
      }

      if (feedbackWord?.text && targetLang && !spokeRef.current) {
        spokeRef.current = true;
        void audioManager.play(feedbackWord.text, targetLang, {
          context: isCorrect ? "review" : "vocabulary",
        });
      }
    }
    if (!isAnswerChecked) {
      spokeRef.current = false;
    }
    prevCheckedRef.current = isAnswerChecked;
  }, [
    isAnswerChecked,
    isCorrect,
    onCorrectFeedback,
    onWrongFeedback,
    feedbackWord,
    targetLang,
  ]);

  const getContainerBg = () => {
    if (!isAnswerChecked) return "bg-[#1F2E35] border-t-2 border-[#37464F]";
    return isCorrect
      ? "bg-[#1a3d24] border-t-2 border-[#46a302]/50"
      : "bg-[#3d1a24] border-t-2 border-rose-600/50";
  };

  const getCorrectAnswerLabel = () => {
    if (!correctAnswer) return "";

    if (
      activeExerciseType === "multiple_choice" ||
      activeExerciseType === "fill_blank" ||
      activeExerciseType === "image_selection" ||
      activeExerciseType === "listening"
    ) {
      return correctAnswer.selected;
    }
    if (activeExerciseType === "type_answer") {
      return correctAnswer.text;
    }
    if (activeExerciseType === "translate") {
      return correctAnswer.translation;
    }
    if (activeExerciseType === "word_bank") {
      return (correctAnswer.words || []).join(" ");
    }
    if (activeExerciseType === "match_pairs") {
      return "All cards matched!";
    }
    return "";
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className={`fixed bottom-0 left-0 right-0 py-6 px-4 md:px-8 z-40 ${getContainerBg()}`}
    >
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <AnimatePresence mode="wait">
          {isAnswerChecked ? (
            <motion.div
              key={isCorrect ? "correct" : "wrong"}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 text-left w-full md:w-auto"
            >
              {isCorrect ? (
                <>
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  >
                    <CheckCircle className="w-8 h-8 text-brand-green shrink-0 fill-current bg-[#131F24] rounded-full" />
                  </motion.div>
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-green-400 text-lg leading-tight">
                      Nicely done!
                    </h4>
                    {feedbackWord?.text ? (
                      <ForeignWord
                        native={feedbackWord.text}
                        pronunciation={feedbackWord.pronunciation}
                        meaning={feedbackWord.meaning}
                        showMeaning
                        size="sm"
                        align="left"
                      />
                    ) : (
                      <p className="text-xs text-green-300/80 font-bold uppercase tracking-wider">
                        Correct Answer
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ x: [0, -6, 6, -4, 4, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <XCircle className="w-8 h-8 text-rose-red shrink-0 fill-current bg-[#131F24] rounded-full" />
                  </motion.div>
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-rose-300 text-lg leading-tight">
                      Try again.
                    </h4>
                    {feedbackWord?.text ? (
                      <div>
                        <p className="text-xs text-rose-400 font-bold uppercase tracking-wider mb-1">
                          Correct Answer
                        </p>
                        <ForeignWord
                          native={feedbackWord.text}
                          pronunciation={feedbackWord.pronunciation}
                          meaning={feedbackWord.meaning}
                          showMeaning
                          size="sm"
                          align="left"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-rose-200/90 font-bold">
                        <span className="font-medium text-rose-400">Correct solution:</span>{" "}
                        {getCorrectAnswerLabel()}
                      </p>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <div className="hidden md:block w-5" />
          )}
        </AnimatePresence>

        <div className="w-full md:w-auto shrink-0 flex justify-end">
          <AnimatePresence mode="wait">
            {isIntro ? (
              <motion.div key="intro-continue" className="w-full md:w-48">
                <DuoButton onClick={onNext} variant="primary" className="w-full py-4 text-base">
                  Continue
                </DuoButton>
              </motion.div>
            ) : isAnswerChecked ? (
              <motion.div
                key="continue-btn"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.22, delay: 0.08 }}
                className="w-full md:w-48"
              >
                <DuoButton
                  variant={isCorrect ? "primary" : "danger"}
                  onClick={onNext}
                  className="w-full py-4 text-base"
                >
                  Continue
                </DuoButton>
              </motion.div>
            ) : (
              <motion.div key="check-btn" className="w-full md:w-48">
                <DuoButton
                  disabled={!hasSelection || loading}
                  onClick={onCheck}
                  variant={hasSelection ? "primary" : "locked"}
                  className="w-full py-4 text-base"
                >
                  Check Answer
                </DuoButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default FeedbackBar;
