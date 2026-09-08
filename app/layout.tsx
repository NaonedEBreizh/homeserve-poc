import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Suspense, type ReactNode } from "react";

import { EnteteApp } from "@/components/EnteteApp";
import { contenu } from "@/lib/content";

import "./globals.css";

/**
 * Le nonce CSP ne peut être apposé sur les scripts de bootstrap Next.js que
 * pendant un rendu dynamique : le pré-rendu statique a lieu au build, avant
 * que le nonce n'existe. C'est ce qui permet à `script-src` de rester sans
 * 'unsafe-inline' (voir README).
 */
export const dynamic = "force-dynamic";

/**
 * Nunito auto-hébergée par `next/font` : les fichiers sont téléchargés au
 * build et servis depuis `/_next/static`. Aucune requête vers Google au
 * runtime — la contrainte « aucune requête externe » reste tenue.
 * La variable alimente `--font-nunito`, que `--font-sans` consomme déjà
 * dans app/globals.css (tokens inchangés).
 */
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Mon projet énergie — prototype HomeServe",
  description:
    "Prototype non officiel : estimation d'économies solaire et pompe à chaleur, sans transmission de données.",
  // Prototype de candidature : il n'a rien à faire dans un index de moteur.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={nunito.variable}>
      <body className="min-h-dvh bg-white font-sans text-slate-900 antialiased">
        {/* Bandeau exigé sur toutes les pages (CLAUDE.md). */}
        <p
          role="note"
          className="bg-canard-500 px-4 py-2 text-center text-sm font-medium text-white"
        >
          {contenu.global.bandeau_prototype}
        </p>

        {/* `variant` et `debug` sont lus côté client : d'où le Suspense. */}
        <Suspense fallback={null}>
          <EnteteApp />
        </Suspense>

        {children}
      </body>
    </html>
  );
}
