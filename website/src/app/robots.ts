import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/beta/statut"],
      },
    ],
    sitemap: "https://proday75.fr/sitemap.xml",
  };
}
