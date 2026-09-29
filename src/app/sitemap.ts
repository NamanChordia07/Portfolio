import type { MetadataRoute } from "next";

import { site, work } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site.url}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...work.map((w) => ({ url: `${site.url}/work/${w.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    { url: `${site.url}/resume`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
