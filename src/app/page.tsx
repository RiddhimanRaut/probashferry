import { getContent } from "@/lib/articles";
import MagazineViewer from "@/components/magazine/MagazineViewer";

interface Props {
  searchParams: Promise<{ article?: string; photo?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const { editorial, articles } = await getContent("en");
  const { article, photo } = await searchParams;
  const photoIndex = photo != null ? parseInt(photo, 10) : undefined;

  return (
    <main>
      <MagazineViewer
        articles={articles}
        editorial={editorial}
        initialArticleSlug={article}
        initialPhotoIndex={photoIndex}
      />
    </main>
  );
}
