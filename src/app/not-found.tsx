import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-paper text-charcoal px-6">
      <h1 className="heading-display text-6xl text-terracotta mb-4">404</h1>
      <p className="text-lg text-charcoal/60 mb-6">This page doesn&apos;t exist</p>
      <Link href="/" className="btn-primary">
        Back to Magazine
      </Link>
    </div>
  );
}
