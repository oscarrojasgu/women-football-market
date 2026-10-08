import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clubs",
  description:
    "Explore women’s football clubs, rosters, contracts, transfers, salaries and player intelligence.",
  alternates: { canonical: "https://www.womenfootballmarket.com/clubs" },
};
export default function ClubsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
