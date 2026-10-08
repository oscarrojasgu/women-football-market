import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/competitions",
  es: siteUrl + "/es/competitions",
  pt: siteUrl + "/pt/competitions",
  fr: siteUrl + "/fr/competitions",
  de: siteUrl + "/de/competitions",
};

export const metadata: Metadata = {
  title: "Competitions",
  description: "Explore women’s football competitions, seasons, clubs and player coverage across the WFM database.",
  alternates: { canonical: siteUrl + "/competitions", languages },
};

export default function CompetitionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
