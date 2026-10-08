import type { MetadataRoute } from "next";

const baseUrl = "https://www.womenfootballmarket.com";

type SitemapRow = { id: string; updated_at?: string | null };

async function fetchIds(
  table: "players" | "clubs" | "competitions",
): Promise<SitemapRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return [];

  try {
    const response = await fetch(
      `${url}/rest/v1/${table}?select=id,updated_at&order=updated_at.desc.nullslast`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) return [];

    return (await response.json()) as SitemapRow[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [players, clubs, competitions] = await Promise.all([
    fetchIds("players"),
    fetchIds("clubs"),
    fetchIds("competitions"),
  ]);

  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${baseUrl}/players`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/clubs`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/competitions`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contracts`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/salaries`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/transfers`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/data-corrections`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    ...players.map((player) => ({
      url: `${baseUrl}/players/${player.id}`,
      lastModified: player.updated_at ? new Date(player.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...competitions.map((competition) => ({
      url: `${baseUrl}/competitions/${competition.id}`,
      lastModified: competition.updated_at
        ? new Date(competition.updated_at)
        : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...clubs.map((club) => ({
      url: `${baseUrl}/clubs/${club.id}`,
      lastModified: club.updated_at ? new Date(club.updated_at) : now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
