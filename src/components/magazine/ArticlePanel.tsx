"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { Article } from "@/types/article";
import ArticleHeader from "@/components/article/ArticleHeader";
import LikeButton from "@/components/article/LikeButton";
import CommentsSection from "@/components/article/CommentsSection";
import ReadingProgress from "@/components/article/ReadingProgress";
import Footer from "@/components/layout/Footer";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useLike } from "@/hooks/useLike";
import { useAuthContext } from "@/providers/AuthProvider";

interface ArticlePanelProps {
  article: Article;
  isActive: boolean;
  doubleTapEvent: { x: number; y: number; id: number } | null;
}

export default function ArticlePanel({ article, isActive, doubleTapEvent }: ArticlePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progress = useReadingProgress(scrollRef);

  const setScrollParent = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const parent = node.parentElement;
      if (parent) (scrollRef as React.MutableRefObject<HTMLElement | null>).current = parent;
    }
  }, []);
  const { liked, commentCount, toggleLike } = useLike(article.slug);
  const { user, promptSignIn } = useAuthContext();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const lastHandledTap = useRef(0);

  // React to double-tap events from MagazineViewer
  useEffect(() => {
    if (!doubleTapEvent || doubleTapEvent.id === lastHandledTap.current) return;
    lastHandledTap.current = doubleTapEvent.id;
    if (!user) { promptSignIn(); return; }
    if (!liked) void toggleLike();
  }, [doubleTapEvent, user, promptSignIn, liked, toggleLike]);

  return (
    <div className="relative bg-paper min-h-full" ref={setScrollParent}>
      {isActive && <ReadingProgress progress={progress} />}

      <div className="relative h-[40vh] min-h-[250px] overflow-hidden">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-paper" />
      </div>

      <div className="px-5 md:px-8 lg:px-16 max-w-3xl mx-auto -mt-16 relative z-10">
        <ArticleHeader article={article} />

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />

        <div className="flex items-center gap-4 mt-8 py-4 border-t border-charcoal/5">
          <LikeButton articleId={article.slug} />
          <button
            onClick={() => setCommentsOpen((o) => !o)}
            className="flex items-center gap-2 group transition-colors"
            aria-label="Toggle comments"
          >
            <MessageCircle
              size={21}
              className={commentsOpen ? "text-terracotta" : "text-charcoal/40 group-hover:text-terracotta/60 transition-colors"}
            />
            <span className={`text-sm tabular-nums ${commentsOpen ? "text-terracotta font-medium" : "text-charcoal/50"}`}>
              {commentCount > 0 ? commentCount : ""}
            </span>
          </button>
        </div>

        {commentsOpen && <CommentsSection articleId={article.slug} />}
        <Footer />
      </div>
    </div>
  );
}
