import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private portal areas out of search indexes.
      disallow: ["/admin", "/dashboard", "/exams", "/results", "/profile", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
