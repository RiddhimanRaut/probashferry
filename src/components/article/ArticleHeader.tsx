import { formatDate } from "@/lib/utils";
import { ArticleMeta } from "@/types/article";
import KanthaDivider from "@/components/ui/KanthaDivider";

export default function ArticleHeader({ article }: { article: ArticleMeta }) {
  return (
    <div className="mb-6">
      <span className="inline-block text-xs font-medium uppercase tracking-wider text-sage bg-sage/10 px-2 py-1 rounded">
        {article.category}
      </span>
      <h2 className="heading-display text-3xl md:text-4xl lg:text-5xl mt-3 mb-3 text-balance">
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
