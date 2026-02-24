"use client";

// no local state — controlled by parent
import { motion, AnimatePresence } from "framer-motion";
import { List, X } from "lucide-react";
import { ArticleMeta } from "@/types/article";

interface TableOfContentsProps {
  articles: ArticleMeta[];
  currentIndex: number;
  onSelect: (index: number) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TableOfContents({ articles, currentIndex, onSelect, open, onOpenChange }: TableOfContentsProps) {
  const handleSelect = (i: number) => {
    onSelect(i + 1); // +1 for cover panel
    onOpenChange(false);
  };

  return (
    <>
      <button
        onClick={() => onOpenChange(!open)}
        className="fixed bottom-6 right-4 z-50 w-10 h-10 rounded-full bg-charcoal/60 backdrop-blur-sm text-white flex items-center justify-center safe-bottom"
        aria-label="Table of contents"
      >
        {open ? <X size={18} /> : <List size={18} />}
      </button>

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
                <div className="space-y-1">
                  {articles.map((article, i) => {
                    const isActive = i + 1 === currentIndex;
                    return (
                      <button
                        key={article.slug}
                        onClick={() => handleSelect(i)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          isActive ? "bg-terracotta/10 text-terracotta" : "hover:bg-charcoal/5 text-charcoal"
                        }`}
                      >
                        <p className="font-medium text-sm">{article.title}</p>
                        <p className="text-xs text-charcoal/40 mt-0.5">
                          {article.author} &middot; {article.readingTime} min
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
