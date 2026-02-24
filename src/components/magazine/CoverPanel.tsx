"use client";

import { ChevronLeft } from "lucide-react";

interface CoverPanelProps {
  coverImage?: string;
  issueTitle?: string;
}

export default function CoverPanel({
  coverImage = "/images/cover.jpg",
  issueTitle,
}: CoverPanelProps) {
  return (
    <div className="h-full w-full absolute inset-0 flex flex-col items-center justify-center bg-charcoal overflow-hidden">
      {/* Full-bleed cover image */}
      <div className="absolute inset-0">
        <img
          src={coverImage}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/40 via-charcoal/30 to-charcoal/70" />
      </div>

      {/* Magazine title — centered, CSS animation for reliable first-load */}
      <div className="relative z-10 flex flex-col items-center px-8 animate-fade-up">
        <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl text-white tracking-tight leading-none text-center">
          Probashferry
        </h1>

        <div className="w-12 h-px bg-mustard my-5" />

        {issueTitle && (
          <p className="text-mustard/60 text-sm mt-3 uppercase tracking-widest text-center">
            {issueTitle}
          </p>
        )}

        <p className="text-white/30 text-sm font-bengali mt-4 text-center">
          প্রবাসে বাঙালির গল্প
        </p>
      </div>

      {/* Swipe cue — CSS animation so it works on first load */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
        <div className="flex items-center gap-2 text-white/25 text-xs animate-nudge">
          <ChevronLeft size={14} />
          <span className="uppercase tracking-widest">Swipe</span>
        </div>
      </div>
    </div>
  );
}
