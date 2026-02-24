"use client";

import { useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Article } from "@/types/article";
import { useSwipe } from "@/hooks/useSwipe";
import CoverPanel from "./CoverPanel";
import ArticlePanel from "./ArticlePanel";
import PanelDots from "./PanelDots";
import TableOfContents from "./TableOfContents";
import Header from "@/components/layout/Header";

const SWIPE_THRESHOLD = 60;

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

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

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
        if (dx < 0) goNext();
        else goPrev();
      }

      touchStart.current = null;
    },
    [goNext, goPrev]
  );

  const onCover = currentIndex === 0;

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-paper"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header hidden on cover, visible on articles */}
      {!onCover && <Header />}

      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={panelVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
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

      <PanelDots total={totalPanels} current={currentIndex} onDotClick={goTo} />
      <TableOfContents articles={articles} currentIndex={currentIndex} onSelect={goTo} />
    </div>
  );
}
