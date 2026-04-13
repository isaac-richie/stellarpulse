import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "StellarPulse — Prediction Events",
  description:
    "Stellar-native prediction event terminal with real-time events and premium analysis.",
  keywords: ["prediction event", "stellarpulse", "Stellar", "x402", "trading"],
  openGraph: {
    title: "StellarPulse — Prediction Events",
    description: "Stellar-native prediction event terminal with real-time events and premium analysis.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F0B90B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
