import { getAllArticles } from "@/lib/articles";
import MagazineViewer from "@/components/magazine/MagazineViewer";

export default async function Home() {
  const articles = await getAllArticles("en");

  return (
    <main>
      <MagazineViewer articles={articles} />
    </main>
  );
}
