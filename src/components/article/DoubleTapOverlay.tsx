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

const TAP_MOVE_THRESHOLD = 10;

export default function DoubleTapOverlay({ onDoubleTap, children }: { onDoubleTap: () => void; children: ReactNode }) {
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const lastTapRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const spawnHeart = useCallback((x: number, y: number) => {
    const id = Date.now();
    setHearts((prev) => [
      ...prev,
      { id, x, y, rotation: Math.random() * 30 - 15, scale: 0.9 + Math.random() * 0.3 },
    ]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 900);
  }, []);

  const handleTap = useCallback(
    (x: number, y: number, target: HTMLElement, currentTarget: HTMLElement) => {
      if (target.closest("button, a, input, [role='button']")) return;
      const now = Date.now();
      if (now - lastTapRef.current < 350) {
        const rect = currentTarget.getBoundingClientRect();
        spawnHeart(x - rect.left, y - rect.top);
        onDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    },
    [onDoubleTap, spawnHeart]
  );

  // Touch events — reliable on mobile (pointerup can be cancelled by scroll containers)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const t = e.changedTouches[0];
      const dx = Math.abs(t.clientX - touchStartRef.current.x);
      const dy = Math.abs(t.clientY - touchStartRef.current.y);
      touchStartRef.current = null;
      if (dx > TAP_MOVE_THRESHOLD || dy > TAP_MOVE_THRESHOLD) { lastTapRef.current = 0; return; }
      handleTap(t.clientX, t.clientY, e.target as HTMLElement, e.currentTarget as HTMLElement);
    },
    [handleTap]
  );

  // Pointer events — desktop mouse only (skip touch to avoid double-firing)
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      handleTap(e.clientX, e.clientY, e.target as HTMLElement, e.currentTarget as HTMLElement);
    },
    [handleTap]
  );

  return (
    <div className="relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onPointerUp={handlePointerUp}>
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
