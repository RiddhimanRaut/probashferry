"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDoc, commitLikeToggle } from "@/lib/firebase/firestore-rest";
import { useAuthContext } from "@/providers/AuthProvider";

export function useLike(articleId: string) {
  const { user } = useAuthContext();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const busyRef = useRef(false);
  const likedRef = useRef(false);
  const suppressPollRef = useRef(false);
  const suppressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep likedRef in sync when state changes from external sources (polls)
  useEffect(() => {
    if (!suppressPollRef.current) likedRef.current = liked;
  }, [liked]);

  // Poll article stats
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      if (suppressPollRef.current) return;
      try {
        const data = await getDoc(`articles/${articleId}`);
        if (!cancelled && data && !suppressPollRef.current) {
          setLikeCount(Math.max(0, (data.likeCount as number) || 0));
          setCommentCount((data.commentCount as number) || 0);
        }
      } catch { /* ignore polling errors */ }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [articleId]);

  // Check if user has liked
  useEffect(() => {
    if (!user) { setLiked(false); return; }
    let cancelled = false;
    const check = async () => {
      if (suppressPollRef.current) return;
      try {
        const data = await getDoc(`likes/${articleId}/users/${user.uid}`);
        if (!cancelled && !suppressPollRef.current) setLiked(data !== null);
      } catch { /* ignore */ }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [articleId, user]);

  const toggleLike = useCallback(async () => {
    if (!user || busyRef.current) return false;
    busyRef.current = true;
    suppressPollRef.current = true;

    // Clear any pending suppress-release so it doesn't fire mid-toggle
    if (suppressTimerRef.current) {
      clearTimeout(suppressTimerRef.current);
      suppressTimerRef.current = null;
    }

    const wasLiked = likedRef.current;

    // Optimistic update — sync ref immediately so next toggle reads correct state
    likedRef.current = !wasLiked;
    setLiked(!wasLiked);
    setLikeCount((prev) => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      // Single atomic commit: like-doc write + server-side count increment
      await commitLikeToggle(
        `articles/${articleId}`,
        `likes/${articleId}/users/${user.uid}`,
        user.uid,
        !wasLiked
      );
      return !wasLiked;
    } catch (error) {
      // Revert on failure — sync ref back too
      likedRef.current = wasLiked;
      setLiked(wasLiked);
      setLikeCount((prev) => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      console.error("Like error:", error);
    } finally {
      busyRef.current = false;
      // Keep polls suppressed so server-side writes propagate before next read
      suppressTimerRef.current = setTimeout(() => {
        suppressPollRef.current = false;
        suppressTimerRef.current = null;
      }, 3000);
    }
  }, [user, articleId]);

  return { liked, likeCount, commentCount, toggleLike };
}
