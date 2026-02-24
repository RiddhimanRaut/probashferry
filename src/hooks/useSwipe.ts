"use client";

import { useState, useCallback } from "react";

export function useSwipe(totalPanels: number) {
  const [state, setState] = useState({ currentIndex: 0, direction: 0 });

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
