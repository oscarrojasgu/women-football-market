import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/terms",
  es: siteUrl + "/es/terms",
  pt: siteUrl + "/pt/terms",
  fr: siteUrl + "/fr/terms",
  de: siteUrl + "/de/terms",
};

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Women’s Football Market terms of use for the public database, accounts and commercial access.",
  alternates: { canonical: siteUrl + "/terms", languages },
};

export default function TermsofUseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
