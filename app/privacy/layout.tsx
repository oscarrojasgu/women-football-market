import type { Metadata } from "next";

const siteUrl = "https://www.womenfootballmarket.com";
const languages = {
  en: siteUrl + "/privacy",
  es: siteUrl + "/es/privacy",
  pt: siteUrl + "/pt/privacy",
  fr: siteUrl + "/fr/privacy",
  de: siteUrl + "/de/privacy",
};

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Women’s Football Market privacy policy and information about data, analytics and account choices.",
  alternates: { canonical: siteUrl + "/privacy", languages },
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
