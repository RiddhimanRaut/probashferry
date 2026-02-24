"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  setDoc,
  increment,
  getDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import { useAuthContext } from "@/providers/AuthProvider";
import { CommentDoc } from "@/types/firebase";

export function useComments(articleId: string) {
  const { user } = useAuthContext();
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getFirebaseDb();
    const ref = collection(db, "comments", articleId, "messages");
    const q = query(ref, orderBy("timestamp", "desc"));
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as CommentDoc)));
      setLoading(false);
    });
  }, [articleId]);

  const addComment = useCallback(
    async (text: string, isAnonymous: boolean) => {
      if (!user || !text.trim()) return;
      const db = getFirebaseDb();
      const articleRef = doc(db, "articles", articleId);
      const commentsRef = collection(db, "comments", articleId, "messages");
      try {
        const snap = await getDoc(articleRef);
        if (!snap.exists()) {
          await setDoc(articleRef, { likeCount: 0, commentCount: 0, createdAt: serverTimestamp() });
        }
        await addDoc(commentsRef, {
          text: text.trim(),
          userId: user.uid,
          userName: isAnonymous ? "Anonymous" : user.displayName || "User",
          userPhoto: isAnonymous ? null : user.photoURL,
          isAnonymous,
          timestamp: serverTimestamp(),
        });
        await setDoc(articleRef, { commentCount: increment(1) }, { merge: true });
      } catch (error) {
        console.error("Comment error:", error);
      }
    },
    [user, articleId]
  );

  return { comments, loading, addComment };
}
