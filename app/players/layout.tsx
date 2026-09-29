import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Players",
  description:
    "Explore women’s football players by position, nationality, competition, performance, contracts, salaries and market value.",
  alternates: { canonical: "https://women-football-market.vercel.app/players" },
};
export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
