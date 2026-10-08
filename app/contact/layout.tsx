import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/contact",
  es: siteUrl + "/es/contact",
  pt: siteUrl + "/pt/contact",
  fr: siteUrl + "/fr/contact",
  de: siteUrl + "/de/contact",
};

export const metadata: Metadata = {
  title: "Contact WFM",
  description: "Contact Women’s Football Market about data corrections, verification, licensing, commercial access and support.",
  alternates: { canonical: siteUrl + "/contact", languages },
};

export default function ContactWFMLayout({ children }: { children: React.ReactNode }) {
  return children;
}
