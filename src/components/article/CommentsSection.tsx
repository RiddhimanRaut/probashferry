"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useComments } from "@/hooks/useComments";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";

export default function CommentsSection({ articleId }: { articleId: string }) {
  const { comments, loading, addComment } = useComments(articleId);

  return (
    <div className="mt-2 mb-4">
      <CommentForm onSubmit={addComment} />
      <div className="mt-4 divide-y divide-charcoal/5">
        {loading ? (
          <p className="text-sm text-charcoal/30 py-4">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-charcoal/30 py-4">Be the first to comment</p>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <CommentItem comment={comment} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
