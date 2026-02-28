"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { List, X, Heart, Users, ChevronRight, ChevronDown, PenLine, Camera, BookImage, Palette, Mail } from "lucide-react";
import { ArticleMeta } from "@/types/article";
import { tagColor } from "@/lib/tags";
import { getDoc } from "@/lib/firebase/firestore-rest";

const SECTIONS = ["Essays", "Photography", "Comics", "Art"] as const;

export const SECTION_ICONS: Record<string, typeof PenLine> = {
  Essays: PenLine,
  Photography: Camera,
  Comics: BookImage,
  Art: Palette,
};

interface TableOfContentsProps {
  articles: ArticleMeta[];
  editorial?: ArticleMeta | null;
  articleOffset: number;
  currentIndex: number;
  activeCardIndex?: number;
  onSelect: (index: number, photoIndex?: number) => void;
  onSectionSelect?: (section: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visible: boolean;
}

export default function TableOfContents({ articles, editorial, articleOffset, currentIndex, activeCardIndex, onSelect, onSectionSelect, open, onOpenChange, visible }: TableOfContentsProps) {
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const GALLERY_SECTIONS = ["Photography", "Comics", "Art"];

  // Fetch like counts when TOC opens — article-level for essays, per-photo for galleries
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const counts: Record<string, number> = {};
      const fetches: Promise<void>[] = [];
      for (const a of articles) {
        if (GALLERY_SECTIONS.includes(a.category) && a.photos && a.photos.length > 0) {
          // Fetch per-photo like counts
          for (let i = 0; i < a.photos.length; i++) {
            const id = `${a.slug}-photo-${i}`;
            fetches.push(
              getDoc(`articles/${id}`)
                .then((data) => { counts[id] = (data?.likeCount as number) || 0; })
                .catch(() => { counts[id] = 0; })
            );
          }
        } else {
          fetches.push(
            getDoc(`articles/${a.slug}`)
              .then((data) => { counts[a.slug] = (data?.likeCount as number) || 0; })
              .catch(() => { counts[a.slug] = 0; })
          );
        }
      }
      await Promise.all(fetches);
      if (!cancelled) setLikeCounts(counts);
    })();
    return () => { cancelled = true; };
  }, [open, articles]);

  // Reset expanded section when TOC closes
  useEffect(() => {
    if (!open) setExpandedSection(null);
  }, [open]);

  // Group articles by category
  const groupedArticles: Record<string, ArticleMeta[]> = {};
  for (const article of articles) {
    const cat = article.category;
    if (!groupedArticles[cat]) groupedArticles[cat] = [];
    groupedArticles[cat].push(article);
  }

  const handleSelectArticle = (article: ArticleMeta, photoIndex?: number) => {
    const index = articles.findIndex((a) => a.slug === article.slug);
    if (index !== -1) {
      onSelect(index + articleOffset, photoIndex);
      onOpenChange(false);
    }
  };

  const handleSelectSection = (section: string) => {
    const sectionArticles = groupedArticles[section];
    if (sectionArticles && sectionArticles.length > 0) {
      if (onSectionSelect) {
        onSectionSelect(section);
        onOpenChange(false);
      } else {
        handleSelectArticle(sectionArticles[0]);
      }
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <>
      <motion.button
        onClick={() => onOpenChange(!open)}
        animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.8 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-6 right-4 z-50 w-10 h-10 rounded-full bg-charcoal/60 backdrop-blur-sm text-white flex items-center justify-center safe-bottom"
        aria-label="Table of contents"
        style={{ pointerEvents: visible ? "auto" : "none" }}
      >
        {open ? <X size={18} /> : <List size={18} />}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-charcoal/40 backdrop-blur-sm z-40"
              onClick={() => onOpenChange(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-paper rounded-t-2xl max-h-[70vh] overflow-y-auto safe-bottom"
            >
              <div className="p-6">
                <div className="w-10 h-1 bg-charcoal/10 rounded-full mx-auto mb-6" />
                <h2 className="heading-display text-xl mb-4 text-charcoal">In This Issue</h2>

                {editorial && (
                  <div className="border-b border-charcoal/10 mb-3 pb-3">
                    <button
                      onClick={() => { onSelect(1); onOpenChange(false); }}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                        currentIndex === 1 ? "bg-terracotta/10 text-terracotta" : "hover:bg-charcoal/5 text-charcoal"
                      }`}
                    >
                      <Mail size={16} className="opacity-50 shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{editorial.title}</p>
                        <span className="text-xs text-charcoal/40">A letter from the editors</span>
                      </div>
                    </button>
                  </div>
                )}

                <div className="space-y-1">
                  {SECTIONS.map((section) => {
                    const Icon = SECTION_ICONS[section];
                    const sectionArticles = groupedArticles[section] || [];
                    const hasArticles = sectionArticles.length > 0;
                    const isExpanded = expandedSection === section;
                    return (
                      <div key={section}>
                        {/* Section row */}
                        <div className="flex items-center rounded-lg">
                          <button
                            onClick={() => hasArticles && handleSelectSection(section)}
                            disabled={!hasArticles}
                            className={`flex-1 flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                              hasArticles ? "hover:bg-charcoal/5 text-charcoal cursor-pointer" : "text-charcoal/40 cursor-default"
                            }`}
                          >
                            <Icon size={16} className="shrink-0 opacity-60" />
                            <span className="font-medium text-sm">{section}</span>
                            {!hasArticles && (
                              <span className="text-[10px] uppercase tracking-wider bg-charcoal/5 text-charcoal/30 px-2 py-0.5 rounded-full">
                                Coming Soon
                              </span>
                            )}
                          </button>
                          {hasArticles && (
                            <button
                              onClick={() => toggleSection(section)}
                              className="p-3 rounded-lg hover:bg-charcoal/5 text-charcoal/50 transition-colors"
                              aria-label={isExpanded ? `Collapse ${section}` : `Expand ${section}`}
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          )}
                        </div>

                        {/* Expanded list — per-photo for galleries, per-article for essays */}
                        <AnimatePresence>
                          {isExpanded && hasArticles && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="pl-8 space-y-1 pb-1">
                                {sectionArticles.flatMap((article) => {
                                  const articleIndex = articles.findIndex((a) => a.slug === article.slug);
                                  const isGallery = GALLERY_SECTIONS.includes(section);
                                  const isOnPanel = articleIndex + articleOffset === currentIndex;
                                  const isActive = !isGallery && isOnPanel;

                                  if (isGallery && article.photos && article.photos.length > 0) {
                                    return article.photos.map((photo, pi) => {
                                      const photoId = `${article.slug}-photo-${pi}`;
                                      const count = likeCounts[photoId] || 0;
                                      const isCardActive = isOnPanel && activeCardIndex === pi;
                                      return (
                                        <button
                                          key={photoId}
                                          onClick={() => handleSelectArticle(article, pi)}
                                          className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                                            isCardActive ? "bg-terracotta/10 text-terracotta" : "hover:bg-charcoal/5 text-charcoal"
                                          }`}
                                        >
                                          <p className="font-medium text-sm">{photo.title || `#${pi + 1}`}</p>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            {photo.flavor && (
                                              <span
                                                className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                style={{ color: tagColor(photo.flavor), backgroundColor: `${tagColor(photo.flavor)}15` }}
                                              >
                                                {photo.flavor}
                                              </span>
                                            )}
                                            {photo.type && (
                                              <span
                                                className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                                                style={{ color: tagColor(photo.type), backgroundColor: `${tagColor(photo.type)}15` }}
                                              >
                                                {photo.type}
                                              </span>
                                            )}
                                            {count > 0 && (
                                              <span className="flex items-center gap-0.5 text-xs ml-auto">
                                                <Heart size={10} className="fill-sindoor text-sindoor" />
                                                <span className="text-sindoor/70 tabular-nums">{count}</span>
                                              </span>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    });
                                  }

                                  // Essay / non-gallery articles
                                  const count = likeCounts[article.slug] || 0;
                                  return [(
                                    <button
                                      key={article.slug}
                                      onClick={() => handleSelectArticle(article)}
                                      className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                                        isActive ? "bg-terracotta/10 text-terracotta" : "hover:bg-charcoal/5 text-charcoal"
                                      }`}
                                    >
                                      <p className="font-medium text-sm">{article.title}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        {article.flavor && (
                                          <span
                                            className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                                            style={{ color: tagColor(article.flavor), backgroundColor: `${tagColor(article.flavor)}15` }}
                                          >
                                            {article.flavor}
                                          </span>
                                        )}
                                        {article.type && (
                                          <span
                                            className="text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
                                            style={{ color: tagColor(article.type), backgroundColor: `${tagColor(article.type)}15` }}
                                          >
                                            {article.type}
                                          </span>
                                        )}
                                        {count > 0 && (
                                          <span className="flex items-center gap-0.5 text-xs ml-auto">
                                            <Heart size={10} className="fill-sindoor text-sindoor" />
                                            <span className="text-sindoor/70 tabular-nums">{count}</span>
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                  )];
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>

                {/* Meet The Team */}
                <div className="border-t border-charcoal/10 mt-3 pt-3">
                  <button
                    onClick={() => { onSelect(articles.length + articleOffset); onOpenChange(false); }}
                    className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                      currentIndex === articles.length + articleOffset ? "bg-terracotta/10 text-terracotta" : "hover:bg-charcoal/5 text-charcoal"
                    }`}
                    data-testid="toc-team-entry"
                  >
                    <Users size={16} className="opacity-50 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Meet The Team</p>
                      <span className="text-xs text-charcoal/40">The people behind the magazine</span>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
