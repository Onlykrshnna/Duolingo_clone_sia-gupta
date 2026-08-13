"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  stepKey: string | number;
  scrollable?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  footer,
  header,
  stepKey,
  scrollable = true,
}) => {
  return (
    <div
      className={`min-h-screen min-h-[100dvh] bg-[#131F24] text-[#F3F4F6] flex flex-col font-nunito ${
        scrollable ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden"
      }`}
    >
      {header}

      <AnimatePresence mode="wait">
        <motion.main
          key={stepKey}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-10 w-full max-w-lg mx-auto"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {footer && (
        <footer className="shrink-0 pb-8 sm:pb-10 pt-4 flex justify-center w-full sticky bottom-0 bg-gradient-to-t from-[#131F24] via-[#131F24] to-transparent">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default OnboardingLayout;
