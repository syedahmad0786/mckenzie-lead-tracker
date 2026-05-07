import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Tracker — McKenzie SewOn × Modern Amenities",
  description: "Shared lead tracking dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
