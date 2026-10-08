import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Women’s Football Market terms of use for the public database, accounts and commercial access.",
  alternates: { canonical: "https://www.womenfootballmarket.com/terms" },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
