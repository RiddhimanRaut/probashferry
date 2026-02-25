"use client";

import { useState, useCallback } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  slug: string;
  title: string;
  excerpt: string;
}

export default function ShareButton({ slug, title, excerpt }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const url = `https://probashferry.vercel.app/read/${slug}`;

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: excerpt, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [title, excerpt, url]);

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 group transition-colors"
      aria-label="Share article"
    >
      {copied ? (
        <Check size={21} className="text-terracotta transition-colors" />
      ) : (
        <Share2
          size={21}
          className="text-charcoal/40 group-hover:text-terracotta/60 transition-colors"
        />
      )}
      {copied && (
        <span className="text-sm text-terracotta font-medium">Copied!</span>
      )}
    </button>
  );
}
