import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/salaries",
  es: siteUrl + "/es/salaries",
  pt: siteUrl + "/pt/salaries",
  fr: siteUrl + "/fr/salaries",
  de: siteUrl + "/de/salaries",
};

export const metadata: Metadata = {
  title: "Salaries",
  description: "Explore women’s football salary records and compensation intelligence across clubs and players.",
  alternates: { canonical: siteUrl + "/salaries", languages },
};

export default function SalariesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
