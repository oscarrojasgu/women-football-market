import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/players", "/clubs", "/contracts", "/salaries", "/transfers"],
        disallow: ["/admin", "/api", "/contributor", "/scouting", "/compare"]
      }
    ],
    sitemap: "https://women-football-market.vercel.app/sitemap.xml"
  };
}
