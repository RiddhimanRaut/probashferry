"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Article } from "@/types/article";
import { useSwipe } from "@/hooks/useSwipe";
import CoverPanel from "./CoverPanel";
import ArticlePanel from "./ArticlePanel";
import TableOfContents from "./TableOfContents";
import Header from "@/components/layout/Header";

const SWIPE_THRESHOLD = 60;
const TAP_THRESHOLD = 10;
const CONTROLS_TIMEOUT = 3000;

const panelVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
  }),
};

export default function MagazineViewer({ articles }: { articles: Article[] }) {
  const totalPanels = articles.length + 1;
  const { currentIndex, direction, goTo, goNext, goPrev } = useSwipe(totalPanels);

  const [showControls, setShowControls] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), CONTROLS_TIMEOUT);
  }, []);

  // Auto-hide when controls become visible
  useEffect(() => {
    if (showControls) resetHideTimer();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [showControls, resetHideTimer]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const dt = Date.now() - touchStart.current.time;

      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
        // Swipe — navigate
        if (dx < 0) goNext();
        else goPrev();
      } else if (Math.abs(dx) < TAP_THRESHOLD && Math.abs(dy) < TAP_THRESHOLD && dt < 300) {
        // Tap — toggle controls
        setShowControls((prev) => !prev);
      }

      touchStart.current = null;
    },
    [goNext, goPrev]
  );

  const onCover = currentIndex === 0;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalPanels - 1;

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-paper"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header hidden on cover, visible on articles — only when controls shown */}
      <AnimatePresence>
        {!onCover && showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative z-50"
          >
            <Header />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={panelVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "tween", duration: 0.35, ease: "easeOut" },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0 overflow-y-auto overflow-x-hidden"
        >
          {onCover ? (
            <CoverPanel />
          ) : (
            <ArticlePanel
              article={articles[currentIndex - 1]}
              isActive={true}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Controls — position indicator + arrows + TOC — appear on tap */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Position indicator with directional arrows */}
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
              <button
                onClick={goPrev}
                className={`transition-opacity ${canGoPrev ? "opacity-60 active:opacity-100" : "opacity-0 pointer-events-none"}`}
                aria-label="Previous"
              >
                <ChevronLeft size={16} className={onCover ? "text-white" : "text-charcoal"} />
              </button>

              <span className={`text-xs tracking-widest tabular-nums ${onCover ? "text-white/50" : "text-charcoal/40"}`}>
                {currentIndex + 1} / {totalPanels}
              </span>

              <button
                onClick={goNext}
                className={`transition-opacity ${canGoNext ? "opacity-60 active:opacity-100" : "opacity-0 pointer-events-none"}`}
                aria-label="Next"
              >
                <ChevronRight size={16} className={onCover ? "text-white" : "text-charcoal"} />
              </button>
            </div>

            <TableOfContents articles={articles} currentIndex={currentIndex} onSelect={goTo} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
