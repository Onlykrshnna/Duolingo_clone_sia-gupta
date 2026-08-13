"use client";

import React from "react";

const LINKS = ["Privacy", "Terms", "Restore Purchases", "Help"];

export default function SuperFooter() {
  return (
    <footer className="px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))] border-t border-[#37464F]/50 mt-8">
      <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-x-4 gap-y-2">
        {LINKS.map((label) => (
          <button
            key={label}
            type="button"
            className="text-[11px] font-extrabold text-slate-500 hover:text-slate-400 uppercase tracking-wider font-nunito min-h-[44px] px-2"
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-center text-[10px] text-slate-600 font-semibold mt-4 font-nunito">
        Demo subscription page — no payment integration
      </p>
    </footer>
  );
}
