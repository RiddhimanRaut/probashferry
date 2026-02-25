import { getAllArticles } from "@/lib/articles";
import MagazineViewer from "@/components/magazine/MagazineViewer";

interface Props {
  searchParams: Promise<{ article?: string }>;
}

export default async function Home({ searchParams }: Props) {
  const articles = await getAllArticles("en");
  const { article } = await searchParams;

  return (
    <main>
      <MagazineViewer articles={articles} initialArticleSlug={article} />
    </main>
  );
}
