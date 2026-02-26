"use client";

import { Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthContext } from "@/providers/AuthProvider";

interface LikeButtonProps {
  liked: boolean;
  likeCount: number;
  toggleLike: () => Promise<boolean | undefined>;
  variant?: "light" | "dark";
}

export default function LikeButton({ liked, likeCount, toggleLike, variant = "light" }: LikeButtonProps) {
  const { user, promptSignIn } = useAuthContext();

  const handleClick = async () => {
    if (!user) { promptSignIn(); return; }
    await toggleLike();
  };

  const unlikedColor = variant === "dark" ? "text-white/40 group-hover:text-sindoor/60" : "text-charcoal/40 group-hover:text-sindoor/60";
  const unlikedCount = variant === "dark" ? "text-white/40" : "text-charcoal/50";

  return (
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
            className={liked ? "fill-sindoor text-sindoor" : `${unlikedColor} transition-colors`}
          />
        </motion.div>
      </AnimatePresence>
      <span className={`text-sm tabular-nums ${liked ? "text-sindoor font-medium" : unlikedCount}`}>
        {likeCount > 0 ? likeCount : ""}
      </span>
    </button>
  );
}
