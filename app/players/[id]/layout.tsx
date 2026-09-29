import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  buildEntityJsonLd,
  buildEntityMetadata,
  fetchPublicRecord,
} from "../../lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const player = await fetchPublicRecord(
    "players",
    id,
    "id,full_name,nationality,position,photo_url",
  );
  return buildEntityMetadata(player, "player");
}

export default async function PlayerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entity = await fetchPublicRecord(
    "players",
    id,
    "id,full_name,nationality,position,photo_url",
  );
  const jsonLd = buildEntityJsonLd(entity, "player");

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      {children}
    </>
  );
}
