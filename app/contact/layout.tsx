import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact WFM",
  description: "Contact Women’s Football Market about data corrections, verification, licensing, commercial access and support.",
  alternates: { canonical: "https://www.womenfootballmarket.com/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
