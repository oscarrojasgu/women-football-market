import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/pricing",
  es: siteUrl + "/es/pricing",
  pt: siteUrl + "/pt/pricing",
  fr: siteUrl + "/fr/pricing",
  de: siteUrl + "/de/pricing",
};

export const metadata: Metadata = {
  title: "Pricing",
  description: "Women’s Football Market access plans for scouting, clubs and data licensing.",
  alternates: { canonical: siteUrl + "/pricing", languages },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
