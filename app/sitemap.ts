import type { MetadataRoute } from "next";

const baseUrl = "https://women-football-market.vercel.app";

async function fetchIds(table: "players" | "clubs") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return [];

  try {
    const response = await fetch(`${url}/rest/v1/${table}?select=id`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) return [];

    const rows = (await response.json()) as Array<{ id: string }>;
    return rows;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: players }, { data: clubs }] = await Promise.all([
    fetchIds("players"),
    fetchIds("clubs"),
  ]);

  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/players`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/clubs`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/contracts`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/salaries`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/transfers`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...players.map((player) => ({
      url: `${baseUrl}/players/${player.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...clubs.map((club) => ({
      url: `${baseUrl}/clubs/${club.id}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
