"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { X, RotateCcw } from "lucide-react";

interface PhotoViewerProps {
  src: string;
  caption: string;
  onClose: () => void;
}

export default function PhotoViewer({ src, caption, onClose }: PhotoViewerProps) {
  const [landscape, setLandscape] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[70] bg-black flex items-center justify-center"
      onClick={onClose}
    >
      {/* Controls */}
      <div className="fixed top-4 right-4 z-[71] flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); toggleLandscape(); }}
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
      </div>

      {/* Photo */}
      <div
        className={`transition-transform duration-300 ease-out flex items-center justify-center ${
          landscape ? "rotate-90" : ""
        }`}
        style={landscape ? { width: "100vh", height: "100vw" } : { width: "100%", height: "100%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={caption}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Caption */}
      {!landscape && caption && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80 to-transparent"
        >
          <p className="text-white/60 text-sm max-w-2xl leading-relaxed">{caption}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
