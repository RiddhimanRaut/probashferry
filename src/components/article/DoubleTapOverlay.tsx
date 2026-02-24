"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";

interface HeartBurst {
  id: number;
  x: number;
  y: number;
}

export default function DoubleTapOverlay({ onDoubleTap, children }: { onDoubleTap: () => void; children: ReactNode }) {
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const lastTapRef = useRef(0);

  const handleTap = useCallback(
    (e: React.MouseEvent) => {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = now;
        setHearts((prev) => [...prev, { id, x, y }]);
        setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1000);
        onDoubleTap();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    },
    [onDoubleTap]
  );

  return (
    <div className="relative" onClick={handleTap}>
      {children}
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ scale: 0, opacity: 1, x: heart.x - 24, y: heart.y - 24 }}
            animate={{ scale: 1.5, opacity: 0, y: heart.y - 80 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute pointer-events-none z-50"
          >
            <Heart size={48} className="fill-sindoor text-sindoor" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
