import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/players",
  es: siteUrl + "/es/players",
  pt: siteUrl + "/pt/players",
  fr: siteUrl + "/fr/players",
  de: siteUrl + "/de/players",
};

export const metadata: Metadata = {
  title: "Players",
  description: "Explore women’s football players by position, nationality, competition, performance, contracts, salaries and market value.",
  alternates: { canonical: siteUrl + "/players", languages },
};

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
