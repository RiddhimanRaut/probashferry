"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useAuthContext } from "@/providers/AuthProvider";

export default function CommentForm({ onSubmit }: { onSubmit: (text: string, isAnonymous: boolean) => Promise<void> }) {
  const { user, promptSignIn } = useAuthContext();
  const [text, setText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    if (!user) { promptSignIn(); return; }
    setSubmitting(true);
    await onSubmit(text, isAnonymous);
    setText("");
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={user ? "Add a comment..." : "Sign in to comment"}
          className="flex-1 bg-charcoal/5 rounded-full px-4 py-2 text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          disabled={submitting}
        />
        <button type="submit" disabled={!text.trim() || submitting} className="p-2 text-terracotta disabled:text-charcoal/20 transition-colors" aria-label="Post comment">
          <Send size={18} />
        </button>
      </div>
      {user && (
        <label className="flex items-center gap-2 mt-2 ml-4 text-xs text-charcoal/40 cursor-pointer">
          <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="rounded border-charcoal/20 text-terracotta focus:ring-terracotta/30" />
          Post anonymously
        </label>
      )}
    </form>
  );
}
