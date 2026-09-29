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
  const competition = await fetchPublicRecord(
    "competitions",
    id,
    "id,canonical_name,country,competition_type,level_label",
  );
  return buildEntityMetadata(competition, "competition");
}

export default async function CompetitionLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entity = await fetchPublicRecord(
    "competitions",
    id,
    "id,canonical_name,country,competition_type,level_label,logo_url",
  );
  const jsonLd = buildEntityJsonLd(entity, "competition");

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
