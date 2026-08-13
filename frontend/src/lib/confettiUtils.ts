import confetti from "canvas-confetti";
import { shouldAnimate } from "@/store/usePreferencesStore";

const COLORS = ["#58CC02", "#FFC800", "#1CB0F6", "#FF4B4B", "#FF9600"];

export function burstConfetti(intensity: "small" | "medium" | "large" = "medium") {
  if (!shouldAnimate()) return;

  const counts = { small: 30, medium: 80, large: 140 };
  const count = counts[intensity];

  confetti({
    particleCount: count,
    spread: intensity === "small" ? 50 : 80,
    origin: { y: 0.65 },
    colors: COLORS,
    disableForReducedMotion: true,
  });
}

export function sideCannons(durationMs = 2000) {
  if (!shouldAnimate()) return;

  const end = Date.now() + durationMs;
  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

export function fireworks(durationMs = 3000) {
  if (!shouldAnimate()) return;

  const end = Date.now() + durationMs;
  const frame = () => {
    confetti({
      particleCount: 40,
      startVelocity: 35,
      spread: 360,
      ticks: 80,
      origin: { x: Math.random(), y: Math.random() * 0.5 + 0.1 },
      colors: COLORS,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) setTimeout(frame, 250);
  };
  frame();
}

export function correctAnswerBurst() {
  if (!shouldAnimate()) return;
  confetti({
    particleCount: 18,
    spread: 45,
    origin: { y: 0.75 },
    colors: ["#58CC02", "#FFC800"],
    scalar: 0.8,
    disableForReducedMotion: true,
  });
}
