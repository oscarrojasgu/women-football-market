import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Women’s Football Market access plans for scouting, clubs and data licensing.",
  alternates: { canonical: "https://www.womenfootballmarket.com/pricing" },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
