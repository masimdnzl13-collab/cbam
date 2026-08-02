import type { MetadataRoute } from "next";
import { SEO_ARTICLES } from "@/content/seo-articles";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://karbonrota.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/hesaplayici", "/giris", "/kayit", "/kvkk", "/rehber"].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const articleRoutes = SEO_ARTICLES.map((a) => ({
    url: `${SITE_URL}/rehber/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
