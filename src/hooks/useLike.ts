"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDoc, setDoc, deleteDoc, incrementField } from "@/lib/firebase/firestore-rest";
import { useAuthContext } from "@/providers/AuthProvider";

export function useLike(articleId: string) {
  const { user } = useAuthContext();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const busyRef = useRef(false);
  const likedRef = useRef(false);
  const suppressPollRef = useRef(false);

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
          setLikeCount((data.likeCount as number) || 0);
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

    const wasLiked = likedRef.current;

    // Optimistic update — sync ref immediately so next toggle reads correct state
    likedRef.current = !wasLiked;
    setLiked(!wasLiked);
    setLikeCount((prev) => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      // Ensure article doc exists
      const article = await getDoc(`articles/${articleId}`);
      if (!article) {
        await setDoc(`articles/${articleId}`, { likeCount: 0, commentCount: 0 });
      }

      if (wasLiked) {
        await deleteDoc(`likes/${articleId}/users/${user.uid}`);
        await incrementField(`articles/${articleId}`, "likeCount", -1);
      } else {
        await setDoc(`likes/${articleId}/users/${user.uid}`, { userId: user.uid });
        await incrementField(`articles/${articleId}`, "likeCount", 1);
      }
      return !wasLiked;
    } catch (error) {
      // Revert on failure — sync ref back too
      likedRef.current = wasLiked;
      setLiked(wasLiked);
      setLikeCount((prev) => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      console.error("Like error:", error);
      throw error;
    } finally {
      busyRef.current = false;
      // Keep polls suppressed so server-side writes propagate before next read
      setTimeout(() => { suppressPollRef.current = false; }, 3000);
    }
  }, [user, articleId]);

  return { liked, likeCount, commentCount, toggleLike };
}
