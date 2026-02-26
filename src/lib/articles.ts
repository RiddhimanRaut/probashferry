import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import { Article } from "@/types/article";
import { calculateReadingTime } from "./utils";

const articlesDirectory = path.join(process.cwd(), "content/articles");

const CATEGORY_ORDER: Record<string, number> = {
  Essays: 0,
  Photography: 1,
  Comics: 2,
  Art: 3,
};

export async function getAllArticles(lang: string = "en"): Promise<Article[]> {
  const dir = path.join(articlesDirectory, lang);
  if (!fs.existsSync(dir)) return [];

  const filenames = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  const articles = await Promise.all(
    filenames.map(async (filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      return getArticleBySlug(slug, lang);
    })
  );

  return articles.sort((a, b) => {
    const catDiff = (CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99);
    if (catDiff !== 0) return catDiff;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export async function getArticleBySlug(slug: string, lang: string = "en"): Promise<Article> {
  const filePath = path.join(articlesDirectory, lang, `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const processed = await remark().use(html).process(content);
  const htmlContent = processed.toString();

  return {
    slug,
    title: data.title || slug,
    author: data.author || "Unknown",
    date: data.date || new Date().toISOString(),
    excerpt: data.excerpt || "",
    coverImage: data.coverImage || "/images/cover.jpg",
    category: data.category || "Stories",
    readingTime: calculateReadingTime(content),
    lang,
    content,
    html: htmlContent,
    photos: data.photos || undefined,
  };
}
