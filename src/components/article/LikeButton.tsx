"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLike } from "@/hooks/useLike";
import { useAuthContext } from "@/providers/AuthProvider";

export default function LikeButton({ articleId }: { articleId: string }) {
  const { liked, likeCount, toggleLike } = useLike(articleId);
  const { user, promptSignIn } = useAuthContext();
  const [debug, setDebug] = useState<string | null>(null);

  const handleClick = async () => {
    if (!user) {
      setDebug("no user → prompting sign in");
      promptSignIn();
      return;
    }
    setDebug(`SDK toggling…`);
    try {
      const result = await Promise.race([
        toggleLike(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("SDK timeout 8s")), 8000)),
      ]);
      setDebug(`SDK done: liked=${result}`);
    } catch (e: unknown) {
      setDebug(`SDK FAIL: ${e instanceof Error ? e.message : String(e)}`);
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
