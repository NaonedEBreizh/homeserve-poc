# Architecture v3 — bascule Next.js App Router (agent Architecte — 07/09/2026, complément à `06-architecture-poc-v2.md`)

✅ vérifié · 🔶 source tierce · ❓ supposé. Ce qui n'est pas mentionné ici est inchangé par rapport à la v2 (`engine/`, JSON `data/`, sessionStorage, tests, moteur PAC, machine à états, sécurité repo).

## 0. Décision forcée : `output: 'standalone'`, pas d'export statique
La doc Next (v16.3.4, maj 25/08/2026) liste `headers`, `redirects`, `rewrites` et les Route Handlers lisant `Request` parmi les fonctionnalités **non supportées en `output: 'export'`** ✅. Options : (a) export + headers via `vercel.json` → Vercel-only, exclu ; (b) export sans headers → on perd la démonstration sécurité face au F de homeserve.fr ; (c) **`output: 'standalone'`** : toutes les pages pré-rendues statiquement au build (aucun `cookies()`/`headers()` runtime ni `searchParams` serveur), en-têtes servis par Next, image Docker GKE immédiate. **Décision : (c).** La Route Handler optionnelle `POST /api/rdv` devient possible ; le front garde son repli localStorage.

## 1. Arborescence Next
```
homeserve-poc/
├─ next.config.ts              output:'standalone', headers(), reactStrictMode, poweredByHeader:false
├─ postcss.config.mjs          { plugins: { '@tailwindcss/postcss': {} } }   (pas de tailwind.config)
├─ Dockerfile                  multi-stage node:22-alpine → .next/standalone
├─ vitest.config.ts            include: engine/**/*.test.ts  (aucun import React)
├─ app/
│  ├─ layout.tsx               <html lang="fr">, next/font/local Nunito, bandeau Prototype, <Providers>
│  ├─ globals.css              @import "tailwindcss"; @theme { tokens HomeServe }
│  ├─ page.tsx                 Entrée : solaire / PAC / les deux
│  ├─ (simulateur)/simulateur/page.tsx   <Simulateur/> 'use client'
│  ├─ (simulateur)/resultat/page.tsx     <Resultat/> 'use client' (store, variant)
│  ├─ (rdv)/rendez-vous/page.tsx         <MachineRdv/> 'use client'
│  ├─ (rdv)/sortie/[type]/page.tsx       generateStaticParams() depuis content/fr-fr.json → 7 pages statiques
│  ├─ (rdv)/confirmation/page.tsx, gerer/page.tsx
│  ├─ api/rdv/route.ts         POST mock OPTIONNEL : valide (zod), renvoie {id, mock:true}
│  └─ not-found.tsx
├─ components/                 'use client' : ChoixProjet, Simulateur, Resultat, MachineRdv, Calendrier (Popover Radix),
│                              Creneaux (RadioGroup), Engagement (Dialog), MockBadge, DebugPanel, Hypotheses, Recap
├─ lib/
│  ├─ store.ts                 sessionStorage + useSyncExternalStore
│  ├─ analytics.ts             track() → window.dataLayer.push ; mapping Piwik PRO / GTM en commentaire
│  └─ content.ts               charge content/fr-fr.json, typé depuis content/model.json
├─ engine/                     inchangé v2
├─ data/                       inchangé v2
├─ content/
│  ├─ model.json               custom type Prismic « simulator_wording » : questions[], sorties[], ctas[]
│  └─ fr-fr.json               wording, sorties, CTA, URLs offres réelles
├─ public/fonts/Nunito-*.woff2 ; favicon.svg
└─ README.md, .env.example, .gitignore, .pre-commit-config.yaml, .github/workflows/ci.yml
```
`engine/` et `data/` restent hors de `app/` : importés côté client, testés par Vitest sans Next.

## 2. Points d'attention Next
- **Rendu** : aucune page ne lit `searchParams` côté serveur ; `variant`, `debug` lus dans le navigateur (`useSearchParams` dans un `<Suspense>`). Toutes les routes `○ Static` au build, seule `/api/rdv` `ƒ Dynamic`. Sortie de `next build` à montrer au CTO.
- **sessionStorage / hydratation** : `lib/store.ts` expose `useProjet()` via `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` avec `getServerSnapshot = () => ETAT_VIDE` ; squelette tant que `hydrated === false`. Aucun `window` hors `useEffect`/store.
- **Tailwind v4** : pas de `tailwind.config.ts` ; tokens dans `globals.css` :
  ```css
  @import "tailwindcss";
  @theme {
    --color-corail-600: #e22c22; --color-canard-500: #258386; --color-vert-600: #255a2e;
    --font-sans: var(--font-nunito), ui-sans-serif, system-ui;
    --radius-card: 1rem;
  }
  ```
  Noms identiques à ceux observés sur homeserve.fr ✅ : un composant du POC se colle dans leur monorepo sans renommage.
- **next/font** : `next/font/local` avec woff2 dans `public/fonts/` (build offline possible, zéro requête runtime), variable `--font-nunito`.
- **Radix** : `@radix-ui/react-popover`, `-radio-group`, `-dialog` directement (sans shadcn).
- **Versions ✅** : stable **Next.js 16.3.4** (31/08/2026) ; 15.5.x fin de support 21/10/2026 ; correctif sécurité critique 16.3.3 le 25/08/2026 → épingler `next@16.3.x`. Tailwind v4 via `@tailwindcss/postcss` documenté ✅. Node 22 sur Vercel Hobby ❓.

## 3. `next.config.ts` — en-têtes
```ts
import type { NextConfig } from 'next';
const csp = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:", "font-src 'self'", "connect-src 'self'",
  "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'",
].join('; ');
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];
const nextConfig: NextConfig = {
  output: 'standalone', poweredByHeader: false, reactStrictMode: true,
  async headers() { return [{ source: '/(.*)', headers: securityHeaders }]; },
};
export default nextConfig;
```
`style-src 'unsafe-inline'` nécessaire (styles inline Next + Radix) : compromis v1 documenté, chemin v2 = nonce. `script-src 'self'` tient si Next 16 n'émet pas de script inline en prod ❓ (tester en console au bloc 0 ; sinon ajouter le hash). Objectif : F → A sur securityheaders.com.

## 4. Plan de build 1h30 réajusté
**La veille** : `create-next-app@latest` exécuté et commité (TS, Tailwind, App Router, Turbopack) ; Radix + zod + vitest installés ; woff2 Nunito ; `content/model.json`, `fr-fr.json`, les six JSON `data/` prêts ; projet Vercel lié ; Dockerfile testé ; maquettes Claude Design. **À déclarer dans le journal de temps de la note** (préparation d'environnement, hors 1h30).

| Bloc | Livrable | Stop | Prompt Claude Code |
|---|---|---|---|
| 0:00-0:10 | `globals.css` tokens, layout + bandeau + font, `next.config` headers, store, analytics, CI ; push → URL Vercel, securityheaders A | — | « Layout fr Nunito local, @theme tokens HomeServe, bandeau prototype, headers() §3, store useSyncExternalStore, track() dataLayer, workflow vitest+gitleaks+build » |
| 0:10-0:25 | `engine/solaire.ts` + tests (EDF vert) | — | inchangé v2 |
| 0:25-0:40 | Entrée, Simulateur, Résultat (`variant=mur`), wording depuis `content/` | **Oui** | « Écrans 'use client' lisant content/fr-fr.json ; Résultat depuis store ; useSearchParams dans Suspense ; events sim_* » |
| 0:40-0:55 | `engine/machine.ts` + `arbre-rdv.json` + tests | — | inchangé v2 |
| 0:55-1:10 | `MachineRdv`, `sortie/[type]` statiques, Calendrier Popover, Créneaux RadioGroup, Engagement Dialog, OTP mock, ICS, Confirmation | **Oui** | « Rendu par type de nœud avec Radix ; generateStaticParams sorties ; agenda seed CP ; MockBadge ; POST /api/rdv si dispo sinon localStorage » |
| 1:10-1:20 | `engine/pac.ts` + couplage + écran PAC (ou « bientôt ») | **Oui** | inchangé v2 |
| 1:20-1:30 | DebugPanel, README (archi, GKE, mapping Piwik/GTM, sécu), test offline, `next build` vert `○ Static` | — | « README complet ; zéro requête externe et 0 erreur CSP en console » |

## 5. Risques nouveaux et parades
| Risque | Parade |
|---|---|
| Scaffold Next + Turbopack + Tailwind v4 = 15 min | Fait la veille et commité ; `next@16.3.x` épinglé ; `npm ci` avec lockfile. |
| Erreur d'hydratation (sessionStorage, `Date` des créneaux) | Store `useSyncExternalStore` + squelette ; créneaux calculés dans `useEffect` avec `dateRef` figée. |
| CSP casse Next/Radix | Tester au bloc 0 ; `style-src 'unsafe-inline'` prévu ; commit « headers sans CSP » prêt en repli. |
| `useSearchParams` sans Suspense → build échoue | `<Suspense>` systématique. |
| `/api/rdv` absente | `fetch` avec `AbortSignal.timeout(1500)` puis localStorage ; badge « API mock indisponible — enregistré localement ». |
| Vercel Hobby : Next 16.3 ❓, `standalone` ignoré | Sans impact : `standalone` ne sert qu'à Docker ; vérifié au premier déploiement de la veille. |
| Divergence de version avec HomeServe (15.5 vs 16) | `engine/`, `content/`, `data/` indépendants de Next ; seuls `app/` et `components/` à porter, sans API dépréciée. |

## 6. README — « Conteneurisation GKE » (5 lignes)
1. `output: 'standalone'` produit `.next/standalone` : serveur Node autonome ; `Dockerfile` multi-stage (`node:22-alpine`, non-root, `HOSTNAME=0.0.0.0 PORT=3000`), ~150 Mo ❓.
2. Aucune variable d'environnement, aucun appel sortant : l'image tourne derrière GCLB sans egress ; CSP et HSTS servis par Next.
3. Readiness `GET /` ; app stateless (sessionStorage client), scalable sans session affinity.
4. `docker build -t europe-west1-docker.pkg.dev/<projet>/homeserve-poc:<sha> . && docker push`, puis `kubectl set image` ; même `next build` que le preview Vercel.
5. Rebrancher `/api/rdv` sur `api.homeserve.fr` puis Salesforce : remplacer le corps du handler, secrets via Secret Manager/CSI ; le front ne change pas.

## Arbitrages PO sur l'audit technique (rappel)
Acceptés : Next.js App Router + TS + Tailwind v4 + Radix ; tokens de marque avec bandeau « Prototype non officiel — aucune donnée transmise » ; contenu au schéma Prismic ; headers sécurité ; dataLayer agnostique ; Route Handler mock optionnelle ; README GKE. Reportés v2 : Turnstile (clé + réseau), Sentry (réseau), BAN en direct (réseau ; v1 = code postal).

Sources : Next.js static exports (v16.3.4) · endoflife.date Next.js · blog Next.js (16.3, août 2026) · Next.js CSS/Tailwind · `06-audit-technique-homeserve.md`.
