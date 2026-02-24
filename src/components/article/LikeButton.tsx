"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useLike } from "@/hooks/useLike";
import { useAuthContext } from "@/providers/AuthProvider";
import { getFirebaseDb } from "@/lib/firebase/config";

export default function LikeButton({ articleId }: { articleId: string }) {
  const { liked, likeCount, toggleLike: _toggleLike } = useLike(articleId);
  void _toggleLike;
  const { user, promptSignIn } = useAuthContext();
  const [debug, setDebug] = useState<string | null>(null);

  const handleClick = async () => {
    if (!user) {
      setDebug("no user → prompting sign in");
      promptSignIn();
      return;
    }

    // Direct minimal Firestore test — bypasses all hook logic
    setDebug(`pid=${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID} uid=${user.uid.slice(0, 6)} writing…`);
    try {
      const db = getFirebaseDb();
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout after 8s")), 8000));
      const write = setDoc(doc(db, "articles", articleId), {
        likeCount: 1,
        commentCount: 0,
        createdAt: serverTimestamp(),
      }, { merge: true });
      await Promise.race([write, timeout]);
      setDebug("write succeeded!");
    } catch (e: unknown) {
      setDebug(`FAIL: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div>
      <button onClick={handleClick} className="flex items-center gap-2 group transition-colors" aria-label={liked ? "Unlike" : "Like"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={liked ? "liked" : "unliked"}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <Heart
              size={22}
              className={liked ? "fill-sindoor text-sindoor" : "text-charcoal/40 group-hover:text-sindoor/60 transition-colors"}
            />
          </motion.div>
        </AnimatePresence>
        <span className={`text-sm tabular-nums ${liked ? "text-sindoor font-medium" : "text-charcoal/50"}`}>
          {likeCount > 0 ? likeCount : ""}
        </span>
      </button>
      {debug && <p className="text-[10px] text-red-500 mt-1 break-all">{debug}</p>}
    </div>
  );
}
