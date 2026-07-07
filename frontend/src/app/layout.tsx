import type { Metadata, Viewport } from "next";
import { Syne } from "next/font/google";
import { GeistSans } from "geist/font/sans";

import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Task Orchestrator",
  description:
    "Turn any goal into a structured action plan — AI-powered orchestration with priorities, timelines, and export.",
  authors: [{ name: "Jorge Otero" }],
  openGraph: {
    title: "AI Task Orchestrator",
    description: "Turn any goal into a structured action plan.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#030305",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${syne.variable}`}>
      <body className={GeistSans.className}>{children}</body>
    </html>
  );
}
