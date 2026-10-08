import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scouting Workspace",
  robots: { index: false, follow: false },
};

export default function ScoutingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
