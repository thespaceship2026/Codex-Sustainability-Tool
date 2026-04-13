// Orbit v2 — root layout.
//
// Responsibilities:
//   • Load the four typefaces used across the app (Satoshi, General Sans,
//     Newsreader, JetBrains Mono). Satoshi + General Sans live on Fontshare
//     so we pull them via <link>. Newsreader + JetBrains Mono come from
//     Google Fonts.
//   • Mount the SkyBackdrop once so it sits behind every route.
//   • Import globals.css so the Orbit design tokens and component styles
//     apply to every page.
//
// Anything that should appear on every route (e.g. the quick-log dock)
// lives here too.

import type { Metadata } from "next";
import { SkyBackdrop } from "@/components/orbit/SkyBackdrop";
import { Dock } from "@/components/orbit/Dock";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orbit — Shape What\u2019s Next",
  description:
    "Every system-level change starts with one person. Find your arena for impact in two minutes. Powered by The Carbon Almanac, built by The Spaceship Academy.",
  themeColor: "#030714"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Fontshare: Satoshi + General Sans */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&f[]=general-sans@600,500,400&display=swap"
        />
        {/* Google Fonts: Newsreader (editorial serif) + JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <SkyBackdrop />
        {children}
        <Dock />
      </body>
    </html>
  );
}
