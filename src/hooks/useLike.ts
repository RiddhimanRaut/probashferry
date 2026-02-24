"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getDoc, setDoc, mergeDoc, deleteDoc } from "@/lib/firebase/firestore-rest";
import { useAuthContext } from "@/providers/AuthProvider";

export function useLike(articleId: string) {
  const { user } = useAuthContext();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const busyRef = useRef(false);

  // Poll article stats
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const data = await getDoc(`articles/${articleId}`);
        if (!cancelled && data) {
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
      try {
        const data = await getDoc(`likes/${articleId}/users/${user.uid}`);
        if (!cancelled) setLiked(data !== null);
      } catch { /* ignore */ }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [articleId, user]);

  const toggleLike = useCallback(async () => {
    if (!user || busyRef.current) return false;
    busyRef.current = true;
    const wasLiked = liked;

    // Optimistic update — reflect in UI immediately
    setLiked(!wasLiked);
    setLikeCount((prev) => wasLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      const article = await getDoc(`articles/${articleId}`);
      if (!article) {
        await setDoc(`articles/${articleId}`, { likeCount: 0, commentCount: 0 });
      }
      const currentCount = (article?.likeCount as number) || 0;

      if (wasLiked) {
        await deleteDoc(`likes/${articleId}/users/${user.uid}`);
        await mergeDoc(`articles/${articleId}`, { likeCount: Math.max(0, currentCount - 1) });
      } else {
        await setDoc(`likes/${articleId}/users/${user.uid}`, { userId: user.uid });
        await mergeDoc(`articles/${articleId}`, { likeCount: currentCount + 1 });
      }
      return !wasLiked;
    } catch (error) {
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount((prev) => wasLiked ? prev + 1 : Math.max(0, prev - 1));
      console.error("Like error:", error);
      throw error;
    } finally {
      busyRef.current = false;
    }
  }, [user, articleId, liked]);

  return { liked, likeCount, commentCount, toggleLike };
}
