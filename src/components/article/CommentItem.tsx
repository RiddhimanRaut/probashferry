"use client";

import Avatar from "@/components/ui/Avatar";
import { CommentDoc } from "@/types/firebase";
import { timeAgo } from "@/lib/utils";

export default function CommentItem({ comment }: { comment: CommentDoc }) {
  const date = comment.timestamp?.toDate?.() || new Date();
  return (
    <div className="flex gap-3 py-3">
      <Avatar src={comment.isAnonymous ? null : comment.userPhoto} name={comment.userName} size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-charcoal">{comment.userName}</span>
          <span className="text-xs text-charcoal/40">{timeAgo(date)}</span>
        </div>
        <p className="text-sm text-charcoal/75 mt-0.5 break-words">{comment.text}</p>
      </div>
    </div>
  );
}
