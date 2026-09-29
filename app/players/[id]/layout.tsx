import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildEntityMetadata, fetchPublicRecord } from "../../lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const player = await fetchPublicRecord(
    "players",
    id,
    "id,full_name,nationality,position,league,photo_url",
  );
  return buildEntityMetadata(player, "player");
}

export default function PlayerLayout({ children }: { children: ReactNode }) {
  return children;
}
