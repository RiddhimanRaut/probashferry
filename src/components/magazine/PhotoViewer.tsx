"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw } from "lucide-react";

interface PhotoViewerProps {
  src: string;
  caption: string;
  title?: string;
  author?: string;
  onClose: () => void;
  scrollable?: boolean;
  images?: string[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export default function PhotoViewer({ src, caption, title, author, onClose, scrollable, images, initialIndex, onIndexChange }: PhotoViewerProps) {
  const [landscape, setLandscape] = useState(false);
  const [showCaption, setShowCaption] = useState(false);

  // Multi-image navigation
  const hasImages = !!(images && images.length > 1);
  const [imageIndex, setImageIndex] = useState(initialIndex ?? 0);
  const displaySrc = hasImages ? images![imageIndex] : src;

  // Zoom & pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Refs for gesture tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastTapTime = useRef(0);
  const hasPannedOrZoomed = useRef(false);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);

  // Refs so touch handlers always see current values without re-binding
  const landscapeRef = useRef(landscape);
  landscapeRef.current = landscape;
  const scrollableRef = useRef(!!scrollable);
  scrollableRef.current = !!scrollable;
  const hasImagesRef = useRef(hasImages);
  hasImagesRef.current = hasImages;
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const imageIndexRef = useRef(imageIndex);
  imageIndexRef.current = imageIndex;
  const imgNaturalSize = useRef({ w: 0, h: 0 });
  const imgElRef = useRef<HTMLImageElement>(null);

  const zoomed = scale > 1.05;

  // Reset zoom when changing images
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    imgNaturalSize.current = { w: 0, h: 0 };
    onIndexChange?.(imageIndex);
  }, [imageIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset scroll position when zooming in (transform pan takes over)
  useEffect(() => {
    if (scrollable && zoomed && scrollWrapperRef.current) {
      scrollWrapperRef.current.scrollTop = 0;
    }
  }, [scrollable, zoomed]);

  // Clamp translation so the image doesn't pan beyond its edges
  const clampTranslate = useCallback(
    (x: number, y: number, s: number) => {
      const isLand = landscapeRef.current;
      // In landscape the container dimensions are swapped
      const vw = isLand ? window.innerHeight : window.innerWidth;
      const vh = isLand ? window.innerWidth : window.innerHeight;

      const maxX = ((s - 1) * vw) / 2;

      // For non-scrollable (object-cover, h-full): renderedH = vh, bounds are symmetric.
      // For scrollable: image starts at top of container, so bounds are asymmetric.
      // General formula derived from keeping scaled content within viewport:
      //   minY = vh - renderedH * (1 + s) / 2   (pan up to see bottom)
      //   maxY = renderedH * (s - 1) / 2         (pan down — 0 at scale=1)
      // When renderedH = vh these collapse to the symmetric ±(s-1)*vh/2.
      // Read natural size from ref first, fall back to onLoad cache, then DOM element
      let nat = imgNaturalSize.current;
      if (nat.w === 0 && imgElRef.current) {
        nat = { w: imgElRef.current.naturalWidth, h: imgElRef.current.naturalHeight };
        if (nat.w > 0) imgNaturalSize.current = nat; // cache for next time
      }
      const renderedH = scrollableRef.current && nat.w > 0 ? vw * (nat.h / nat.w) : vh;
      const minY = vh - renderedH * (1 + s) / 2;
      const maxY = renderedH * (s - 1) / 2;

      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(minY, Math.min(maxY, y)),
      };
    },
    []
  );

  // Reset zoom
  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  // Push history state so Android back gesture / browser back closes the viewer
  useEffect(() => {
    window.history.pushState({ photoViewer: true }, "");
    const handlePopState = () => {
      onClose();
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      // If the viewer is closing for a reason other than back (e.g. tap X, Escape),
      // clean up the history entry we pushed
      if (window.history.state?.photoViewer) {
        window.history.back();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Try native orientation lock on mobile when landscape is toggled
  useEffect(() => {
    const orient = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    if (!landscape) {
      try { orient?.unlock(); } catch { /* unsupported */ }
      return;
    }
    try { orient?.lock?.("landscape").catch(() => {}); } catch { /* unsupported */ }
    return () => {
      try { orient?.unlock(); } catch { /* unsupported */ }
    };
  }, [landscape]);

  // Keyboard: Escape to close/reset, arrow keys for image navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomed) {
          resetZoom();
        } else {
          onClose();
        }
      } else if (hasImages && !zoomed) {
        if (e.key === "ArrowRight") {
          setImageIndex((i) => Math.min(images!.length - 1, i + 1));
        } else if (e.key === "ArrowLeft") {
          setImageIndex((i) => Math.max(0, i - 1));
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, zoomed, resetZoom, hasImages, images]);

  // Scroll-wheel zoom (desktop)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      setScale((prev) => {
        const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev + delta * prev));
        if (next <= 1.05) {
          setTranslate({ x: 0, y: 0 });
          return 1;
        }
        // Adjust translate to zoom toward cursor
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left - rect.width / 2;
        const cy = e.clientY - rect.top - rect.height / 2;
        const ratio = 1 - next / prev;
        setTranslate((t) => clampTranslate(t.x + cx * ratio, t.y + cy * ratio, next));
        return next;
      });
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [clampTranslate]);

  // Touch gestures: pinch-to-zoom + pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getDistance = (t1: Touch, t2: Touch) =>
      Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

    // Allow pan when zoomed OR in scrollable+landscape (native scroll doesn't work with CSS rotation)
    const canPan = () => zoomed || (scrollableRef.current && landscapeRef.current);

    const handleTouchStart = (e: TouchEvent) => {
      hasPannedOrZoomed.current = false;
      swipeStart.current = null;

      if (e.touches.length === 2) {
        // Pinch start
        e.preventDefault();
        pinchStartDist.current = getDistance(e.touches[0], e.touches[1]);
        pinchStartScale.current = scale;
      } else if (e.touches.length === 1 && canPan()) {
        // Pan start
        isPanning.current = true;
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        translateStart.current = { ...translate };
      } else if (e.touches.length === 1 && hasImagesRef.current && !canPan()) {
        // Track potential swipe for multi-image navigation
        swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch move
        e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        const newScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, pinchStartScale.current * (dist / pinchStartDist.current))
        );
        hasPannedOrZoomed.current = true;
        if (newScale <= 1.05) {
          setScale(1);
          setTranslate({ x: 0, y: 0 });
        } else {
          setScale(newScale);
        }
      } else if (e.touches.length === 1 && isPanning.current) {
        // Prevent browser pull-to-refresh / overscroll during pan
        e.preventDefault();
        // Pan move — swap axes in landscape since container is rotated 90° CW
        const rawDx = e.touches[0].clientX - panStart.current.x;
        const rawDy = e.touches[0].clientY - panStart.current.y;
        const dx = landscapeRef.current ? rawDy : rawDx;
        const dy = landscapeRef.current ? -rawDx : rawDy;
        if (Math.abs(rawDx) > 5 || Math.abs(rawDy) > 5) {
          hasPannedOrZoomed.current = true;
        }
        const clamped = clampTranslate(
          translateStart.current.x + dx,
          translateStart.current.y + dy,
          scale
        );
        setTranslate(clamped);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isPanning.current = false;

        // Check for horizontal swipe to navigate images
        if (swipeStart.current && hasImagesRef.current && !canPan()) {
          const touch = e.changedTouches[0];
          const dx = touch.clientX - swipeStart.current.x;
          const dy = touch.clientY - swipeStart.current.y;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            hasPannedOrZoomed.current = true; // suppress the click/tap handler
            const imgs = imagesRef.current!;
            const idx = imageIndexRef.current;
            if (dx < 0 && idx < imgs.length - 1) setImageIndex(idx + 1);
            else if (dx > 0 && idx > 0) setImageIndex(idx - 1);
          }
          swipeStart.current = null;
        }
      }
      // If down to 1 finger during pinch, start pan from that finger
      if (e.touches.length === 1 && canPan()) {
        isPanning.current = true;
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        translateStart.current = { ...translate };
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scale, translate, zoomed, clampTranslate]);

  const toggleLandscape = useCallback(() => {
    resetZoom();
    setLandscape((prev) => !prev);
  }, [resetZoom]);

  const handleTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Ignore taps that were part of a pan/zoom gesture
    if (hasPannedOrZoomed.current) {
      hasPannedOrZoomed.current = false;
      return;
    }

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    lastTapTime.current = now;

    // Double-tap: toggle zoom
    if (timeSinceLastTap < 300) {
      if (zoomed) {
        resetZoom();
      } else {
        setScale(2.5);
      }
      return;
    }

    // Single tap (when not zoomed): toggle caption
    if (!zoomed) {
      setShowCaption((prev) => !prev);
    }
  }, [zoomed, resetZoom]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] bg-black overscroll-contain"
      onClick={handleTap}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      ref={containerRef}
    >
      {/* Photo — fills entire screen, supports zoom & pan */}
      <div
        ref={scrollable ? scrollWrapperRef : undefined}
        className={`absolute inset-0 ${landscape ? "rotate-90" : ""}`}
        style={{
          ...(landscape
            ? {
                transformOrigin: "center center",
                width: "100vh",
                height: "100vw",
                top: "50%",
                left: "50%",
                marginTop: "-50vw",
                marginLeft: "-50vh",
                position: "absolute" as const,
              }
            : {}),
          ...(scrollable && !zoomed && !landscape
            ? { overflowY: "auto" as const, overflowX: "hidden" as const, overscrollBehavior: "contain" as const }
            : {}),
          transition: zoomed ? "none" : "transform 0.3s ease-out",
        }}
      >
        <div
          style={{
            width: "100%",
            ...(scrollable
              ? { minHeight: "100%", display: "flex", flexDirection: "column" as const }
              : { height: "100%" }),
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: zoomed ? "none" : "transform 0.3s ease-out",
          }}
        >
          <img
            ref={imgElRef}
            src={displaySrc}
            alt={caption}
            className={scrollable ? "w-full" : "w-full h-full object-cover"}
            style={scrollable ? { margin: "auto 0" } : undefined}
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              imgNaturalSize.current = { w: img.naturalWidth, h: img.naturalHeight };
            }}
          />
        </div>
      </div>

      {/* Zoom indicator */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[71] bg-black/60 backdrop-blur-sm text-white/70 text-xs px-3 py-1.5 rounded-full pointer-events-none"
          >
            {Math.round(scale * 100)}%
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multi-image dot indicators */}
      {hasImages && !zoomed && (
        <div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[71] flex items-center gap-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          {images!.map((_, i) => (
            <button
              key={i}
              onClick={() => setImageIndex(i)}
              className="p-1"
              aria-label={`Panel ${i + 1}`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: i === imageIndex ? "#D4A843" : "rgba(255,255,255,0.3)",
                  transform: i === imageIndex ? "scale(1.3)" : "scale(1)",
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Controls — visible on tap (with caption), hidden when zoomed */}
      <AnimatePresence>
        {showCaption && !zoomed && (
          <>
            {/* Top bar with buttons */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="fixed top-0 left-0 right-0 z-[71] p-4 flex justify-end gap-2 bg-gradient-to-b from-black/60 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={toggleLandscape}
                className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors ${
                  landscape ? "bg-mustard/80 text-charcoal" : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
                aria-label={landscape ? "Exit landscape mode" : "Landscape mode"}
              >
                <RotateCcw size={18} />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/20 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </motion.div>

            {/* Bottom caption bar */}
            {caption && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed bottom-0 left-0 right-0 z-[71] p-5 bg-gradient-to-t from-black/70 to-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-white/80 text-sm max-w-2xl leading-relaxed">
                  {title && <><span className="font-medium">{title}</span>{author && <>, <em className="text-white/60">{author}</em></>}. </>}
                  {caption}
                </p>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
