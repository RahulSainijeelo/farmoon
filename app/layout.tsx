import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soil-to-Sky | Edge Field System",
  description: "Offline-first field data ingestion, agronomic engines, and safety-gated farm actions.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
