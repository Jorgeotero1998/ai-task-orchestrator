import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Task Orchestrator",
  description: "Portfolio-ready AI task breakdown dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

