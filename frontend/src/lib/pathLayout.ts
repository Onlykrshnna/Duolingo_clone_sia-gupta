import type { CSSProperties } from "react";

/** Zig-zag learning path layout — CSS only, no connector lines. */

/** Tailwind gap class wired to responsive CSS variable. */
export const PATH_NODE_GAP_CLASS = "gap-[var(--path-node-gap)]";

/** Horizontal offset magnitude — alternates ± each row. */
export function getPathOffsetSign(index: number): 1 | -1 {
  return index % 2 === 0 ? 1 : -1;
}

/** Legacy pixel offset (±40px pattern). */
export function getPathOffsetPx(index: number): number {
  return getPathOffsetSign(index) * 40;
}

/** Which side the node sits on relative to center (for mascot placement). */
export function getPathNodeSide(index: number): "left" | "right" {
  return getPathOffsetSign(index) === 1 ? "right" : "left";
}

/** Responsive zig-zag transform via CSS custom property `--path-offset`. */
export function getPathNodeStyle(index: number): CSSProperties {
  const sign = getPathOffsetSign(index);
  return {
    transform: `translateX(calc(var(--path-offset) * ${sign}))`,
  };
}
