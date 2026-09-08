# Architecture définitive — POC HomeServe « Simulateur solaire + PAC → RDV » (agent Architecte v2 — 07/09/2026)

✅ vérifié (source datée) · 🔶 source tierce · ❓ supposé.

## Contestations acceptées par le PO
1. **Tailwind via CDN incompatible avec la démo hors réseau** → Tailwind via PostCSS (`@tailwindcss/vite`), CSS dans le bundle, aucun asset externe au runtime.
2. **MaPrimeRénov' PAC 2026 profil Violet = 2 000 €** selon l'article HomeServe (maj 26/08/2026), non 3 000 € (quelleenergie.fr). Barème retenu : 5 000 / 4 000 / 2 000 / 0, écart documenté dans `pac-baremes.json`.
3. **Vite + React + TS**, mais `engine/` en TS pur sans React (tests Vitest < 1 s).

## 1. Architecture cible

```
homeserve-poc/
├─ README.md                    note technique (archi, hypothèses, sécu, métriques)
├─ .gitignore  .env.example     .env.example vide + « aucun secret requis »
├─ .pre-commit-config.yaml      hook gitleaks
├─ .github/workflows/ci.yml     vitest + gitleaks detect + build
├─ vite.config.ts  tsconfig.json  tailwind.config.ts  postcss.config.js
├─ index.html
├─ src/
│  ├─ main.tsx                  Router (hash) : /, /simulateur, /resultat, /rdv, /confirmation, /gerer
│  ├─ app/state.ts              store sessionStorage typé (ProjetState), variant & debug depuis l'URL
│  ├─ app/analytics.ts          track(event, payload) → window.dataLayer.push + bus debug
│  ├─ engine/solaire.ts         fonction pure EDF réappropriée (TAP, packs, ROI, projection)
│  ├─ engine/pac.ts             fonction pure PAC (livrable en dernier, stub « bientôt » si absent)
│  ├─ engine/couplage.ts        règle solaire + PAC
│  ├─ engine/machine.ts         interpréteur générique de l'arbre JSON
│  ├─ engine/agenda.ts          créneaux 21 j déterministes (seed = CP), ICS
│  ├─ engine/__tests__/         solaire, pac, machine, agenda
│  ├─ data/hypotheses.json      constantes datées & sourcées, affichées
│  ├─ data/tap-base.json        5 zones × 5 tranches
│  ├─ data/zones.json           dept → {zoneSolaire, zoneClimatique, productible}
│  ├─ data/arbre-rdv.json       machine à états module B
│  ├─ data/agences.json         agences RGE, départements couverts
│  ├─ data/pac-baremes.json     MPR 2026, CEE, prix HomeServe, SCOP, prix énergies
│  ├─ ui/                       Choix, Progress, Recap, Hypotheses, MockBadge, DebugPanel
│  └─ screens/                  Entree, Simulateur, Resultat, Rdv, Sortie, Confirmation
└─ public/favicon.svg
```

### Flux A → B
```
/ (Entrée : solaire | PAC | les deux)
  → /simulateur (8 questions fermées, sim_step_n) → engine/solaire (+pac, +couplage)
  → /resultat  [variant=defaut : chiffres visibles, CTA « Planifier mon bilan »]
               [variant=mur   : coordonnées AVANT chiffres, comme les tunnels produit actuels]
  → sessionStorage.projet = {reponses, resultats, variant}
  → /rdv : machine.start(arbre, prefill=projet.reponses) → nœuds pré-remplis sautés
       ├─ SORTIE (pro, assistance, entretien, territoire, alternatives) → /sortie/:type (CTA offre réelle)
       ├─ P(e) déclenché → flag nonEligible, parcours continue jusqu'aux coordonnées → orientation
       └─ coordonnées → OTP mock → éligibilité → calendrier → engagement → /confirmation (ICS)
```

### État partagé (`sessionStorage["hs.projet"]`)
```ts
type ProjetState = {
  version: 1; variant: "defaut"|"mur"; debug: boolean;
  projet: "solaire"|"pac"|"les_deux";
  reponses: Partial<Record<QuestionId, string|string[]>>;
  resultats?: { solaire?: SolaireResult; pac?: PacResult; couplage?: CouplageResult };
  rdv?: { nonEligible: string[]; sortie?: string; agence?: string; creneau?: string; typeRdv?: string };
  events: string[];
}
```
`localStorage["hs.rdv"]` conserve le dernier RDV (doublon, écran « gérer »).

### Contrats de données (extraits)
```json
// hypotheses.json
{ "date": "2026-09-07",
  "prix_elec_kwh": {"v": 0.2001, "src": "TRVE base 6 kVA 01/08/2026"},
  "prix_surplus_kwh": {"v": 0.011}, "tva_pv": 0.055, "prime_autoconso": 0,
  "inflation_energie": 0.04, "tap_min": 12, "tap_max": 63, "tap_batterie_max": 84,
  "packs": {"3": 6490, "6": 10190, "9": 12990},
  "bonus": {"pac": -9.2, "gaz_fioul_bois": 7, "autre": 7, "chauffage_principal": -7.1, "secondaire": 2.1,
            "clim": 3.7, "ve": 8.9, "ce_elec": 19.6, "ce_thermo": 16.3, "occupation_moins": -8.7} }

// tap-base.json — TAP de base (%) par zone d'ensoleillement × tranche de surface
// ⚠️ La table EDF est un score relatif : l'exemple EDF (TAP final 29,94 avec +25,2 pts de bonus)
// implique une base ≈ 4,7 %. Calibration : Z3 / 100-135 m² = 4,74, ±1,5 pt par zone, −1 pt par tranche.
// La dérivation PVGIS sert à ordonner les zones, pas à fixer la valeur absolue. Documenté à l'écran.

// zones.json
{ "69": {"zs": "Z3", "zc": "H1", "prod": 1150}, "13": {"zs": "Z5", "zc": "H3", "prod": 1400},
  "59": {"zs": "Z1", "zc": "H1", "prod": 950},  "33": {"zs": "Z4", "zc": "H2", "prod": 1250}, "75": {"eligible": false} }

// arbre-rdv.json (extraits)
{ "start": "projet",
  "noeuds": {
    "projet":  {"q": "Votre projet concerne…", "opts": {"maison": "statut", "entreprise": "@pro"}},
    "statut":  {"q": "Vous êtes…", "opts": {"proprietaire": "panneaux", "locataire": "@assistance"}},
    "facture": {"prefill": "facture_mensuelle", "pe": {"lt": 60, "regle": "facture_faible"}, "next": "residence"},
    "surface": {"prefill": "surface_sol", "pe": {"lt": 70, "regle": "surface_faible"}, "next": "box"},
    "localisation": {"type": "form", "champs": ["adresse","cp","ville"], "guard": {"cp_prefix": ["20","75","96","97","98","99"], "to": "@territoire"}, "next": "identite"} },
  "sorties": { "@assistance": {"titre": "Locataire ? Protégez votre logement", "offre": "Dépannez-moi Locataire 6 €/mois", "url": "https://assistance.homeserve.fr/assistance/plomberie/"} },
  "seuils_affiches": ["facture_faible < 60 €/mois", "surface_faible < 70 m²"] }

// agences.json
[ {"id": "LYO", "nom": "HomeServe Rénov' Lyon", "depts": ["69","01","38","42"], "visio": false, "jours": [1,2,3,4,5], "creneaux": ["08:30","10:30","14:00","16:00"]} ]

// pac-baremes.json
{ "date": "2026-09-07", "scop_air_eau": {"v": 2.9, "src": "ADEME campagne terrain 2023-24 (Que Choisir)"},
  "prix": {"gaz_kwh": 0.1347, "fioul_litre": 1.732, "fioul_kwh_pci": 9.96, "elec_kwh": 0.2001},
  "rendement_chaudiere": {"gaz": 0.88, "fioul": 0.85, "elec": 1.0},
  "prix_homeserve": {"min": 7000, "max": 16000, "par_surface": {"0": 9000, "2": 11500, "3": 14000}},
  "mpr_2026": {"bleu": 5000, "jaune": 4000, "violet": 2000, "rose": 0, "cond": ["logement > 15 ans", "résidence principale", "RGE"]},
  "cee_coup_de_pouce_fossile": {"H1": 5110, "H2": 4259, "H3": 2981}, "cee_depuis_elec": 900,
  "couplage": {"part_conso_pac_couverte_solaire": 0.25, "bonus_tap_pac_couple": 3.0} }
```

## 2. Moteur PAC simplifié (`engine/pac.ts`)

Entrées : énergie actuelle {gaz, fioul, elec}, dépense chauffage annuelle (tranche → médiane), surface (tranche), dept, profil revenus {bleu, jaune, violet, rose}, logement > 15 ans.

```
kWh_utile   = depense / prix[energie] × rendement[energie]      // fioul : prix_litre / 9,96
conso_pac   = kWh_utile / SCOP                                    // SCOP 2,9
cout_pac    = conso_pac × prix_elec
economie_an = depense − cout_pac
prix        = prix_homeserve.par_surface[segT]
aides       = (age>15 ? mpr[profil] : 0) + (energie ∈ {gaz,fioul} ? cee[zc] : cee_depuis_elec)
reste       = max(prix − aides, 0) ; retour = reste / economie_an
```
Sources : SCOP terrain 2,9 ✅ Que Choisir/ADEME ; gaz 0,1347 €/kWh TTC prix repère CRE sept. 2026 ✅ (+5,6 % au 1/09, Service-public) ; fioul 1,732 €/L au 07/09/2026 ✅ prixfioul.fr ; élec 0,2001 €/kWh au 1/08/2026 ✅ ; MPR 5 000/4 000/2 000/0 ✅ HomeServe 26/08/2026 ; CEE coup de pouce H1/H2/H3 ✅ (même article) ; fourchette 7 000–16 000 € ❓ ; CEE depuis élec 900 € ❓ ; rendements chaudière ❓.

**Couplage « les deux »** : (a) coefficient PAC du moteur solaire passe de −9,2 à +3,0 (PAC pilotée consomme en journée) ; (b) `cout_pac × (1 − 0,25)` : 25 % de la conso PAC couverte par l'autoconsommation ❓ (paramètre). Cohérent avec le pack Ultra Bas Carbone HomeServe (HEMS Smart Grid).

Tests : gaz 1 800 €/an, 100-135 m², dept 69, jaune, > 15 ans → kWh_utile 11 760, conso_pac 4 055 kWh, coût 811 €, économie ≈ 989 €/an, aides 4 000 + 5 110, reste 2 390, retour ≈ 2,4 ans ; élec radiateurs 1 800 € → économie ≈ 1 179 €, aides MPR + 900 ; rose + neuf → aides 0 ; fioul L→kWh ; couplage.

## 3. Interpréteur (`engine/machine.ts`)

Formats : nœud `{q, opts:{valeur→cible}, prefill?, pe?:{lt|eq, regle}, type?:"choix"|"form"|"otp"|"calendrier"|"info", guard?, next?}` ; transition = id de nœud ou `@sortie` ; sortie `{titre, texte, offre, url, cta}`.

```
function start(arbre, prefill, hooks):
  ctx = {courant: arbre.start, reponses: {...prefill}, nonEligible: [], historique: []}
  return avancer(ctx)

function avancer(ctx):
  n = arbre.noeuds[ctx.courant]
  while n.prefill && ctx.reponses[n.prefill] != null:
    evaluerPe(n, ctx.reponses[n.prefill], ctx)
    ctx.courant = n.next ; n = arbre.noeuds[ctx.courant]
  return {noeud: n, ctx}

function repondre(ctx, valeur):
  n = arbre.noeuds[ctx.courant]
  ctx.reponses[n.id] = valeur ; ctx.historique.push(n.id)
  hooks.track("booking_step_" + ctx.historique.length)
  if n.guard && match(n.guard, valeur): return sortie(n.guard.to, ctx)
  evaluerPe(n, valeur, ctx)
  cible = n.opts ? n.opts[valeur] : n.next
  if cible.startsWith("@"): return sortie(cible, ctx)
  ctx.courant = cible ; return avancer(ctx)

function evaluerPe(n, valeur, ctx):
  if n.pe && compare(n.pe, valeur) && !ctx.nonEligible.includes(n.pe.regle):
    ctx.nonEligible.push(n.pe.regle) ; hooks.track("booking_disqualified_" + n.pe.regle)
    // pas d'arrêt : parcours jusqu'aux coordonnées, l'écran éligibilité oriente

function sortie(id, ctx):
  hooks.track("booking_exit_" + id.slice(1)) ; return {sortie: arbre.sorties[id], ctx}

function retour(ctx): ctx.courant = ctx.historique.pop() ; delete ctx.reponses[ctx.courant]
```
`Rdv.tsx` ne connaît que `{noeud, ctx}` ; `variant=mur` réordonne `arbre.start` vers un nœud `coordonnees_avant`.

## 4. Hébergement : Vercel Hobby
Sans carte à l'inscription ✅ (zplatform 25/08/2026 ; Render 23/04/2026, qui confirme aussi Cloudflare). Vercel gagne : intégration GitHub, **preview URL par branche** pour montrer `variant=mur` vs défaut côte à côte ; Cloudflare Pages en cours de fusion dans Workers. Clause « non commercial » ✅ mentionnée dans le README.

## 5. Sécurité — README « Zéro secret par construction »
Aucune variable d'environnement lue (`grep -r "import.meta.env\|process.env" src/` vide) ; `.env.example` vide et commenté (réservé v2 Supabase anon key bornée par RLS) ; `.gitignore` `.env*`, `!.env.example`, `node_modules`, `dist`, `.vercel` ; gitleaks pre-commit + CI ; GitHub Push Protection + Secret Scanning ; aucune requête réseau au runtime (capture onglet Réseau + `Content-Security-Policy: default-src 'self'` dans `vercel.json`) ; coordonnées uniquement en sessionStorage, bandeau « Prototype — aucune donnée envoyée ».

## 6. Plan de build 1h30

**La veille** : comptes GitHub + Vercel liés ; pre-commit, gitleaks, Node 22 ; `zones.json`, `agences.json`, `tap-base.json` calibrés ; maquettes Claude Design des 6 écrans ; URLs réelles des offres HomeServe ; brief dans `docs/`.

| Bloc | Livrable | Stop possible | Prompt Claude Code (résumé) |
|---|---|---|---|
| 0:00-0:10 | Scaffold Vite+React+TS+Tailwind PostCSS, hash router 6 routes, `state.ts`, `analytics.ts`, CI, Vercel « Hello » | — | « Scaffold …, store sessionStorage typé ProjetState, dataLayer.push, vitest, gitleaks pre-commit, vercel.json CSP self » |
| 0:10-0:25 | `engine/solaire.ts` + tests | — | « Implémente d'après ref-04 §1.2 et hypotheses.json ; tests : dept 69 → 1416/29,94/424 ; clamp 12/63/84 » |
| 0:25-0:40 | Écrans Entrée + Simulateur + Résultat (chiffres, packs, ROI, projection, hypothèses), `variant=mur` | **Oui** | « Écrans depuis maquettes ; variant=mur coordonnées avant ; events sim_* » |
| 0:40-0:55 | `machine.ts` + `arbre-rdv.json` + tests | — | « Interpréteur générique §3 ; tests : chaque P(e), chaque @sortie, prefill saute facture/surface » |
| 0:55-1:10 | `Rdv.tsx`, Sortie cross-sell, OTP mock, `agenda.ts` (seed CP, ICS), Confirmation, `MockBadge` | **Oui** | « Rendu par type de nœud, sorties avec CTA url, OTP 'mode démo', créneaux 21 j, ICS Blob, localStorage doublon » |
| 1:10-1:20 | `engine/pac.ts` + `couplage.ts` + tests ; écran PAC (ou « bientôt » assumé) | **Oui** | « Moteur PAC selon pac-baremes.json et §2 ; si retard, carte 'bientôt' avec hypothèses » |
| 1:20-1:30 | `DebugPanel` (`?debug=1`), README, gitleaks vert, test offline, captures | — | « Panneau debug ; README archi/hypothèses/sécu/métriques ; build sans requête externe » |

## 7. Risques de démo et parades
Wifi absent → `vite preview` local + Vercel + `dist/` sur clé USB, zéro asset externe. Navigateur du jury → pas d'API exotique, sessionStorage testé en privé Safari, ICS testé 3 navigateurs. Mobile → responsive + QR code. Données incohérentes → clamps, tests de propriétés (économie ≤ facture, reste ≥ 0), « ordre de grandeur » + hypothèses. Écart avec EDF → non-régression sur l'exemple, seule Z3 ancrée. Confusion mock → `MockBadge` systématique + bandeau prototype. Accès direct /rdv → machine tolère `prefill = {}`.

## 8. Tests
**Solaire** : exemple EDF → 1 416 € / 29,94 ± 0,1 / 424 € / batterie 50,94 ; clamps 12/63/84 ; chaque coefficient ; kWc par (segT, segF) ; prix pack ; ROI ; projection 30 valeurs, Math.ceil, inflation, échantillonnage 5 ans ; zone inconnue → erreur.
**PAC** : 5 cas §2 ; fioul L→kWh ; aides 0 si < 15 ans ; rose exclu ; CEE H1/H2/H3 ; couplage ; économie jamais négative (flag).
**Machine** : 5 P(e) flag sans arrêt ; seuils lus du JSON (60/70) ; chaque @sortie ; guard CP ; sous-arbre amiante ; chaînage avec/sans prefill ; `retour()` ; `variant=mur` ; ordre des événements.
**Agenda** : déterminisme par CP ; 21 jours ouvrés agence ; ICS valide Europe/Paris ; doublon localStorage.

Sources : Vercel Hobby docs · zplatform (carte) · Render 2026 (free tiers) · HomeServe aides PAC 2026 (26/08/2026) · Quelle Énergie MPR · Que Choisir/ADEME SCOP · Hellowatt prix repère gaz · Service-public gaz +5,6 % · lesfurets TRVE · prixfioul.fr · Hellowatt CEE PAC.
