"use client";

import { motion } from "framer-motion";

interface PanelDotsProps {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
}

export default function PanelDots({ total, current, onDotClick }: PanelDotsProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-charcoal/60 backdrop-blur-sm rounded-full px-3 py-2 safe-bottom">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onDotClick(i)}
          className="relative w-2.5 h-2.5 rounded-full"
          aria-label={`Go to panel ${i + 1}`}
        >
          <motion.span
            className="block w-full h-full rounded-full"
            animate={{
              backgroundColor: i === current ? "#D4A843" : "rgba(255,255,255,0.3)",
              scale: i === current ? 1.25 : 1,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          />
        </button>
      ))}
    </div>
  );
}
