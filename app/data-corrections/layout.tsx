import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Corrections",
  description: "Report and review corrections to Women’s Football Market player, club, contract, salary and transfer data.",
  alternates: { canonical: "https://www.womenfootballmarket.com/data-corrections" },
};

export default function DataCorrectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
