# Bootstrap — premier message pour la session Claude Code

Le dépôt a été rempli par glisser-déposer depuis le navigateur ; les fichiers cachés (dotfiles) n'ont pas pu être déposés. Recréer exactement ceux-ci, puis installer, tester, builder et pousser.

## 1. `.gitignore`
```
/node_modules
/.pnp
.pnp.*
/coverage
/.next/
/out/
/build
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
.env*
!.env.example
.vercel
*.tsbuildinfo
next-env.d.ts
```

## 2. `.env.example`
```
# Aucun secret requis par ce prototype.
# Tout le calcul est côté client ; aucune API externe n'est appelée au runtime.
# Ce fichier existe pour documenter l'absence de configuration secrète et
# accueillir, en v2, une clé publique bornée (ex. Supabase anon key sous RLS).
```

## 3. `.pre-commit-config.yaml`
```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.24.3
    hooks:
      - id: gitleaks
```

## 4. `.github/workflows/ci.yml`
```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - run: pnpm build
```

## 5. Vérifications
```bash
pnpm install --frozen-lockfile
pnpm test        # 1 test smoke vert
pnpm build       # toutes les routes ○ Static
```
Puis commit « chore: dotfiles + vérification du squelette » et push sur `main`. Ensuite, lire `CLAUDE.md` et `docs/` : c'est le cadrage complet. Les données `data/zones.json` et `data/agences.json` sont prêtes ; les autres fichiers de données (`hypotheses.json`, `tap-base.json`, `pac-baremes.json`, `arbre-rdv.json`, `content/fr-fr.json`) arrivent par le même canal ou sont à produire depuis `docs/` selon les instructions du product owner.
