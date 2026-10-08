import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Players",
  description: "Compare women’s football players using WFM performance and player data.",
  robots: { index: false, follow: true },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
