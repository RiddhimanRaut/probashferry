import { getAllArticles } from "@/lib/articles";
import MagazineViewer from "@/components/magazine/MagazineViewer";
import Header from "@/components/layout/Header";

export default async function Home() {
  const articles = await getAllArticles("en");

  return (
    <main>
      <Header />
      <MagazineViewer articles={articles} />
    </main>
  );
}
