"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeartBurst {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface DoubleTapEvent {
  x: number;
  y: number;
  id: number;
}

export default function DoubleTapOverlay({
  onDoubleTap,
  doubleTapEvent,
  children,
}: {
  onDoubleTap: () => void;
  doubleTapEvent: DoubleTapEvent | null;
  children: ReactNode;
}) {
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef(0); // for desktop mouse double-tap
  const lastEventId = useRef(0);
  const onDoubleTapRef = useRef(onDoubleTap);
  onDoubleTapRef.current = onDoubleTap;

  const spawnHeart = useCallback((x: number, y: number) => {
    const id = Date.now();
    setHearts((prev) => [
      ...prev,
      { id, x, y, rotation: Math.random() * 30 - 15, scale: 0.9 + Math.random() * 0.3 },
    ]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 900);
  }, []);

  // Touch double-tap: driven by parent (MagazineViewer detects it reliably)
  useEffect(() => {
    if (!doubleTapEvent || doubleTapEvent.id === lastEventId.current) return;
    lastEventId.current = doubleTapEvent.id;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      spawnHeart(doubleTapEvent.x - rect.left, doubleTapEvent.y - rect.top);
    }
    onDoubleTapRef.current();
  }, [doubleTapEvent, spawnHeart]);

  // Desktop mouse double-click (touch is handled by parent)
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button, a, input, [role='button']")) return;
      const now = Date.now();
      if (now - lastTapRef.current < 400) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        spawnHeart(e.clientX - rect.left, e.clientY - rect.top);
        onDoubleTapRef.current();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    },
    [spawnHeart]
  );

  return (
    <div ref={containerRef} className="relative" onPointerUp={handlePointerUp}>
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
