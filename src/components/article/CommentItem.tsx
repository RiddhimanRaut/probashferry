"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { CommentDoc } from "@/types/firebase";
import { timeAgo } from "@/lib/utils";

interface CommentItemProps {
  comment: CommentDoc;
  isOwner: boolean;
  onEdit: (text: string) => Promise<void>;
  onDelete: () => Promise<void>;
  variant?: "light" | "dark";
}

export default function CommentItem({ comment, isOwner, onEdit, onDelete, variant = "light" }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [busy, setBusy] = useState(false);
  const dark = variant === "dark";

  const date = typeof comment.timestamp === "string" ? new Date(comment.timestamp) : new Date();

  const handleSave = async () => {
    if (!editText.trim() || editText.trim() === comment.text) { setEditing(false); return; }
    setBusy(true);
    await onEdit(editText.trim());
    setEditing(false);
    setBusy(false);
  };

  const handleDelete = async () => {
    setBusy(true);
    await onDelete();
    setBusy(false);
  };

  return (
    <div className="flex gap-3 py-3 group">
      <Avatar src={comment.isAnonymous ? null : comment.userPhoto} name={comment.userName} size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-sm font-medium ${dark ? "text-white" : "text-charcoal"}`}>{comment.userName}</span>
          <span className={`text-xs ${dark ? "text-white/40" : "text-charcoal/40"}`}>{timeAgo(date)}</span>
          {comment.edited && <span className={`text-xs italic ${dark ? "text-white/30" : "text-charcoal/30"}`}>(edited)</span>}
        </div>

        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
              className={`flex-1 rounded-full px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/30 ${
                dark ? "bg-white/10 text-white" : "bg-charcoal/5 text-charcoal"
              }`}
              disabled={busy}
              autoFocus
            />
            <button onClick={handleSave} disabled={busy} className="p-1 text-terracotta hover:text-terracotta-dark transition-colors" aria-label="Save">
              <Check size={15} />
            </button>
            <button onClick={() => setEditing(false)} disabled={busy} className={`p-1 transition-colors ${dark ? "text-white/30 hover:text-white/60" : "text-charcoal/30 hover:text-charcoal/60"}`} aria-label="Cancel">
              <X size={15} />
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <p className={`text-sm mt-0.5 break-words flex-1 ${dark ? "text-white/75" : "text-charcoal/75"}`}>{comment.text}</p>
            {isOwner && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                <button onClick={() => { setEditText(comment.text); setEditing(true); }} className={`p-1 transition-colors ${dark ? "text-white/25 hover:text-white/60" : "text-charcoal/25 hover:text-charcoal/60"}`} aria-label="Edit">
                  <Pencil size={13} />
                </button>
                <button onClick={handleDelete} disabled={busy} className={`p-1 transition-colors ${dark ? "text-white/25 hover:text-red-400" : "text-charcoal/25 hover:text-red-500"}`} aria-label="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
