"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArticleRedirect({ slug }: { slug: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/?article=${slug}`);
  }, [router, slug]);

  return (
    <div className="fixed inset-0 bg-paper flex items-center justify-center">
      <p className="text-charcoal/50 text-sm">Loading…</p>
    </div>
  );
}
