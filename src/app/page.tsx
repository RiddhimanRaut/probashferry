import { getAllArticles } from "@/lib/articles";
import MagazineViewer from "@/components/magazine/MagazineViewer";

interface Props {
  searchParams: Promise<{ article?: string; photo?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const articles = await getAllArticles("en");
  const { article, photo } = await searchParams;
  const photoIndex = photo != null ? parseInt(photo, 10) : undefined;

  return (
    <main>
      <MagazineViewer
        articles={articles}
        initialArticleSlug={article}
        initialPhotoIndex={photoIndex}
      />
    </main>
  );
}
