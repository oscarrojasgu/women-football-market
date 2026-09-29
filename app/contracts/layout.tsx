import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Contracts",
  description:
    "Explore women’s football contract records, contract status, dates, clubs and salary intelligence.",
  alternates: { canonical: "https://women-football-market.vercel.app/contracts" },
};

export default function ContractsLayout({ children }: { children: ReactNode }) {
  return children;
}
