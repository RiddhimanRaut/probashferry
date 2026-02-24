"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export default function CoverPanel() {
  return (
    <div className="h-[100dvh] relative flex flex-col items-center justify-center bg-charcoal overflow-hidden">
      <div className="absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-charcoal via-charcoal/95 to-terracotta-dark/20" />
      </div>

      <motion.div
        className="relative z-10 text-center px-6 max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <motion.p
          className="text-mustard text-sm uppercase tracking-[0.3em] mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          A Digital Magazine
        </motion.p>

        <h1 className="font-heading text-5xl md:text-7xl text-white mb-4 tracking-tight">
          Probashferry
        </h1>

        <p className="text-white/60 text-lg md:text-xl font-light mb-2">
          Stories of Bengalis Abroad
        </p>

        <div className="w-16 h-px bg-mustard mx-auto my-6" />

        <p className="text-white/40 text-sm font-bengali">
          প্রবাসে বাঙালির গল্প
        </p>
      </motion.div>

      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/30 text-sm"
        animate={{ x: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <ChevronLeft size={16} />
        <span>Swipe to begin</span>
      </motion.div>
    </div>
  );
}
