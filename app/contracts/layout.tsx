import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/contracts",
  es: siteUrl + "/es/contracts",
  pt: siteUrl + "/pt/contracts",
  fr: siteUrl + "/fr/contracts",
  de: siteUrl + "/de/contracts",
};

export const metadata: Metadata = {
  title: "Contracts",
  description: "Explore women’s football contract records, contract status, dates, clubs and salary intelligence.",
  alternates: { canonical: siteUrl + "/contracts", languages },
};

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
