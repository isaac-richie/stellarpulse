import type { Metadata } from "next";
import { Inter, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "rwaanalytics — Prediction Markets",
  description:
    "Trade real-world outcomes on a premium prediction market interface.",
  keywords: ["prediction market", "rwaanalytics", "DeFi", "trading"],
  openGraph: {
    title: "rwaanalytics — Prediction Markets",
    description: "Trade real-world outcomes on a premium prediction market interface.",
    type: "website",
  },
  themeColor: "#F0B90B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceMono.variable} dark`}>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
