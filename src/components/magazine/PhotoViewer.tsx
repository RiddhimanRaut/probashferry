"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw } from "lucide-react";

interface PhotoViewerProps {
  src: string;
  caption: string;
  onClose: () => void;
}

export default function PhotoViewer({ src, caption, onClose }: PhotoViewerProps) {
  const [landscape, setLandscape] = useState(false);
  const [showCaption, setShowCaption] = useState(false);

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
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const toggleLandscape = useCallback(() => {
    setLandscape((prev) => !prev);
  }, []);

  const handleTap = useCallback(() => {
    setShowCaption((prev) => !prev);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] bg-black"
      onClick={handleTap}
    >
      {/* Photo — fills entire screen */}
      <div
        className={`absolute inset-0 transition-transform duration-300 ease-out ${landscape ? "rotate-90" : ""}`}
        style={landscape ? { transformOrigin: "center center", width: "100vh", height: "100vw", top: "50%", left: "50%", marginTop: "-50vw", marginLeft: "-50vh", position: "absolute" } : undefined}
      >
        <img
          src={src}
          alt={caption}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Controls — visible on tap (with caption) */}
      <AnimatePresence>
        {showCaption && (
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
                <p className="text-white/80 text-sm max-w-2xl leading-relaxed">{caption}</p>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
