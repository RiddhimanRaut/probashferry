"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "probashferry-panel";

export function useSwipe(totalPanels: number) {
  const [state, setState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const index = parseInt(saved, 10);
        if (!isNaN(index) && index >= 0 && index < totalPanels) {
          return { currentIndex: index, direction: 0 };
        }
      }
    }
    return { currentIndex: 0, direction: 0 };
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, String(state.currentIndex));
  }, [state.currentIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= totalPanels) return;
      setState((prev) => ({
        currentIndex: index,
        direction: index > prev.currentIndex ? 1 : -1,
      }));
    },
    [totalPanels]
  );

  const goNext = useCallback(() => {
    setState((prev) => {
      if (prev.currentIndex >= totalPanels - 1) return prev;
      return { currentIndex: prev.currentIndex + 1, direction: 1 };
    });
  }, [totalPanels]);

  const goPrev = useCallback(() => {
    setState((prev) => {
      if (prev.currentIndex <= 0) return prev;
      return { currentIndex: prev.currentIndex - 1, direction: -1 };
    });
  }, []);

  return { currentIndex: state.currentIndex, direction: state.direction, goTo, goNext, goPrev };
}
