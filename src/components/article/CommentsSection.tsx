"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useComments } from "@/hooks/useComments";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import KanthaDivider from "@/components/ui/KanthaDivider";

export default function CommentsSection({ articleId }: { articleId: string }) {
  const { comments, loading, addComment } = useComments(articleId);

  return (
    <div className="mt-8">
      <KanthaDivider />
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle size={18} className="text-charcoal/40" />
        <h3 className="text-sm font-medium text-charcoal/60 uppercase tracking-wider">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>
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
