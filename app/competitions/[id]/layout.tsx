import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildEntityMetadata, fetchPublicRecord } from "../../lib/seo";

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

export default function CompetitionLayout({ children }: { children: ReactNode }) {
  return children;
}
