"use client";

import { useRef, useCallback } from "react";
import { Article } from "@/types/article";
import ArticleHeader from "@/components/article/ArticleHeader";
import LikeButton from "@/components/article/LikeButton";
import DoubleTapOverlay from "@/components/article/DoubleTapOverlay";
import CommentsSection from "@/components/article/CommentsSection";
import ReadingProgress from "@/components/article/ReadingProgress";
import Footer from "@/components/layout/Footer";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useLike } from "@/hooks/useLike";
import { useAuthContext } from "@/providers/AuthProvider";

interface ArticlePanelProps {
  article: Article;
  isActive: boolean;
}

export default function ArticlePanel({ article, isActive }: ArticlePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progress = useReadingProgress(scrollRef);
  const { liked, toggleLike } = useLike(article.slug);
  const { user, signIn } = useAuthContext();

  const handleDoubleTap = useCallback(async () => {
    if (!user) { signIn(); return; }
    if (!liked) await toggleLike();
  }, [user, signIn, liked, toggleLike]);

  return (
    <div className="panel relative bg-paper" ref={scrollRef}>
      {isActive && <ReadingProgress progress={progress} />}

      <div className="relative h-[40vh] min-h-[250px] overflow-hidden">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-paper" />
      </div>

      <DoubleTapOverlay onDoubleTap={handleDoubleTap}>
        <div className="px-5 md:px-8 lg:px-16 max-w-3xl mx-auto -mt-16 relative z-10">
          <ArticleHeader article={article} />

          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />

          <div className="flex items-center gap-4 mt-8 py-4 border-t border-charcoal/5">
            <LikeButton articleId={article.slug} />
          </div>

          <CommentsSection articleId={article.slug} />
          <Footer />
        </div>
      </DoubleTapOverlay>
    </div>
  );
}
