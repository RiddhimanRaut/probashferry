"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "@/hooks/useComments";
import { useAuthContext } from "@/providers/AuthProvider";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

interface CommentsSectionProps {
  articleId: string;
  variant?: "light" | "dark";
}

export default function CommentsSection({ articleId, variant = "light" }: CommentsSectionProps) {
  const { comments, loading, addComment, editComment, removeComment } = useComments(articleId);
  const { user } = useAuthContext();
  const dark = variant === "dark";

  return (
    <div className="mt-2 mb-4">
      <CommentForm onSubmit={addComment} variant={variant} />
      <div className={`mt-4 divide-y ${dark ? "divide-white/10" : "divide-charcoal/5"}`}>
        {loading ? (
          <p className={`text-sm py-4 ${dark ? "text-white/30" : "text-charcoal/30"}`}>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className={`text-sm py-4 ${dark ? "text-white/30" : "text-charcoal/30"}`}>Be the first to comment</p>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <CommentItem
                  comment={comment}
                  isOwner={user?.uid === comment.userId}
                  onEdit={(text) => editComment(comment.id, text)}
                  onDelete={() => removeComment(comment.id)}
                  variant={variant}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
