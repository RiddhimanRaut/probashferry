"use client";

import { motion } from "framer-motion";

export default function ReadingProgress({ progress }: { progress: number }) {
  if (progress <= 0) return null;
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 bg-terracotta z-[60] origin-left"
      style={{ scaleX: progress }}
      transition={{ duration: 0.1 }}
    />
  );
}
