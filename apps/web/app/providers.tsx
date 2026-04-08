"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

  if (!appId) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <div className="surface-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold">Privy app ID missing</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Set <code className="font-mono">NEXT_PUBLIC_PRIVY_APP_ID</code> in
              your <code className="font-mono">apps/web/.env</code> and restart
              the dev server.
            </p>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["wallet", "email"],
        appearance: {
          theme: "dark",
          accentColor: "#00f0ff"
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets"
          }
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}
