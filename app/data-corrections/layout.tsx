import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/data-corrections",
  es: siteUrl + "/es/data-corrections",
  pt: siteUrl + "/pt/data-corrections",
  fr: siteUrl + "/fr/data-corrections",
  de: siteUrl + "/de/data-corrections",
};

export const metadata: Metadata = {
  title: "Data Corrections",
  description: "Report and review corrections to Women’s Football Market player, club, contract, salary and transfer data.",
  alternates: { canonical: siteUrl + "/data-corrections", languages },
};

export default function DataCorrectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
