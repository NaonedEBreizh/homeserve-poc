import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

/**
 * A per-request CSP nonce can only be stamped onto Next.js' inline bootstrap
 * scripts while a route is rendered dynamically — static prerendering happens
 * at build time, when no nonce exists yet. Opting the whole tree into dynamic
 * rendering is what keeps `script-src` free of `'unsafe-inline'`.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HomeServe POC",
  description: "Proof of concept HomeServe — Next.js App Router",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
