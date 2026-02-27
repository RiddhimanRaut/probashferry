import { formatDate } from "@/lib/utils";
import { tagColor } from "@/lib/tags";
import { ArticleMeta } from "@/types/article";
import KanthaDivider from "@/components/ui/KanthaDivider";

function TagPill({ tag, size = "normal" }: { tag: string; size?: "normal" | "small" }) {
  const color = tagColor(tag);
  const cls = size === "small"
    ? "text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded"
    : "text-xs font-medium uppercase tracking-wider px-2 py-1 rounded";
  return (
    <span className={cls} style={{ color, backgroundColor: `${color}15` }}>
      {tag}
    </span>
  );
}

export { TagPill };

export default function ArticleHeader({ article }: { article: ArticleMeta }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        {article.flavor && <TagPill tag={article.flavor} />}
        {article.type && <TagPill tag={article.type} />}
        {!article.flavor && !article.type && (
          <span className="inline-block text-xs font-medium uppercase tracking-wider text-sage bg-sage/10 px-2 py-1 rounded">
            {article.category}
          </span>
        )}
      </div>
      <h2 className="heading-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl mt-3 mb-3 text-balance">
        {article.title}
      </h2>
      <p className="text-charcoal/60 text-lg mb-3">{article.excerpt}</p>
      <div className="flex items-center gap-3 text-sm text-charcoal/50">
        <span>{article.author}</span>
        <span>&middot;</span>
        <span>{formatDate(article.date)}</span>
        <span>&middot;</span>
        <span>{article.readingTime} min read</span>
      </div>
      <KanthaDivider className="mt-4" />
    </div>
  );
}
