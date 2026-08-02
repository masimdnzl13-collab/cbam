import Link from "next/link";
import type { Metadata } from "next";
import { Flame, ArrowRight } from "lucide-react";
import { SEO_ARTICLES } from "@/content/seo-articles";
import { Card, CardBody } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "SKDM / CBAM Rehberi — KarbonRota",
  description: "CBAM nedir, SKDM ilk beyan tarihi, varsayılan değer farkı ve sektörel rehberler.",
};

export default function GuideIndexPage() {
  return (
    <main className="min-h-screen bg-base">
      <header className="border-b border-base-border">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
          <Flame className="h-5 w-5 text-accent" />
          <Link href="/" className="font-heading text-base font-semibold tracking-wide">KarbonRota</Link>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-heading text-2xl font-semibold text-ink mb-2">SKDM / CBAM Rehberi</h1>
        <p className="text-sm text-ink-muted mb-8">Türk ihracatçılar için CBAM hazırlık makaleleri.</p>
        <div className="space-y-3">
          {SEO_ARTICLES.map((a) => (
            <Link key={a.slug} href={`/rehber/${a.slug}`}>
              <Card className="hover:border-steel/50 transition-colors">
                <CardBody className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-heading text-sm font-semibold text-ink">{a.title}</h2>
                    <p className="mt-1 text-xs text-ink-muted">{a.metaDescription}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-faint shrink-0" />
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
