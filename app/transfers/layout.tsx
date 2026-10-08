import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/transfers",
  es: siteUrl + "/es/transfers",
  pt: siteUrl + "/pt/transfers",
  fr: siteUrl + "/fr/transfers",
  de: siteUrl + "/de/transfers",
};

export const metadata: Metadata = {
  title: "Transfers",
  description: "Explore women’s football transfers, player movement, clubs, dates, fees and transfer intelligence.",
  alternates: { canonical: siteUrl + "/transfers", languages },
};

export default function TransfersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
