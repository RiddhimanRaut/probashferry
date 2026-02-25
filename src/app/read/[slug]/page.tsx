import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import ArticleRedirect from "./ArticleRedirect";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getAllArticles("en");
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  let article;
  try {
    article = await getArticleBySlug(slug, "en");
  } catch {
    return {};
  }

  return {
    title: `${article.title} — Probashferry`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `/read/${slug}`,
      images: [{ url: article.coverImage, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.excerpt,
      images: [article.coverImage],
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  try {
    await getArticleBySlug(slug, "en");
  } catch {
    notFound();
  }

  return <ArticleRedirect slug={slug} />;
}
