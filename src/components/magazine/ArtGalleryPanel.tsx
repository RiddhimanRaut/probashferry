"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { MessageCircle, Maximize2 } from "lucide-react";
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
/*  ArtCard — a single artwork with spotlight, placard, and actions     */
/* ------------------------------------------------------------------ */

interface ArtCardProps {
  photo: Photo;
  index: number;
  articleSlug: string;
  articleTitle: string;
  articleAuthor: string;
  doubleTapEvent: { x: number; y: number; id: number } | null;
  cardRef: (el: HTMLDivElement | null) => void;
  getControlsVisible?: () => boolean;
}

function ArtCard({ photo, index, articleSlug, articleTitle, articleAuthor, doubleTapEvent, cardRef, getControlsVisible }: ArtCardProps) {
  const photoId = `${articleSlug}-photo-${index}`;
  const { liked, likeCount, commentCount, toggleLike } = useLike(photoId);
  const { user, promptSignIn } = useAuthContext();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const lastHandledTap = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const likedRef = useRef(liked);
  likedRef.current = liked;
  const toggleLikeRef = useRef(toggleLike);
  toggleLikeRef.current = toggleLike;
  const userRef = useRef(user);
  userRef.current = user;
  const promptSignInRef = useRef(promptSignIn);
  promptSignInRef.current = promptSignIn;

  // Scroll-triggered entrance animation
  const animRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(animRef, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (!doubleTapEvent || doubleTapEvent.id === lastHandledTap.current) return;
    lastHandledTap.current = doubleTapEvent.id;
    if (singleTapTimer.current) {
      clearTimeout(singleTapTimer.current);
      singleTapTimer.current = null;
    }
    if (!userRef.current) { promptSignInRef.current(); return; }
    if (!likedRef.current) void toggleLikeRef.current();
  }, [doubleTapEvent]);

  const artist = photo.artist || articleAuthor;
  const fullCaption = photo.title
    ? `${photo.title}, ${artist}. ${photo.caption}`
    : photo.caption;

  return (
    <div ref={cardRef} className="py-12 md:py-20" data-likeable>
      <div ref={animRef}>
        {/* Spotlight background + artwork image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative max-w-3xl mx-auto px-5 md:px-8"
        >
          {/* Radial spotlight glow */}
          <div
            className="absolute inset-0 -inset-y-16 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 70% at 50% 45%, rgba(255,248,235,0.08) 0%, rgba(255,248,235,0.03) 40%, transparent 70%)",
            }}
          />

          <div
            className="relative group cursor-pointer"
            onClick={() => {
              if (getControlsVisible?.()) return;
              if (singleTapTimer.current) {
                clearTimeout(singleTapTimer.current);
                singleTapTimer.current = null;
                return;
              }
              singleTapTimer.current = setTimeout(() => {
                singleTapTimer.current = null;
                setViewerOpen(true);
              }, 400);
            }}
          >
            <img
              src={photo.src}
              alt={fullCaption}
              className="w-full shadow-2xl shadow-black/40"
              loading={index > 0 ? "lazy" : undefined}
            />
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={14} />
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {viewerOpen && (
            <PhotoViewer
              src={photo.src}
              caption={photo.caption}
              title={photo.title}
              author={artist}
              onClose={() => setViewerOpen(false)}
              scrollable
            />
          )}
        </AnimatePresence>

        {/* Museum placard */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          className="max-w-3xl mx-auto px-5 md:px-8 mt-6 text-center"
        >
          {photo.title && (
            <h3 className="font-heading text-lg text-white/90">{photo.title}</h3>
          )}
          {artist && (
            <p className="italic text-white/60 mt-1">{artist}</p>
          )}
          {photo.medium && (
            <p className="text-xs uppercase tracking-wider text-white/35 mt-1">{photo.medium}</p>
          )}
          {photo.caption && (
            <p className="text-sm text-white/50 leading-relaxed mt-3 max-w-xl mx-auto">{photo.caption}</p>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-center gap-6 py-4 mt-4 border-t border-white/5">
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
            <ShareButton slug={articleSlug} title={`${photo.title || articleTitle}, by ${artist}`} excerpt={photo.caption} variant="dark" photoIndex={index} />
          </div>

          {commentsOpen && (
            <div className="mb-4 text-left">
              <CommentsSection articleId={photoId} variant="dark" />
            </div>
          )}
        </motion.div>
      </div>

      {/* Divider between artworks */}
      <div className="max-w-3xl mx-auto mt-8">
        <div className="border-t border-white/5" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ArtGalleryPanel                                                     */
/* ------------------------------------------------------------------ */

interface ArtGalleryPanelProps {
  article: Article;
  isActive: boolean;
  doubleTapEvent: { x: number; y: number; id: number } | null;
  initialPhotoIndex?: number;
  getControlsVisible?: () => boolean;
}

export default function ArtGalleryPanel({ article, isActive, doubleTapEvent, initialPhotoIndex, getControlsVisible }: ArtGalleryPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const progress = useReadingProgress(scrollRef);
  const initialScrollDone = useRef(false);

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

  // Scroll to specific artwork when arriving via shared link
  useEffect(() => {
    if (initialPhotoIndex == null || initialScrollDone.current) return;
    initialScrollDone.current = true;
    const timer = setTimeout(() => {
      const el = cardRefs.current[initialPhotoIndex];
      const scrollEl = scrollRef.current;
      if (el && scrollEl) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [initialPhotoIndex]);

  return (
    <div className="relative bg-[#0A0A0A] min-h-full" ref={setScrollParent}>
      {isActive && <ReadingProgress progress={progress} />}

      {/* Cover hero */}
      <div className="relative h-[70vh] min-h-[400px] overflow-hidden">
        <img
          src={article.coverImage}
          alt={article.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/20 to-[#0A0A0A]" />
        <div className="absolute bottom-0 left-0 right-0 px-5 md:px-8 pb-8">
          <span className="inline-block text-xs font-medium uppercase tracking-wider text-mustard/80 bg-mustard/10 px-2 py-1 rounded">
            Art
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
            <span>{photos.length} artworks</span>
          </div>
          <KanthaDivider className="mt-4 opacity-30" />
        </div>
      </div>

      {/* Art gallery */}
      <div className="bg-[#0A0A0A]">
        {photos.map((photo, index) => (
          <ArtCard
            key={index}
            photo={photo}
            index={index}
            articleSlug={article.slug}
            articleTitle={article.title}
            articleAuthor={article.author}
            doubleTapEvent={perCardTap[index]}
            getControlsVisible={getControlsVisible}
            cardRef={(el) => { cardRefs.current[index] = el; }}
          />
        ))}
      </div>

      {/* Optional prose from MDX body */}
      {article.html && article.html.trim() && (
        <div className="bg-[#0A0A0A] px-5 md:px-8 lg:px-16 max-w-3xl lg:max-w-4xl mx-auto pb-4">
          <div
            className="prose prose-lg prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.html }}
          />
        </div>
      )}

      <div className="px-5 md:px-8 max-w-3xl lg:max-w-4xl mx-auto pb-4">
        <Footer />
      </div>
    </div>
  );
}
