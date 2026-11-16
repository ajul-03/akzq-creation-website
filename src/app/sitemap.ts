import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://akzqcreation.com";
  // Real lastmod dates reflecting actual repository file updates (not dynamic new Date())
  const lastmod2026_08_10 = new Date("2026-08-10");

  const routes: {
    path: string;
    lastmod: Date;
    priority: number;
    changeFrequency: "weekly" | "monthly" | "daily";
  }[] = [
    { path: "", lastmod: lastmod2026_08_10, priority: 1.0, changeFrequency: "weekly" },
    { path: "/about", lastmod: lastmod2026_08_10, priority: 0.8, changeFrequency: "monthly" },
    { path: "/services", lastmod: lastmod2026_08_10, priority: 0.9, changeFrequency: "weekly" },
    { path: "/branding-identity", lastmod: lastmod2026_08_10, priority: 0.85, changeFrequency: "monthly" },
    { path: "/web-design-development", lastmod: lastmod2026_08_10, priority: 0.85, changeFrequency: "monthly" },
    { path: "/digital-marketing-seo", lastmod: lastmod2026_08_10, priority: 0.85, changeFrequency: "monthly" },
    { path: "/media-content-production", lastmod: lastmod2026_08_10, priority: 0.85, changeFrequency: "monthly" },
    { path: "/local-seo", lastmod: lastmod2026_08_10, priority: 0.85, changeFrequency: "monthly" },
    { path: "/kannur", lastmod: lastmod2026_08_10, priority: 0.9, changeFrequency: "weekly" },
    { path: "/thalassery", lastmod: lastmod2026_08_10, priority: 0.9, changeFrequency: "weekly" },
    { path: "/portfolio", lastmod: lastmod2026_08_10, priority: 0.8, changeFrequency: "weekly" },
    { path: "/blog", lastmod: lastmod2026_08_10, priority: 0.8, changeFrequency: "daily" },
    { path: "/blog-cost-of-seo-kerala", lastmod: lastmod2026_08_10, priority: 0.75, changeFrequency: "monthly" },
    { path: "/faq", lastmod: lastmod2026_08_10, priority: 0.75, changeFrequency: "monthly" },
    { path: "/contact", lastmod: lastmod2026_08_10, priority: 0.9, changeFrequency: "monthly" },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: r.lastmod,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
