export interface ArticleMeta {
  slug: string;
  title: string;
  author: string;
  date: string;
  excerpt: string;
  coverImage: string;
  category: string;
  readingTime: number;
  lang: string;
}

export interface Article extends ArticleMeta {
  content: string;
  html: string;
}
