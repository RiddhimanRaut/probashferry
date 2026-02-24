"use client";

import { useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Article } from "@/types/article";
import { useSwipe } from "@/hooks/useSwipe";
import CoverPanel from "./CoverPanel";
import ArticlePanel from "./ArticlePanel";
import PanelDots from "./PanelDots";
import TableOfContents from "./TableOfContents";

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY = 500;

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

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info;
      if (offset.x < -SWIPE_THRESHOLD || velocity.x < -SWIPE_VELOCITY) {
        goNext();
      } else if (offset.x > SWIPE_THRESHOLD || velocity.x > SWIPE_VELOCITY) {
        goPrev();
      }
    },
    [goNext, goPrev]
  );

  return (
    <div className="fixed inset-0 overflow-hidden bg-paper">
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
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="absolute inset-0"
        >
          {currentIndex === 0 ? (
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
