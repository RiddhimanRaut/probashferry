"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { MessageCircle, Maximize2 } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Article, Photo } from "@/types/article";
import LikeButton from "@/components/article/LikeButton";
import ShareButton from "@/components/article/ShareButton";
import CommentsSection from "@/components/article/CommentsSection";
import ReadingProgress from "@/components/article/ReadingProgress";
import PhotoViewer from "./PhotoViewer";
import Footer from "@/components/layout/Footer";
import KanthaDivider from "@/components/ui/KanthaDivider";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useLike } from "@/hooks/useLike";
import { useAuthContext } from "@/providers/AuthProvider";
import { formatDate } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  PhotoCard — a single photo with its own like / comment / share     */
/* ------------------------------------------------------------------ */

interface PhotoCardProps {
  photo: Photo;
  index: number;
  articleSlug: string;
  articleTitle: string;
  articleAuthor: string;
  doubleTapEvent: { x: number; y: number; id: number } | null;
  cardRef: (el: HTMLDivElement | null) => void;
}

function PhotoCard({ photo, index, articleSlug, articleTitle, articleAuthor, doubleTapEvent, cardRef }: PhotoCardProps) {
  const photoId = `${articleSlug}-photo-${index}`;
  const { liked, likeCount, commentCount, toggleLike } = useLike(photoId);
  const { user, promptSignIn } = useAuthContext();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const lastHandledTap = useRef(0);

  const likedRef = useRef(liked);
  likedRef.current = liked;
  const toggleLikeRef = useRef(toggleLike);
  toggleLikeRef.current = toggleLike;
  const userRef = useRef(user);
  userRef.current = user;
  const promptSignInRef = useRef(promptSignIn);
  promptSignInRef.current = promptSignIn;

  useEffect(() => {
    if (!doubleTapEvent || doubleTapEvent.id === lastHandledTap.current) return;
    lastHandledTap.current = doubleTapEvent.id;
    if (!userRef.current) { promptSignInRef.current(); return; }
    if (!likedRef.current) void toggleLikeRef.current();
  }, [doubleTapEvent]);

  const artist = photo.artist || articleAuthor;
  const fullCaption = photo.title
    ? `${photo.title}, ${artist}. ${photo.caption}`
    : photo.caption; // plain-text version for alt text

  return (
    <div ref={cardRef} className="mb-2">
      <div className="relative group cursor-pointer" onClick={() => setViewerOpen(true)}>
        <img
          src={photo.src}
          alt={fullCaption}
          className="w-full"
          loading={index > 1 ? "lazy" : undefined}
        />
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 size={14} />
        </div>
      </div>

      <AnimatePresence>
        {viewerOpen && (
          <PhotoViewer
            src={photo.src}
            caption={photo.caption}
            title={photo.title}
            author={artist}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="px-5 md:px-8 mt-3">
        {(photo.title || photo.caption) && (
          <p className="text-sm text-white/50 font-body leading-relaxed max-w-2xl mb-3">
            {photo.title && <><span className="text-white/70 font-medium">{photo.title}</span>{artist && <>, <em className="text-white/60">{artist}</em></>}. </>}
            {photo.caption}
          </p>
        )}

        <div className="flex items-center gap-4 py-2 border-t border-white/10">
          <LikeButton liked={liked} likeCount={likeCount} toggleLike={toggleLike} variant="dark" />
          <button
            onClick={() => setCommentsOpen((o) => !o)}
            className="flex items-center gap-2 group transition-colors"
            aria-label="Toggle comments"
          >
            <MessageCircle
              size={21}
              className={commentsOpen ? "text-terracotta" : "text-white/40 group-hover:text-terracotta/60 transition-colors"}
            />
            <span className={`text-sm tabular-nums ${commentsOpen ? "text-terracotta font-medium" : "text-white/40"}`}>
              {commentCount > 0 ? commentCount : ""}
            </span>
          </button>
          <ShareButton slug={articleSlug} title={`${photo.title || articleTitle}, by ${artist}`} excerpt={photo.caption} variant="dark" />
        </div>

        {commentsOpen && (
          <div className="bg-paper rounded-xl p-4 mb-4">
            <CommentsSection articleId={photoId} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PhotoGalleryPanel                                                   */
/* ------------------------------------------------------------------ */

interface PhotoGalleryPanelProps {
  article: Article;
  isActive: boolean;
  doubleTapEvent: { x: number; y: number; id: number } | null;
}

export default function PhotoGalleryPanel({ article, isActive, doubleTapEvent }: PhotoGalleryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progress = useReadingProgress(scrollRef);

  const setScrollParent = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const parent = node.parentElement;
      if (parent) (scrollRef as React.MutableRefObject<HTMLElement | null>).current = parent;
    }
  }, []);

  const photos = article.photos || [];
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [perCardTap, setPerCardTap] = useState<(({ x: number; y: number; id: number } | null))[]>(
    () => photos.map(() => null)
  );

  // Route global doubleTapEvent to the card whose bounds contain the tap
  useEffect(() => {
    if (!doubleTapEvent) return;
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    for (let i = 0; i < cardRefs.current.length; i++) {
      const el = cardRefs.current[i];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (doubleTapEvent.y >= rect.top && doubleTapEvent.y <= rect.bottom) {
        setPerCardTap((prev) => {
          const next = [...prev];
          next[i] = doubleTapEvent;
          return next;
        });
        break;
      }
    }
  }, [doubleTapEvent]);

  return (
    <div className="relative bg-charcoal min-h-full" ref={setScrollParent}>
      {isActive && <ReadingProgress progress={progress} />}

      {/* Cover hero */}
      <div className="relative h-[70vh] min-h-[400px] overflow-hidden">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-charcoal/20 to-charcoal" />
        <div className="absolute bottom-0 left-0 right-0 px-5 md:px-8 pb-8">
          <span className="inline-block text-xs font-medium uppercase tracking-wider text-mustard/80 bg-mustard/10 px-2 py-1 rounded">
            Photography
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-white mt-3 mb-2">
            {article.title}
          </h2>
          <p className="text-white/60 text-base mb-2">{article.excerpt}</p>
          <div className="flex items-center gap-3 text-sm text-white/40">
            <span>{article.author}</span>
            <span>&middot;</span>
            <span>{formatDate(article.date)}</span>
            <span>&middot;</span>
            <span>{photos.length} photos</span>
          </div>
          <KanthaDivider className="mt-4 opacity-30" />
        </div>
      </div>

      {/* Photo gallery */}
      <div className="bg-charcoal py-4">
        {photos.map((photo, index) => (
          <PhotoCard
            key={index}
            photo={photo}
            index={index}
            articleSlug={article.slug}
            articleTitle={article.title}
            articleAuthor={article.author}
            doubleTapEvent={perCardTap[index]}
            cardRef={(el) => { cardRefs.current[index] = el; }}
          />
        ))}
      </div>

      {/* Optional prose from MDX body */}
      {article.html && article.html.trim() && (
        <div className="bg-charcoal px-5 md:px-8 lg:px-16 max-w-3xl mx-auto pb-4">
          <div
            className="prose prose-lg prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        </div>
      )}

      <div className="px-5 md:px-8 max-w-3xl mx-auto pb-4">
        <Footer />
      </div>
    </div>
  );
}
