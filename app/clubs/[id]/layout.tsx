import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildEntityMetadata, fetchPublicRecord } from "../../lib/seo";

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

export default function ClubLayout({ children }: { children: ReactNode }) {
  return children;
}
