import type { Metadata } from "next";

const siteUrl = "https://women-football-market.vercel.app";
const siteName = "Women’s Football Market";

type SeoRecord = {
  id: string;
  full_name?: string | null;
  canonical_name?: string | null;
  name?: string | null;
  country?: string | null;
  nationality?: string | null;
  position?: string | null;
  league?: string | null;
  competition_type?: string | null;
  level_label?: string | null;
  photo_url?: string | null;
  logo_url?: string | null;
};

function publicHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

export async function fetchPublicRecord(
  table: "players" | "clubs" | "competitions",
  id: string,
  select: string,
): Promise<SeoRecord | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || !id) return null;

  try {
    const response = await fetch(
      `${url}/rest/v1/${table}?select=${encodeURIComponent(select)}&id=eq.${encodeURIComponent(id)}&limit=1`,
      {
        headers: publicHeaders(key),
        next: { revalidate: 3600 },
      },
    );

    if (!response.ok) return null;

    const rows = (await response.json()) as SeoRecord[];
    return rows[0] || null;
  } catch {
    return null;
  }
}

export function buildEntityMetadata(
  entity: SeoRecord | null,
  type: "player" | "club" | "competition",
): Metadata {
  if (!entity) {
    return {
      title: type === "player" ? "Player" : type === "club" ? "Club" : "Competition",
      robots: { index: false, follow: true },
    };
  }

  const name =
    entity.full_name ||
    entity.canonical_name ||
    entity.name ||
    (type === "player" ? "Player" : type === "club" ? "Club" : "Competition");

  const descriptor =
    type === "player"
      ? [entity.nationality, entity.position, entity.league].filter(Boolean).join(" · ")
      : type === "club"
        ? [entity.country, entity.league].filter(Boolean).join(" · ")
        : [entity.country, entity.level_label, entity.competition_type].filter(Boolean).join(" · ");

  const description =
    type === "player"
      ? `${name} player profile with women’s football contract, salary, transfer, market value, performance and data provenance information.`
      : type === "club"
        ? `${name} women’s football club profile with roster, contracts, transfers, salary and data provenance information.`
        : `${name} women’s football competition profile with seasons, clubs and player coverage.`;

  const canonical =
    type === "player"
      ? `${siteUrl}/players/${entity.id}`
      : type === "club"
        ? `${siteUrl}/clubs/${entity.id}`
        : `${siteUrl}/competitions/${entity.id}`;

  const image = entity.photo_url || entity.logo_url || undefined;

  return {
    title: name,
    description: descriptor ? `${description} ${descriptor}.` : description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      siteName,
      title: name,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: name,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export { siteUrl };
