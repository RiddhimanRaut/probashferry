"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLike } from "@/hooks/useLike";
import { useAuthContext } from "@/providers/AuthProvider";

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

    const pid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    setDebug(`pid=${pid} uid=${user.uid.slice(0, 6)} testing…`);

    // Test 1: raw fetch to Firestore REST API (bypasses SDK entirely)
    try {
      const token = await user.getIdToken();
      const res = await Promise.race([
        fetch(
          `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/articles/${articleId}`,
          {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fields: {
                likeCount: { integerValue: "1" },
                commentCount: { integerValue: "0" },
              },
            }),
          }
        ),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("fetch timeout 8s")), 8000)),
      ]);
      const data = await res.json();
      if (res.ok) {
        setDebug(`REST OK! ${res.status}`);
      } else {
        setDebug(`REST ${res.status}: ${JSON.stringify(data.error?.message || data).slice(0, 200)}`);
      }
    } catch (e: unknown) {
      setDebug(`REST FAIL: ${e instanceof Error ? e.message : String(e)}`);
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
