import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "SmartMarket",
  description: "BNB-native UX for Polymarket execution"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="page">
          {children}
        </div>
      </body>
    </html>
  );
}
