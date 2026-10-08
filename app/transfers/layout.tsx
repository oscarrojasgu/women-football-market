import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Transfers",
  description:
    "Explore women’s football transfers, player movement, clubs, dates, fees and transfer intelligence.",
  alternates: { canonical: "https://www.womenfootballmarket.com/transfers" },
};

export default function TransfersLayout({ children }: { children: ReactNode }) {
  return children;
}
