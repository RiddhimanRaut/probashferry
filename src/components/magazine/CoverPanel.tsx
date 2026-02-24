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
    <div className="h-[100dvh] w-screen relative flex flex-col items-center justify-end bg-charcoal overflow-hidden">
      {/* Full-bleed cover image */}
      <div className="absolute inset-0">
        <img
          src={coverImage}
          alt=""
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback if image doesn't exist yet
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Dark gradient overlay — heavier at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-charcoal/20 to-charcoal/80" />
      </div>

      {/* Magazine title block — pinned to lower third */}
      <motion.div
        className="relative z-10 text-center px-8 pb-24 w-full max-w-2xl"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
      >
        <motion.p
          className="text-mustard/90 text-xs sm:text-sm uppercase tracking-[0.35em] mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          A Digital Magazine
        </motion.p>

        <h1 className="font-heading text-6xl sm:text-7xl md:text-8xl text-white mb-3 tracking-tight leading-none">
          Probashferry
        </h1>

        <div className="w-12 h-px bg-mustard mx-auto my-4" />

        <p className="text-white/70 text-base sm:text-lg font-light">
          Stories of Bengalis Abroad
        </p>

        {issueTitle && (
          <p className="text-mustard/60 text-sm mt-3 uppercase tracking-widest">
            {issueTitle}
          </p>
        )}

        <p className="text-white/30 text-sm font-bengali mt-4">
          প্রবাসে বাঙালির গল্প
        </p>
      </motion.div>

      {/* Swipe cue at very bottom */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/25 text-xs z-10"
        animate={{ x: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <ChevronLeft size={14} />
        <span className="uppercase tracking-widest">Swipe</span>
      </motion.div>
    </div>
  );
}
