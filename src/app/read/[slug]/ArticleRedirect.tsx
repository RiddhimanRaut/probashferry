"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ArticleRedirect({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const photo = searchParams.get("photo");
    const query = photo != null ? `&photo=${photo}` : "";
    router.replace(`/?article=${slug}${query}`);
  }, [router, slug, searchParams]);

  return (
    <div className="fixed inset-0 bg-paper flex items-center justify-center">
      <p className="text-charcoal/50 text-sm">Loading…</p>
    </div>
  );
}
