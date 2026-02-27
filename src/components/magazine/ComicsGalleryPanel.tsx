"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, useMotionValue, animate as fmAnimate, useInView, AnimatePresence } from "framer-motion";
import { MessageCircle, Maximize2, LayoutGrid } from "lucide-react";
import { Article, Photo } from "@/types/article";
import LikeButton from "@/components/article/LikeButton";
import ShareButton from "@/components/article/ShareButton";
import CommentsSection from "@/components/article/CommentsSection";
import ReadingProgress from "@/components/article/ReadingProgress";
import PhotoViewer from "./PhotoViewer";
import Footer from "@/components/layout/Footer";
import KanthaDivider from "@/components/ui/KanthaDivider";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useLike } from "@/hooks/useLike";
import { useAuthContext } from "@/providers/AuthProvider";
import { formatDate } from "@/lib/utils";
import { tagColor } from "@/lib/tags";

/* ------------------------------------------------------------------ */
/*  ComicCarousel — horizontal swipe carousel for multi-panel comics    */
/* ------------------------------------------------------------------ */

interface ComicCarouselProps {
  panels: string[];
  alt: string;
  currentPanel: number;
  onPanelChange: (index: number) => void;
  onPanelTap?: (panelIndex: number) => void;
}

function ComicCarousel({ panels, alt, currentPanel, onPanelChange, onPanelTap }: ComicCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const x = useMotionValue(0);
  const panelAtDragStart = useRef(0);
  const dragEndTime = useRef(0);

  // Total slides = individual panels + 1 composite "full page" view
  const totalSlides = panels.length + 1;

  // Measure container width with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Animate x when currentPanel or containerWidth changes
  useEffect(() => {
    if (!containerWidth) return;
    fmAnimate(x, -currentPanel * containerWidth, {
      type: "spring",
      stiffness: 300,
      damping: 30,
    });
  }, [currentPanel, containerWidth, x]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <motion.div
        className="flex cursor-grab active:cursor-grabbing"
        style={{ x, width: containerWidth * totalSlides || "100%" }}
        drag="x"
        dragElastic={0.15}
        dragMomentum={false}
        onDragStart={() => {
          panelAtDragStart.current = currentPanel;
        }}
        onDragEnd={(_, info) => {
          dragEndTime.current = Date.now();
          const dx = info.offset.x;
          const vx = info.velocity.x;
          let next = panelAtDragStart.current;
          if (dx < -50 || vx < -500) {
            next = Math.min(totalSlides - 1, next + 1);
          } else if (dx > 50 || vx > 500) {
            next = Math.max(0, next - 1);
          }
          onPanelChange(next);
        }}
      >
        {panels.map((src, i) => (
          <div
            key={i}
            className="flex-shrink-0 cursor-pointer"
            style={{ width: containerWidth || "100%" }}
            onClick={() => {
              if (Date.now() - dragEndTime.current < 200) return;
              onPanelTap?.(i);
            }}
          >
            <img
              src={src}
              alt={`${alt} — panel ${i + 1}`}
              className="w-full pointer-events-none"
              loading={i > 0 ? "lazy" : undefined}
              draggable={false}
            />
          </div>
        ))}

        {/* Composite "full page" slide — all panels arranged together */}
        <div
          className="flex-shrink-0 p-3 flex flex-col gap-1 bg-white/5"
          style={{ width: containerWidth || "100%" }}
        >
          {panels.length <= 2 ? (
            /* 2 panels: vertical stack */
            <div className="flex flex-col gap-1">
              {panels.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${alt} — panel ${i + 1}`}
                  className="w-full pointer-events-none rounded-sm"
                  draggable={false}
                />
              ))}
            </div>
          ) : (
            /* 3-4 panels: 2-column grid */
            <div className="grid grid-cols-2 gap-1">
              {panels.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${alt} — panel ${i + 1}`}
                  className="w-full pointer-events-none rounded-sm"
                  draggable={false}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {Array.from({ length: totalSlides }, (_, i) => {
          const isLast = i === panels.length;
          const isActive = i === currentPanel;
          return (
            <button
              key={i}
              onClick={() => onPanelChange(i)}
              className="p-1"
              aria-label={isLast ? "View all panels" : `Go to panel ${i + 1}`}
            >
              {isLast ? (
                <motion.div
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    opacity: isActive ? 1 : 0.4,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <LayoutGrid size={10} color={isActive ? "#D4A843" : "rgba(255,255,255,0.6)"} />
                </motion.div>
              ) : (
                <motion.div
                  animate={{
                    scale: isActive ? 1.3 : 1,
                    backgroundColor: isActive ? "#D4A843" : "rgba(255,255,255,0.25)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-2 h-2 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ComicCard — a single comic with carousel or image + actions         */
/* ------------------------------------------------------------------ */

interface ComicCardProps {
  photo: Photo;
  index: number;
  articleSlug: string;
  articleTitle: string;
  articleAuthor: string;
  doubleTapEvent: { x: number; y: number; id: number } | null;
  cardRef: (el: HTMLDivElement | null) => void;
  getControlsVisible?: () => boolean;
}

function ComicCard({ photo, index, articleSlug, articleTitle, articleAuthor, doubleTapEvent, cardRef, getControlsVisible }: ComicCardProps) {
  const photoId = `${articleSlug}-photo-${index}`;
  const { liked, likeCount, commentCount, toggleLike } = useLike(photoId);
  const { user, promptSignIn } = useAuthContext();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPanel, setCurrentPanel] = useState(0);
  const lastHandledTap = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const likedRef = useRef(liked);
  likedRef.current = liked;
  const toggleLikeRef = useRef(toggleLike);
  toggleLikeRef.current = toggleLike;
  const userRef = useRef(user);
  userRef.current = user;
  const promptSignInRef = useRef(promptSignIn);
  promptSignInRef.current = promptSignIn;

  // Scroll-triggered entrance animation
  const animRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(animRef, { once: true, margin: "-10% 0px" });

  const hasMultiplePanels = photo.panels && photo.panels.length > 1;
  const panels = photo.panels || [photo.src];

  useEffect(() => {
    if (!doubleTapEvent || doubleTapEvent.id === lastHandledTap.current) return;
    lastHandledTap.current = doubleTapEvent.id;
    if (singleTapTimer.current) {
      clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
    }
    if (!userRef.current) { promptSignInRef.current(); return; }
    if (!likedRef.current) void toggleLikeRef.current();
  }, [doubleTapEvent]);

  const artist = photo.artist || articleAuthor;

  // Determine which image to show in full-screen viewer
  // When on composite (last) slide, show first panel
  const viewerSrc = currentPanel < panels.length ? panels[currentPanel] : panels[0];

  return (
    <div ref={cardRef} className="py-8 md:py-12" data-likeable>
      <div ref={animRef}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto px-4 md:px-6"
        >
          {/* Comic panel container */}
          <div className="bg-[#141420] rounded-xl border border-white/5 overflow-hidden">
            {hasMultiplePanels ? (
              <ComicCarousel
                panels={panels}
                alt={photo.title || photo.caption}
                currentPanel={currentPanel}
                onPanelChange={setCurrentPanel}
                onPanelTap={() => {
                  if (getControlsVisible?.()) return;
                  if (singleTapTimer.current) {
                    clearTimeout(singleTapTimer.current);
                    singleTapTimer.current = null;
                    return;
                  }
                  singleTapTimer.current = setTimeout(() => {
                    singleTapTimer.current = null;
                    setViewerOpen(true);
                  }, 400);
                }}
              />
            ) : (
              <div
                className="relative group cursor-pointer"
                onClick={() => {
                  if (getControlsVisible?.()) return;
                  if (singleTapTimer.current) {
                    clearTimeout(singleTapTimer.current);
                    singleTapTimer.current = null;
                    return;
                  }
                  singleTapTimer.current = setTimeout(() => {
                    singleTapTimer.current = null;
                    setViewerOpen(true);
                  }, 400);
                }}
              >
                <img
                  src={photo.src}
                  alt={photo.title || photo.caption}
                  className="w-full"
                  loading={index > 0 ? "lazy" : undefined}
                />
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Maximize2 size={14} />
                </div>
              </div>
            )}

            {/* Caption area */}
            <div className="px-4 py-4">
              {photo.title && (
                <h3 className="font-heading text-lg text-white/90">{photo.title}</h3>
              )}
              {artist && (
                <p className="text-sm text-white/50 mt-0.5">{artist}</p>
              )}
              {(photo.flavor || photo.type) && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {photo.flavor && (
                    <span
                      className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ color: tagColor(photo.flavor), backgroundColor: `${tagColor(photo.flavor)}15` }}
                    >
                      {photo.flavor}
                    </span>
                  )}
                  {photo.type && (
                    <span
                      className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ color: tagColor(photo.type), backgroundColor: `${tagColor(photo.type)}15` }}
                    >
                      {photo.type}
                    </span>
                  )}
                </div>
              )}
              {photo.caption && (
                <p className="text-sm text-white/40 leading-relaxed mt-2">{photo.caption}</p>
              )}

              {/* Action bar */}
              <div className="flex items-center gap-4 py-3 mt-3 border-t border-white/5">
                <LikeButton liked={liked} likeCount={likeCount} toggleLike={toggleLike} variant="dark" />
                <button
                  onClick={() => setCommentsOpen((o) => !o)}
                  className="flex items-center gap-2 group transition-colors"
                  aria-label="Toggle comments"
                >
                  <MessageCircle
                    size={21}
                    className={commentsOpen ? "text-terracotta" : "text-white/40 group-hover:text-terracotta/60 transition-colors"}
                  />
                  <span className={`text-sm tabular-nums ${commentsOpen ? "text-terracotta font-medium" : "text-white/40"}`}>
                    {commentCount > 0 ? commentCount : ""}
                  </span>
                </button>
                <ShareButton slug={articleSlug} title={`${photo.title || articleTitle}, by ${artist}`} excerpt={photo.caption} variant="dark" photoIndex={index} />
              </div>

              {commentsOpen && (
                <div className="mb-2 text-left">
                  <CommentsSection articleId={photoId} variant="dark" />
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {viewerOpen && (
            <PhotoViewer
              src={viewerSrc}
              caption={photo.caption}
              title={photo.title}
              author={artist}
              onClose={() => setViewerOpen(false)}
              scrollable
              images={hasMultiplePanels ? panels : undefined}
              initialIndex={currentPanel < panels.length ? currentPanel : 0}
              onIndexChange={(i) => setCurrentPanel(i)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ComicsGalleryPanel                                                  */
/* ------------------------------------------------------------------ */

interface ComicsGalleryPanelProps {
  article: Article;
  isActive: boolean;
  doubleTapEvent: { x: number; y: number; id: number } | null;
  initialPhotoIndex?: number;
  scrollToCard?: { index: number; nonce: number } | null;
  getControlsVisible?: () => boolean;
  onActiveCardChange?: (index: number) => void;
}

export default function ComicsGalleryPanel({ article, isActive, doubleTapEvent, initialPhotoIndex, scrollToCard, getControlsVisible, onActiveCardChange }: ComicsGalleryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progress = useReadingProgress(scrollRef);
  const initialScrollDone = useRef(false);

  const setScrollParent = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const parent = node.parentElement;
      if (parent) (scrollRef as React.MutableRefObject<HTMLElement | null>).current = parent;
    }
  }, []);

  // Track which card is most visible via IntersectionObserver
  useEffect(() => {
    const refs = cardRefs.current;
    if (!refs.length || !onActiveCardChange) return;
    const ratios = new Map<number, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = refs.indexOf(entry.target as HTMLDivElement);
          if (idx !== -1) ratios.set(idx, entry.intersectionRatio);
        }
        let best = -1, bestRatio = 0;
        ratios.forEach((r, i) => { if (r > bestRatio) { best = i; bestRatio = r; } });
        if (best !== -1) onActiveCardChange(best);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    for (const el of refs) { if (el) observer.observe(el); }
    return () => observer.disconnect();
  }, [onActiveCardChange, article.photos]);

  const photos = article.photos || [];
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [perCardTap, setPerCardTap] = useState<(({ x: number; y: number; id: number } | null))[]>(
    () => photos.map(() => null)
  );

  // Route global doubleTapEvent to the card whose bounds contain the tap
  useEffect(() => {
    if (!doubleTapEvent) return;
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    for (let i = 0; i < cardRefs.current.length; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (doubleTapEvent.y >= rect.top && doubleTapEvent.y <= rect.bottom) {
        setPerCardTap((prev) => {
          const next = [...prev];
          next[i] = doubleTapEvent;
          return next;
        });
        break;
      }
    }
  }, [doubleTapEvent]);

  // Scroll to specific comic when arriving via shared link or TOC (on mount)
  useEffect(() => {
    if (initialPhotoIndex == null || initialScrollDone.current) return;
    initialScrollDone.current = true;
    // 500ms delay: wait for panel slide animation (200ms) + layout settle
    const timer = setTimeout(() => {
      const el = cardRefs.current[initialPhotoIndex];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
    return () => clearTimeout(timer);
  }, [initialPhotoIndex]);

  // Scroll to card from TOC when already on this panel
  useEffect(() => {
    if (!scrollToCard) return;
    const timer = setTimeout(() => {
      const el = cardRefs.current[scrollToCard.index];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
    return () => clearTimeout(timer);
  }, [scrollToCard]);

  return (
    <div className="relative bg-[#0D0D1A] min-h-full" ref={setScrollParent}>
      {isActive && <ReadingProgress progress={progress} />}

      {/* Cover hero */}
      <div className="relative h-[70vh] min-h-[400px] overflow-hidden">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D0D1A]/20 to-[#0D0D1A]" />
        <div className="absolute bottom-0 left-0 right-0 px-5 md:px-8 pb-8">
          <span className="inline-block text-xs font-medium uppercase tracking-wider text-[#D4A843]/80 bg-[#D4A843]/10 px-2 py-1 rounded">
            Comics
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white mt-3 mb-2">
            {article.title}
          </h2>
          <p className="text-white/60 text-base mb-2">{article.excerpt}</p>
          <div className="flex items-center gap-3 text-sm text-white/40">
            <span>{article.author}</span>
            <span>&middot;</span>
            <span>{formatDate(article.date)}</span>
            <span>&middot;</span>
            <span>{photos.length} comics</span>
          </div>
          <KanthaDivider className="mt-4 opacity-30" />
        </div>
      </div>

      {/* Comics gallery */}
      <div className="bg-[#0D0D1A] py-4">
        {photos.map((photo, index) => (
          <ComicCard
            key={index}
            photo={photo}
            index={index}
            articleSlug={article.slug}
            articleTitle={article.title}
            articleAuthor={article.author}
            doubleTapEvent={perCardTap[index]}
            getControlsVisible={getControlsVisible}
            cardRef={(el) => { cardRefs.current[index] = el; }}
          />
        ))}
      </div>

      {/* Optional prose from MDX body */}
      {article.html && article.html.trim() && (
        <div className="bg-[#0D0D1A] px-5 md:px-8 lg:px-16 max-w-3xl lg:max-w-4xl mx-auto pb-4">
          <div
            className="prose prose-lg prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        </div>
      )}

      <div className="px-5 md:px-8 max-w-3xl lg:max-w-4xl mx-auto pb-4">
        <Footer />
      </div>
    </div>
  );
}
