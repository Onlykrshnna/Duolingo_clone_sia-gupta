"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import SuperHero from "@/components/super/SuperHero";
import SuperComparisonTable from "@/components/super/SuperComparisonTable";
import SuperTrialCard from "@/components/super/SuperTrialCard";
import SuperBenefitsGrid from "@/components/super/SuperBenefitsGrid";
import SuperTestimonials from "@/components/super/SuperTestimonials";
import SuperFAQ from "@/components/super/SuperFAQ";
import SuperFooter from "@/components/super/SuperFooter";

export default function SuperTrialPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen min-h-[100dvh] w-full overflow-x-clip bg-[#131F24] text-[#F3F4F6] font-nunito">
      <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#0c1929] via-[#152a45] to-[#1a1040] -z-10" />

      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#131F24]/80 backdrop-blur-md border-b border-[#37464F]/40">
        <Link
          href="/"
          className="text-xs font-extrabold uppercase tracking-wider text-sky-400 hover:text-sky-300 transition-colors min-h-[44px] flex items-center"
        >
          ← Back
        </Link>
        <span className="text-xs font-black uppercase tracking-[0.2em] text-white/90 italic">Super</span>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[#AAB7C2] hover:text-slate-200 transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-5xl mx-auto pb-8"
      >
        <SuperHero />
        <SuperComparisonTable />
        <SuperTrialCard onMaybeLater={() => router.push("/")} />
        <SuperBenefitsGrid />
        <SuperTestimonials />
        <SuperFAQ />
        <SuperFooter />
      </motion.main>
    </div>
  );
}

export const dynamic = "force-dynamic";
