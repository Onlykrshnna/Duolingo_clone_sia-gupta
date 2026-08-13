"use client";

import { Toaster } from "sonner";

export default function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      expand
      visibleToasts={4}
      toastOptions={{
        classNames: {
          toast:
            "font-nunito !bg-[#1F2E35] !text-slate-100 !border-2 !border-[#37464F] !shadow-xl !animate-in !slide-in-from-top-4 !fade-in !duration-300",
          title: "!font-extrabold !text-slate-100",
          description: "!text-slate-400 !font-semibold",
          success: "!border-brand-green/40",
        },
      }}
      richColors
      closeButton
    />
  );
}
