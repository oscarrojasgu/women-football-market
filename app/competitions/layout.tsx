import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Competitions",
  description:
    "Explore women’s football competitions, seasons, clubs and player coverage across the WFM database.",
  alternates: { canonical: "https://www.womenfootballmarket.com/competitions" },
};
export default function CompetitionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
