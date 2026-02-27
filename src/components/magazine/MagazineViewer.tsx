"use client";

import { useRef, useCallback, useState, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Share2, Check } from "lucide-react";
import { Article } from "@/types/article";
import { useSwipe } from "@/hooks/useSwipe";
import CoverPanel from "./CoverPanel";
import ArticlePanel from "./ArticlePanel";
import PhotoGalleryPanel from "./PhotoGalleryPanel";
import ArtGalleryPanel from "./ArtGalleryPanel";
import TeamPanel from "./TeamPanel";
import TableOfContents, { SECTION_ICONS } from "./TableOfContents";
import Header from "@/components/layout/Header";

const SWIPE_THRESHOLD = 60;
const TAP_THRESHOLD = 25;
const TAP_HOLD_LIMIT = 500;
const DOUBLE_TAP_WINDOW = 400;
const DOUBLE_TAP_DISTANCE = 60; // px — both taps must be within this radius
const CONTROLS_TIMEOUT = 3000;

interface HeartBurst {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

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

interface MagazineViewerProps {
  articles: Article[];
  initialArticleSlug?: string;
  initialPhotoIndex?: number;
}

export default function MagazineViewer({ articles, initialArticleSlug, initialPhotoIndex }: MagazineViewerProps) {
  const totalPanels = articles.length + 2;
  const { currentIndex, direction, goTo, goNext, goPrev } = useSwipe(totalPanels);
  const initialNavDone = useRef(false);

  const [showControls, setShowControls] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [hoverEdge, setHoverEdge] = useState<"left" | "right" | null>(null);
  const [desktopHover, setDesktopHover] = useState(false);
  const [doubleTapEvent, setDoubleTapEvent] = useState<{ x: number; y: number; id: number } | null>(null);
  const [hearts, setHearts] = useState<HeartBurst[]>([]);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTouchTap = useRef({ time: 0, x: 0, y: 0 });
  const lastMouseTap = useRef({ time: 0, x: 0, y: 0 });
  const lastTouchDoubleTap = useRef(0);
  const [scrollZone, setScrollZone] = useState<"top" | "middle" | "bottom">("top");
  const [sectionSplash, setSectionSplash] = useState<{ section: string; dir: number } | null>(null);
  const prevCategoryRef = useRef<string | null>(null);
  const hasNavigatedRef = useRef(false);
  const skipSplashRef = useRef(false);
  const splashActiveRef = useRef(false);
  splashActiveRef.current = !!sectionSplash;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Navigate to initial article from ?article=slug query param
  useEffect(() => {
    if (!initialArticleSlug || initialNavDone.current) return;
    initialNavDone.current = true;
    const idx = articles.findIndex((a) => a.slug === initialArticleSlug);
    if (idx !== -1) {
      skipSplashRef.current = true;
      goTo(idx + 1);
    }
    window.history.replaceState({}, "", "/");
  }, [initialArticleSlug, articles, goTo]);

  const getScrollContainer = useCallback(
    () => document.querySelector<HTMLElement>("[data-scroll-container]"),
    []
  );

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const atTop = el.scrollTop <= 20;
      const atBottom = el.scrollTop >= el.scrollHeight - el.clientHeight - 20;
      setScrollZone(atTop ? "top" : atBottom ? "bottom" : "middle");
    },
    []
  );

  const scrollTo = useCallback((target: "top" | "bottom") => {
    const el = getScrollContainer();
    if (!el) return;
    el.scrollTo({ top: target === "top" ? 0 : el.scrollHeight, behavior: "smooth" });
  }, [getScrollContainer]);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
  }, []);

  const resetHideTimer = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setShowControls(false), CONTROLS_TIMEOUT);
  }, [clearHideTimer]);

  useEffect(() => {
    if (showControls && !tocOpen) resetHideTimer();
    if (tocOpen) clearHideTimer();
    return () => clearHideTimer();
  }, [showControls, tocOpen, resetHideTimer, clearHideTimer]);

  useEffect(() => {
    if (!showControls) setTocOpen(false);
  }, [showControls]);

  // Keyboard navigation (arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (splashActiveRef.current) return;
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        const el = getScrollContainer();
        if (el) el.scrollBy({ top: 200, behavior: "smooth" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const el = getScrollContainer();
        if (el) el.scrollBy({ top: -200, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, getScrollContainer]);

  // Desktop: show controls when mouse is near top/bottom edges
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover)");
    if (!mq.matches) return;
    const handleMouseMove = (e: MouseEvent) => {
      const nearEdge = e.clientY < 60 || e.clientY > window.innerHeight - 80;
      setDesktopHover(nearEdge);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Show section splash when swiping into a new category
  useLayoutEffect(() => {
    const isArticle = currentIndex >= 1 && currentIndex <= articles.length;
    const currentCategory = isArticle ? articles[currentIndex - 1].category : null;

    if (skipSplashRef.current) {
      skipSplashRef.current = false;
    } else if (currentCategory && currentCategory !== prevCategoryRef.current && !sectionSplash && hasNavigatedRef.current) {
      setSectionSplash({ section: currentCategory, dir: direction });
      setTimeout(() => setSectionSplash(null), 1500);
    }

    prevCategoryRef.current = currentCategory;
    hasNavigatedRef.current = true;
  }, [currentIndex, articles, sectionSplash, direction]);

  const handleTocOpenChange = useCallback((open: boolean) => {
    setTocOpen(open);
    if (open) setShowControls(true);
    else resetHideTimer();
  }, [resetHideTimer]);

  const handleArticleSelect = useCallback((index: number) => {
    skipSplashRef.current = true;
    goTo(index);
  }, [goTo]);

  const handleSectionSelect = useCallback((section: string) => {
    const idx = articles.findIndex(a => a.category === section);
    if (idx !== -1) goTo(idx + 1);
    setSectionSplash({ section, dir: 1 });
    setTimeout(() => setSectionSplash(null), 1500);
  }, [articles, goTo]);

  const handleMagazineShare = useCallback(async () => {
    const url = "https://probashferry.vercel.app";
    const title = "Probashferry — Stories of Bengalis Abroad";
    const text = "A digital magazine celebrating the Bengali diaspora.";
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }, []);

  const spawnHeart = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    setHearts((prev) => [
      ...prev,
      { id, x, y, rotation: Math.random() * 30 - 15, scale: 0.9 + Math.random() * 0.3 },
    ]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 1000);
  }, []);

  const fireDoubleTap = useCallback((x: number, y: number) => {
    if (currentIndexRef.current === 0 || currentIndexRef.current === totalPanels - 1) return; // no hearts on cover or team
    // Only fire on content cards, not hero headers
    const el = document.elementFromPoint(x, y);
    if (!el?.closest("[data-likeable]")) return;
    spawnHeart(x, y);
    setDoubleTapEvent({ x, y, id: Date.now() });
  }, [spawnHeart, totalPanels]);

  // --- Touch handling (mobile) ---

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      if (splashActiveRef.current) { touchStart.current = null; return; }
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStart.current.x;
      const dy = touch.clientY - touchStart.current.y;
      const dt = Date.now() - touchStart.current.time;

      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, [role='button']")) {
        // Reset double-tap tracking so button taps don't bridge two content taps
        lastTouchTap.current = { time: 0, x: 0, y: 0 };
        if (singleTapTimer.current) { clearTimeout(singleTapTimer.current); singleTapTimer.current = null; }
        touchStart.current = null;
        return;
      }

      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 500) {
        if (dx < 0) goNext();
        else goPrev();
      } else if (Math.abs(dx) < TAP_THRESHOLD && Math.abs(dy) < TAP_THRESHOLD && dt < TAP_HOLD_LIMIT) {
        const now = Date.now();
        const prev = lastTouchTap.current;
        const isDoubleTap =
          now - prev.time < DOUBLE_TAP_WINDOW &&
          Math.abs(touch.clientX - prev.x) < DOUBLE_TAP_DISTANCE &&
          Math.abs(touch.clientY - prev.y) < DOUBLE_TAP_DISTANCE;
        lastTouchTap.current = { time: now, x: touch.clientX, y: touch.clientY };

        if (singleTapTimer.current) { clearTimeout(singleTapTimer.current); singleTapTimer.current = null; }

        if (isDoubleTap) {
          lastTouchDoubleTap.current = now;
          fireDoubleTap(touch.clientX, touch.clientY);
        } else {
          singleTapTimer.current = setTimeout(() => {
            setShowControls((prev) => !prev);
            singleTapTimer.current = null;
          }, DOUBLE_TAP_WINDOW);
        }
      }

      touchStart.current = null;
    },
    [goNext, goPrev, fireDoubleTap]
  );

  // --- Mouse handling (desktop) ---

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Skip synthetic clicks generated after touch events (prevents duplicate hearts)
      if (Date.now() - lastTouchDoubleTap.current < 800) return;
      if (splashActiveRef.current) return;

      const target = e.target as HTMLElement;
      if (target.closest("button, a, input, [role='button']")) {
        lastMouseTap.current = { time: 0, x: 0, y: 0 };
        return;
      }

      const now = Date.now();
      const prev = lastMouseTap.current;
      const isDoubleTap =
        now - prev.time < DOUBLE_TAP_WINDOW &&
        Math.abs(e.clientX - prev.x) < DOUBLE_TAP_DISTANCE &&
        Math.abs(e.clientY - prev.y) < DOUBLE_TAP_DISTANCE;

      if (isDoubleTap) {
        fireDoubleTap(e.clientX, e.clientY);
        lastMouseTap.current = { time: 0, x: 0, y: 0 };
      } else {
        lastMouseTap.current = { time: now, x: e.clientX, y: e.clientY };
      }
    },
    [fireDoubleTap]
  );

  const onCover = currentIndex === 0;
  const onTeam = currentIndex === totalPanels - 1;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalPanels - 1;
  const controlsVisible = showControls || desktopHover;
  const controlsVisibleRef = useRef(controlsVisible);
  controlsVisibleRef.current = controlsVisible;
  const getControlsVisible = useCallback(() => controlsVisibleRef.current, []);

  return (
    <div
      className="fixed inset-0 overflow-hidden bg-paper"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
    >
      <AnimatePresence>
        {!onCover && controlsVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="relative z-50"
          >
            <Header onTitleClick={() => goTo(0)} />
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
            x: { type: "tween", duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
            opacity: { duration: 0.15 },
          }}
          data-scroll-container
          onScroll={handleScroll}
          className={`absolute inset-0 overflow-x-hidden ${sectionSplash ? "overflow-y-hidden" : "overflow-y-auto"}`}
        >
          {onCover ? (
            <CoverPanel />
          ) : onTeam ? (
            <TeamPanel />
          ) : articles[currentIndex - 1].category === "Photography" ? (
            <PhotoGalleryPanel
              article={articles[currentIndex - 1]}
              isActive={true}
              doubleTapEvent={doubleTapEvent}
              initialPhotoIndex={initialPhotoIndex}
              getControlsVisible={getControlsVisible}
            />
          ) : articles[currentIndex - 1].category === "Art" ? (
            <ArtGalleryPanel
              article={articles[currentIndex - 1]}
              isActive={true}
              doubleTapEvent={doubleTapEvent}
              initialPhotoIndex={initialPhotoIndex}
              getControlsVisible={getControlsVisible}
            />
          ) : (
            <ArticlePanel
              article={articles[currentIndex - 1]}
              isActive={true}
              doubleTapEvent={doubleTapEvent}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Desktop hover edge zones — show arrow on hover, click to navigate */}
      {canGoPrev && !sectionSplash && (
        <div
          className="fixed left-0 top-0 bottom-0 w-16 z-30 hidden md:flex items-center justify-center cursor-pointer"
          onMouseEnter={() => setHoverEdge("left")}
          onMouseLeave={() => setHoverEdge(null)}
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
        >
          <motion.div
            initial={false}
            animate={{ opacity: hoverEdge === "left" ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-10 h-10 rounded-full bg-charcoal/40 backdrop-blur-sm text-white flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </motion.div>
        </div>
      )}
      {canGoNext && !sectionSplash && (
        <div
          className="fixed right-0 top-0 bottom-0 w-16 z-30 hidden md:flex items-center justify-center cursor-pointer"
          onMouseEnter={() => setHoverEdge("right")}
          onMouseLeave={() => setHoverEdge(null)}
          onClick={(e) => { e.stopPropagation(); goNext(); }}
        >
          <motion.div
            initial={false}
            animate={{ opacity: hoverEdge === "right" ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="w-10 h-10 rounded-full bg-charcoal/40 backdrop-blur-sm text-white flex items-center justify-center"
          >
            <ChevronRight size={20} />
          </motion.div>
        </div>
      )}

      {/* Heart burst animation — fixed position, above everything */}
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            className="fixed pointer-events-none"
            style={{ left: heart.x, top: heart.y, zIndex: 9999 }}
            initial={{ scale: 0, opacity: 0, x: "-50%", y: "-50%", rotate: heart.rotation }}
            animate={{
              scale: [0, 1.4, 1.1],
              opacity: [0, 1, 0],
              y: ["-50%", "-180%"],
            }}
            transition={{
              duration: 0.9,
              ease: "easeOut",
              times: [0, 0.25, 1],
            }}
          >
            <svg width="72" height="72" viewBox="0 0 56 56" fill="none">
              <defs>
                <radialGradient id={`hg-${heart.id}`} cx="40%" cy="35%">
                  <stop offset="0%" stopColor="#E85D4A" />
                  <stop offset="100%" stopColor="#A52422" />
                </radialGradient>
              </defs>
              <path
                d="M28 48C28 48 6 34 6 18C6 10 12 4 19 4C23.5 4 27 6.5 28 10C29 6.5 32.5 4 37 4C44 4 50 10 50 18C50 34 28 48 28 48Z"
                fill={`url(#hg-${heart.id})`}
              />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Section splash overlay */}
      <AnimatePresence>
        {sectionSplash && (() => {
          const SplashIcon = SECTION_ICONS[sectionSplash.section];
          return (
            <motion.div
              key="section-splash"
              initial={{ x: sectionSplash.dir > 0 ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ opacity: 0 }}
              transition={{
                x: { type: "tween", duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
                opacity: { duration: 0.5 },
              }}
              className="fixed inset-0 z-[60] bg-charcoal flex items-center justify-center pointer-events-none"
            >
              <div className="flex flex-col items-center gap-4">
                {SplashIcon && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                  >
                    <SplashIcon size={48} className="text-white" strokeWidth={1.5} />
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="w-12 h-px bg-mustard"
                />
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  className="font-heading text-4xl text-white"
                >
                  {sectionSplash.section}
                </motion.h2>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {controlsVisible && !onCover && !onTeam && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-0 left-0 right-0 h-24 z-40 bg-gradient-to-t from-paper via-paper/85 to-transparent pointer-events-none"
            />

            <motion.div
              key="scroll-controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-6 left-4 z-50 flex items-center rounded-full bg-charcoal/60 backdrop-blur-sm text-white"
            >
              {scrollZone !== "top" && (
                <button onClick={() => scrollTo("top")} aria-label="Scroll to top"
                  className="w-8 h-8 flex items-center justify-center">
                  <ChevronUp size={16} />
                </button>
              )}
              {scrollZone === "middle" && (
                <div className="w-px h-4 bg-white/20" />
              )}
              {scrollZone !== "bottom" && (
                <button onClick={() => scrollTo("bottom")} aria-label="Scroll to bottom"
                  className="w-8 h-8 flex items-center justify-center">
                  <ChevronDown size={16} />
                </button>
              )}
            </motion.div>

            <motion.div
              key="nav"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3"
            >
              <button
                onClick={goPrev}
                className={`transition-opacity ${canGoPrev ? "opacity-60 active:opacity-100" : "opacity-0 pointer-events-none"}`}
                aria-label="Previous"
              >
                <ChevronLeft size={16} className="text-charcoal" />
              </button>

              <span className="text-xs tracking-widest tabular-nums text-charcoal/50">
                {currentIndex} / {articles.length}
              </span>

              <button
                onClick={goNext}
                className={`transition-opacity ${canGoNext ? "opacity-60 active:opacity-100" : "opacity-0 pointer-events-none"}`}
                aria-label="Next"
              >
                <ChevronRight size={16} className="text-charcoal" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Magazine share button — mirrors TOC on the left, cover only */}
      <motion.button
        onClick={handleMagazineShare}
        animate={{ opacity: onCover && controlsVisible ? 1 : 0, scale: onCover && controlsVisible ? 1 : 0.8 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-6 left-4 z-50 w-10 h-10 rounded-full bg-charcoal/60 backdrop-blur-sm text-white flex items-center justify-center safe-bottom"
        aria-label="Share magazine"
        style={{ pointerEvents: onCover && controlsVisible ? "auto" : "none" }}
      >
        {shareCopied ? <Check size={18} /> : <Share2 size={18} />}
      </motion.button>

      <TableOfContents articles={articles} currentIndex={currentIndex} onSelect={handleArticleSelect} onSectionSelect={handleSectionSelect} open={tocOpen} onOpenChange={handleTocOpenChange} visible={controlsVisible} />
    </div>
  );
}
