export interface Photo {
  src: string;
  caption: string;
  title?: string;
  artist?: string;
  medium?: string;
}

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
  photos?: Photo[];
}

export interface Article extends ArticleMeta {
  content: string;
  html: string;
}
