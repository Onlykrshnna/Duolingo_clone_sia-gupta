import type { Transition, Variants } from "framer-motion";

export const springSnappy: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 28,
};

export const easeOutFast: Transition = {
  duration: 0.18,
  ease: "easeOut",
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export const fadeSlideIn: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
};

export const scalePop: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.92 },
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(8px)" },
  exit: { opacity: 0, backdropFilter: "blur(0px)" },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.9, y: 28 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.94, y: 14 },
};

export const buttonTap = {
  whileHover: { scale: 1.03, y: -1 },
  whileTap: { scale: 0.96, y: 2 },
  transition: easeOutFast,
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};
