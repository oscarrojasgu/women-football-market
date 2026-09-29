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
  const club = await fetchPublicRecord(
    "clubs",
    id,
    "id,name,country,league,logo_url",
  );
  return buildEntityMetadata(club, "club");
}

export default async function ClubLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entity = await fetchPublicRecord(
    "clubs",
    id,
    "id,name,country,league,logo_url",
  );
  const jsonLd = buildEntityJsonLd(entity, "club");

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
