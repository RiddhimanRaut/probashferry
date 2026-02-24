"use client";

import { useState, useEffect, useCallback } from "react";
import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  increment,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/config";
import { useAuthContext } from "@/providers/AuthProvider";

export function useLike(articleId: string) {
  const { user } = useAuthContext();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    const db = getFirebaseDb();
    const ref = doc(db, "articles", articleId);
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setLikeCount(snap.data().likeCount || 0);
    });
  }, [articleId]);

  useEffect(() => {
    if (!user) { setLiked(false); return; }
    const db = getFirebaseDb();
    const ref = doc(db, "likes", articleId, "users", user.uid);
    return onSnapshot(ref, (snap) => setLiked(snap.exists()));
  }, [articleId, user]);

  const toggleLike = useCallback(async () => {
    if (!user) return false;
    const db = getFirebaseDb();
    const articleRef = doc(db, "articles", articleId);
    const likeRef = doc(db, "likes", articleId, "users", user.uid);
    try {
      const snap = await getDoc(articleRef);
      if (!snap.exists()) {
        await setDoc(articleRef, { likeCount: 0, commentCount: 0, createdAt: serverTimestamp() });
      }
      if (liked) {
        await deleteDoc(likeRef);
        await setDoc(articleRef, { likeCount: increment(-1) }, { merge: true });
      } else {
        await setDoc(likeRef, { userId: user.uid, timestamp: serverTimestamp() });
        await setDoc(articleRef, { likeCount: increment(1) }, { merge: true });
      }
      return !liked;
    } catch (error) {
      console.error("Like error:", error);
      return liked;
    }
  }, [user, articleId, liked]);

  return { liked, likeCount, toggleLike };
}
