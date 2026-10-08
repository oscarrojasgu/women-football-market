import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Women’s Football Market privacy policy and information about data, analytics and account choices.",
  alternates: { canonical: "https://www.womenfootballmarket.com/privacy" },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
