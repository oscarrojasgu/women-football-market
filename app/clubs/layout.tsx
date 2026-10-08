import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/clubs",
  es: siteUrl + "/es/clubs",
  pt: siteUrl + "/pt/clubs",
  fr: siteUrl + "/fr/clubs",
  de: siteUrl + "/de/clubs",
};

export const metadata: Metadata = {
  title: "Clubs",
  description: "Explore women’s football clubs, rosters, contracts, transfers, salaries and player intelligence.",
  alternates: { canonical: siteUrl + "/clubs", languages },
};

export default function ClubsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
