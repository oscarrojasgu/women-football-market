import type { MetadataRoute } from "next";
import { supabase } from "./lib/supabase";

const baseUrl = "https://women-football-market.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: players }, { data: clubs }] = await Promise.all([
    supabase.from("players").select("id"),
    supabase.from("clubs").select("id")
  ]);

  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/players`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/clubs`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/contracts`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/salaries`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/transfers`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...(players || []).map((player) => ({
      url: `${baseUrl}/players/${player.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...(clubs || []).map((club) => ({
      url: `${baseUrl}/clubs/${club.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7
    }))
  ];
}
