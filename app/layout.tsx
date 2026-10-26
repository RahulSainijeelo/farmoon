import type { Metadata } from "next";
import "./globals.css";
import { DemoProvider } from "@/core/context/DemoContext";
import { PwaRegister } from "@/components/common/PwaRegister";

export const metadata: Metadata = {
  title: "Soil-to-Sky | Edge Field System",
  description: "Offline-first field data ingestion, agronomic engines, and safety-gated farm actions.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1b4332" />
      </head>
      <body>
        <DemoProvider>
          <PwaRegister />
          {children}
        </DemoProvider>
      </body>
    </html>
  );
}
