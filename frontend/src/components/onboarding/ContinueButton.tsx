"use client";

import React from "react";
import { motion } from "framer-motion";
import DuoButton from "../DuoButton";

interface ContinueButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
  className?: string;
}

export const ContinueButton: React.FC<ContinueButtonProps> = ({
  onClick,
  disabled = false,
  loading = false,
  label = "Continue",
  className = "",
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full flex justify-center px-4 ${className}`}
    >
      <motion.div whileTap={disabled || loading ? undefined : { scale: 0.97 }} className="w-full max-w-[280px]">
        <DuoButton
          variant="primary"
          onClick={onClick}
          disabled={disabled || loading}
          className="w-full py-4 text-base font-extrabold uppercase tracking-wide"
        >
          {loading ? "Saving..." : label}
        </DuoButton>
      </motion.div>
    </motion.div>
  );
};

export default ContinueButton;
