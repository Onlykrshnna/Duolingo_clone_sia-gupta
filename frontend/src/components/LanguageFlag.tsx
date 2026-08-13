"use client";

import React, { useState } from "react";
import { Globe2 } from "lucide-react";
import { getFlagAsset, getLanguageByCode, normalizeLanguageCode } from "@/lib/languageRegistry";

export type LanguageFlagSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<LanguageFlagSize, string> = {
  xs: "w-5 h-3.5",
  sm: "w-6 h-4",
  md: "w-7 h-[18px]",
  lg: "w-12 h-8",
  xl: "w-16 h-11",
};

const ICON_SIZES: Record<LanguageFlagSize, string> = {
  xs: "w-3 h-3",
  sm: "w-3.5 h-3.5",
  md: "w-4 h-4",
  lg: "w-5 h-5",
  xl: "w-7 h-7",
};

export interface LanguageFlagProps {
  /** ISO language code or legacy flag path / emoji */
  code?: string | null;
  size?: LanguageFlagSize;
  className?: string;
  showSkeleton?: boolean;
}

function FallbackIcon({ size, className }: { size: LanguageFlagSize; className?: string }) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded flex items-center justify-center bg-[#243840] border border-[#37464F] shrink-0 ${className ?? ""}`}
      aria-hidden
    >
      <Globe2 className={`${ICON_SIZES[size]} text-[#8E9FA8]`} />
    </div>
  );
}

export function LanguageFlag({
  code,
  size = "md",
  className = "",
  showSkeleton = true,
}: LanguageFlagProps) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const normalized = normalizeLanguageCode(code ?? undefined);
  const lang = getLanguageByCode(normalized ?? code);
  const src = getFlagAsset(code);
  const label = lang ? `${lang.languageName} flag` : "Language flag";

  if (failed) {
    return <FallbackIcon size={size} className={className} />;
  }

  return (
    <div className={`relative shrink-0 ${SIZE_CLASSES[size]} ${className}`}>
      {showSkeleton && loading && (
        <div
          className={`absolute inset-0 rounded bg-[#243840] border border-[#37464F] animate-pulse`}
          aria-hidden
        />
      )}
      <img
        src={src}
        alt={label}
        className={`${SIZE_CLASSES[size]} rounded object-cover border border-[#37464F] transition-opacity duration-200 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
    </div>
  );
}

export default LanguageFlag;
