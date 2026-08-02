import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Flame, ArrowLeft, ArrowRight } from "lucide-react";
import { SEO_ARTICLES } from "@/content/seo-articles";
import { Card, CardBody } from "@/components/ui/Card";

export function generateStaticParams() {
  return SEO_ARTICLES.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const article = SEO_ARTICLES.find((a) => a.slug === params.slug);
  if (!article) return {};
  return {
    title: `${article.title} — KarbonRota`,
    description: article.metaDescription,
    keywords: [article.targetKeyword],
  };
}

export default function GuideArticlePage({ params }: { params: { slug: string } }) {
  const article = SEO_ARTICLES.find((a) => a.slug === params.slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-base">
      <header className="border-b border-base-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-accent" />
            <Link href="/" className="font-heading text-base font-semibold tracking-wide">KarbonRota</Link>
          </div>
          <Link href="/rehber" className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink">
            <ArrowLeft className="h-3.5 w-3.5" /> Rehbere dön
          </Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-heading text-2xl font-semibold text-ink">{article.title}</h1>
        <p className="mt-3 text-sm text-ink-muted">{article.metaDescription}</p>

        <Card className="mt-8">
          <CardBody>
            <p className="text-xs uppercase tracking-wide text-ink-muted mb-3">Bu makalede</p>
            <ul className="space-y-2">
              {article.outline.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-muted">
                  <span className="font-tabular text-accent text-xs mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <div className="mt-8 flex items-center justify-between rounded border border-base-border bg-base-surface p-5">
          <div>
            <p className="text-sm font-medium text-ink">Kendi maruziyetini merak mı ediyorsun?</p>
            <p className="text-xs text-ink-muted mt-1">Ücretsiz hesaplayıcıyla 30 saniyede tahmini gör.</p>
          </div>
          <Link href="/hesaplayici" className="inline-flex items-center gap-1 rounded bg-accent px-4 py-2 text-sm font-semibold text-base hover:bg-accent-hover">
            Hesapla <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </main>
  );
}
