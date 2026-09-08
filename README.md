# homeserve-poc

Proof of concept HomeServe — Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Turbopack · pnpm.

## Prérequis

- Node.js 22+
- pnpm (via `corepack enable pnpm`)
- [gitleaks](https://github.com/gitleaks/gitleaks) — requis par le hook de pre-commit

## Démarrage

```bash
pnpm install       # installe les dépendances et le hook husky
pnpm dev           # serveur de développement (Turbopack)
pnpm build         # build de production (Turbopack)
pnpm start         # sert le build standalone sur http://localhost:3000
pnpm test          # Vitest
pnpm typecheck     # tsc --noEmit
```

## Stack

| Domaine    | Choix                                                    |
| ---------- | -------------------------------------------------------- |
| Framework  | Next.js 16.3 (App Router, Turbopack)                     |
| Langage    | TypeScript 5 (`strict`, `noUncheckedIndexedAccess`)      |
| Styles     | Tailwind CSS v4 (`@import "tailwindcss"`, zéro config JS) |
| UI         | Radix UI — Dialog, Popover, Radio Group                  |
| Validation | zod (contrat d'environnement dans `lib/env.ts`)          |
| Tests      | Vitest + Testing Library (jsdom)                         |
| Lint       | aucun ESLint (choix projet)                              |

## En-têtes de sécurité

`next.config.ts` est la source de vérité pour les en-têtes de sécurité :

| En-tête                     | Valeur                                          |
| --------------------------- | ----------------------------------------------- |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload`   |
| `X-Frame-Options`           | `DENY`                                          |
| `X-Content-Type-Options`    | `nosniff`                                       |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`               |
| `Permissions-Policy`        | caméra, micro, géoloc, paiement… tous refusés   |
| `Cross-Origin-Opener-Policy`| `same-origin`                                   |
| `Content-Security-Policy`   | stricte, à nonce (voir ci-dessous)              |

### CSP stricte à nonce — et pourquoi les routes sont dynamiques

La politique n'autorise **jamais** `'unsafe-inline'` pour les scripts. Elle
repose sur un nonce par requête + `'strict-dynamic'` :

```
default-src 'self'; script-src 'self' 'nonce-<aléatoire>' 'strict-dynamic'; …
object-src 'none'; base-uri 'none'; frame-ancestors 'none'
```

`buildContentSecurityPolicy()` est défini dans `next.config.ts` ; `proxy.ts`
(ex-`middleware.ts`, renommé selon la convention Next.js 16) génère le nonce et
l'injecte à la fois sur la requête — c'est là que Next.js le relit pour signer
ses propres scripts de bootstrap — et sur la réponse.

**Conséquence assumée :** un nonce ne peut être apposé que pendant un rendu
dynamique, le pré-rendu statique ayant lieu au build, avant que le nonce
n'existe. `app/layout.tsx` déclare donc `export const dynamic = "force-dynamic"`.
C'est le prix d'une CSP réellement stricte : les pages sont rendues à la
demande plutôt que servies depuis le cache statique. Pour revenir au pré-rendu
statique, il faudrait retirer `force-dynamic` **et** accepter `'unsafe-inline'`
dans `script-src`.

Vérifié au navigateur (Chromium) sur le build de production : 8/8 scripts
portent le nonce de l'en-tête, 0 violation CSP, 0 erreur console.

## Secrets

- `.env.example` est volontairement vide ; `.gitignore` exclut tout `.env*` sauf lui.
- **pre-commit** (`.husky/pre-commit`) lance `gitleaks` sur les fichiers indexés
  et bloque le commit en cas de fuite. Si gitleaks est absent, le commit est
  refusé plutôt que la vérification silencieusement ignorée.
  Contournement explicite : `GITLEAKS_SKIP=1 git commit …`
- **CI** rejoue le scan sur l'historique complet (`.gitleaks.toml`).

## CI

`.github/workflows/ci.yml` — install → typecheck → test → gitleaks → build.

## Docker

L'image s'appuie sur `output: "standalone"` (build multi-étapes, utilisateur non
root, healthcheck) :

```bash
docker build -t homeserve-poc .
docker run --rm -p 3000:3000 homeserve-poc
```
