"use client";

import { useState, useEffect, useCallback } from "react";
import { getDoc, setDoc, mergeDoc, addDoc, deleteDoc, queryDocs } from "@/lib/firebase/firestore-rest";
import { useAuthContext } from "@/providers/AuthProvider";
import { CommentDoc } from "@/types/firebase";

export function useComments(articleId: string) {
  const { user } = useAuthContext();
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Poll comments
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const docs = await queryDocs(`comments/${articleId}/messages`, "timestamp", "DESCENDING");
        if (!cancelled) {
          setComments(docs.map(({ id, ...fields }) => ({ id, ...fields } as unknown as CommentDoc)));
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [articleId]);

  const addComment = useCallback(
    async (text: string, isAnonymous: boolean) => {
      if (!user || !text.trim()) return;
      try {
        // Ensure article doc exists
        const article = await getDoc(`articles/${articleId}`);
        if (!article) {
          await setDoc(`articles/${articleId}`, { likeCount: 0, commentCount: 0 });
        }

        await addDoc(`comments/${articleId}/messages`, {
          text: text.trim(),
          userId: user.uid,
          userName: isAnonymous ? "Anonymous" : user.displayName || "User",
          userPhoto: isAnonymous ? null : user.photoURL,
          isAnonymous,
          timestamp: new Date().toISOString(),
        });

        const currentCount = (article?.commentCount as number) || 0;
        await mergeDoc(`articles/${articleId}`, { commentCount: currentCount + 1 });

        // Refresh comments immediately
        const docs = await queryDocs(`comments/${articleId}/messages`, "timestamp", "DESCENDING");
        setComments(docs.map(({ id, ...fields }) => ({ id, ...fields } as unknown as CommentDoc)));
      } catch (error) {
        console.error("Comment error:", error);
      }
    },
    [user, articleId]
  );

  const refreshComments = useCallback(async () => {
    try {
      const docs = await queryDocs(`comments/${articleId}/messages`, "timestamp", "DESCENDING");
      setComments(docs.map(({ id, ...fields }) => ({ id, ...fields } as unknown as CommentDoc)));
    } catch { /* ignore */ }
  }, [articleId]);

  const editComment = useCallback(
    async (commentId: string, newText: string) => {
      if (!user || !newText.trim()) return;
      try {
        await mergeDoc(`comments/${articleId}/messages/${commentId}`, {
          text: newText.trim(),
          edited: true,
        });
        await refreshComments();
      } catch (error) {
        console.error("Edit comment error:", error);
      }
    },
    [user, articleId, refreshComments]
  );

  const removeComment = useCallback(
    async (commentId: string) => {
      if (!user) return;
      try {
        await deleteDoc(`comments/${articleId}/messages/${commentId}`);
        const article = await getDoc(`articles/${articleId}`);
        const currentCount = (article?.commentCount as number) || 1;
        await mergeDoc(`articles/${articleId}`, { commentCount: Math.max(0, currentCount - 1) });
        await refreshComments();
      } catch (error) {
        console.error("Delete comment error:", error);
      }
    },
    [user, articleId, refreshComments]
  );

  return { comments, loading, addComment, editComment, removeComment };
}
