import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Salaries",
  description:
    "Explore women’s football salary records and compensation intelligence across clubs and players.",
  alternates: { canonical: "https://women-football-market.vercel.app/salaries" },
};

export default function SalariesLayout({ children }: { children: ReactNode }) {
  return children;
}
