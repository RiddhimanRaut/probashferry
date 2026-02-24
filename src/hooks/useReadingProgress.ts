"use client";

import { useState, useEffect, RefObject } from "react";

export function useReadingProgress(containerRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handle = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      setProgress(max <= 0 ? 0 : Math.min(1, scrollTop / max));
    };
    el.addEventListener("scroll", handle, { passive: true });
    return () => el.removeEventListener("scroll", handle);
  }, [containerRef]);

  return progress;
}
