import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import ArticleRedirect from "./ArticleRedirect";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ photo?: string }>;
}

export async function generateStaticParams() {
  const articles = await getAllArticles("en");
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { photo } = await searchParams;

  let article;
  try {
    article = await getArticleBySlug(slug, "en");
  } catch {
    return {};
  }

  const photoIndex = photo != null ? parseInt(photo, 10) : NaN;
  const photoData = !isNaN(photoIndex) && article.photos?.[photoIndex];

  const title = photoData
    ? `${photoData.title || article.title} — Probashferry`
    : `${article.title} — Probashferry`;
  const description = photoData
    ? photoData.caption || article.excerpt
    : article.excerpt;
  const image = photoData
    ? photoData.src
    : article.coverImage;
  const url = photoData
    ? `/read/${slug}?photo=${photoIndex}`
    : `/read/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
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
