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
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;

export default function PhotoViewer({ src, caption, title, author, onClose }: PhotoViewerProps) {
  const [landscape, setLandscape] = useState(false);
  const [showCaption, setShowCaption] = useState(false);

  // Zoom & pan state
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  // Refs for gesture tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const pinchStartDist = useRef(0);
  const pinchStartScale = useRef(1);
  const panStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastTapTime = useRef(0);
  const hasPannedOrZoomed = useRef(false);

  const zoomed = scale > 1.05;

  // Clamp translation so the image doesn't pan beyond its edges
  const clampTranslate = useCallback(
    (x: number, y: number, s: number) => {
      const maxX = ((s - 1) * window.innerWidth) / 2;
      const maxY = ((s - 1) * window.innerHeight) / 2;
      return {
        x: Math.max(-maxX, Math.min(maxX, x)),
        y: Math.max(-maxY, Math.min(maxY, y)),
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

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomed) {
          resetZoom();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, zoomed, resetZoom]);

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

    const handleTouchStart = (e: TouchEvent) => {
      hasPannedOrZoomed.current = false;

      if (e.touches.length === 2) {
        // Pinch start
        e.preventDefault();
        pinchStartDist.current = getDistance(e.touches[0], e.touches[1]);
        pinchStartScale.current = scale;
      } else if (e.touches.length === 1 && zoomed) {
        // Pan start (only when zoomed)
        isPanning.current = true;
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        translateStart.current = { ...translate };
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
        // Pan move
        const dx = e.touches[0].clientX - panStart.current.x;
        const dy = e.touches[0].clientY - panStart.current.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
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
      }
      // If down to 1 finger during pinch, start pan from that finger
      if (e.touches.length === 1 && zoomed) {
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
      className="fixed inset-0 z-[70] bg-black"
      onClick={handleTap}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      ref={containerRef}
    >
      {/* Photo — fills entire screen, supports zoom & pan */}
      <div
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
          transition: zoomed ? "none" : "transform 0.3s ease-out",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            transformOrigin: "center center",
            transition: zoomed ? "none" : "transform 0.3s ease-out",
          }}
        >
          <img
            src={src}
            alt={caption}
            className="w-full h-full object-cover"
            draggable={false}
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
