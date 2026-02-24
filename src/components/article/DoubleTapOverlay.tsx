"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeartBurst {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export default function DoubleTapOverlay({ onDoubleTap, children }: { onDoubleTap: () => void; children: ReactNode }) {
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const lastTapRef = useRef(0);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // Ignore non-primary buttons and button/link taps
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button, a, input, [role='button']")) return;

      const now = Date.now();
      if (now - lastTapRef.current < 350) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = now;
        setHearts((prev) => [
          ...prev,
          { id, x, y, rotation: Math.random() * 30 - 15, scale: 0.9 + Math.random() * 0.3 },
        ]);
        setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 900);
        onDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    },
    [onDoubleTap]
  );

  return (
    <div className="relative" onPointerUp={handlePointerUp}>
      {children}
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ scale: 0, opacity: 0, x: heart.x - 28, y: heart.y - 28, rotate: heart.rotation }}
            animate={{
              scale: [0, heart.scale, heart.scale * 0.85],
              opacity: [0, 1, 0],
              y: [heart.y - 28, heart.y - 90],
            }}
            transition={{ duration: 0.8, ease: "easeOut", times: [0, 0.3, 1] }}
            className="absolute pointer-events-none z-50"
          >
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <defs>
                <radialGradient id={`hg-${heart.id}`} cx="40%" cy="35%">
                  <stop offset="0%" stopColor="#E85D4A" />
                  <stop offset="100%" stopColor="#A52422" />
                </radialGradient>
              </defs>
              <path
                d="M28 48C28 48 6 34 6 18C6 10 12 4 19 4C23.5 4 27 6.5 28 10C29 6.5 32.5 4 37 4C44 4 50 10 50 18C50 34 28 48 28 48Z"
                fill={`url(#hg-${heart.id})`}
                opacity="0.9"
              />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
