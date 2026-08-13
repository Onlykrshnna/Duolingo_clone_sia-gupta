"use client";

import React from "react";

export function WritingSystemSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto animate-pulse space-y-6 p-4 sm:p-6">
      <div className="h-8 bg-[#202F36] rounded-xl w-2/3 mx-auto" />
      <div className="h-3 bg-[#202F36] rounded-full w-full" />
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-28 bg-[#202F36] rounded-xl shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 bg-[#202F36] rounded-2xl border-2 border-[#37464F]" />
        ))}
      </div>
    </div>
  );
}

export default WritingSystemSkeleton;
