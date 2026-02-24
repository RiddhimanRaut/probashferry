"use client";

import { motion } from "framer-motion";
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
    <div className="h-[100dvh] w-screen relative flex flex-col items-center justify-center bg-charcoal overflow-hidden">
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

      {/* Magazine title — centered */}
      <motion.div
        className="relative z-10 flex flex-col items-center px-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
      >
        <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl text-white tracking-tight leading-none text-center">
          Probashferry
        </h1>

        <div className="w-12 h-px bg-mustard my-5" />

        <p className="text-white/70 text-base sm:text-lg font-light text-center">
          Stories of Bengalis Abroad
        </p>

        {issueTitle && (
          <p className="text-mustard/60 text-sm mt-3 uppercase tracking-widest text-center">
            {issueTitle}
          </p>
        )}

        <p className="text-white/30 text-sm font-bengali mt-4 text-center">
          প্রবাসে বাঙালির গল্প
        </p>
      </motion.div>

      {/* Swipe cue */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
        <motion.div
          className="flex items-center gap-2 text-white/25 text-xs"
          animate={{ x: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          <ChevronLeft size={14} />
          <span className="uppercase tracking-widest">Swipe</span>
        </motion.div>
      </div>
    </div>
  );
}
