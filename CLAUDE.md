# CLAUDE.md — POC « Mon projet énergie HomeServe »

Prototype de business case (candidature), produit par Benoît Ploquin (product owner) avec Claude. **Non officiel, aucune donnée transmise.** Le cadrage complet vit dans le projet Cowork « Business case IA pour Homeserve » (documents 00–16) ; ce fichier en est le résumé opérationnel pour quiconque code dans ce dépôt.

## Ce que fait le produit
Un propriétaire de maison choisit son projet (solaire, pompe à chaleur, les deux), obtient en 8–10 questions fermées une estimation chiffrée **sans coordonnées** (économies cumulées à horizon 10–30 ans avec un taux de hausse de l'électricité réglable 0–15 %, pack HomeServe et prix, aides 2026, reste à charge, retour sur investissement, courbe « effet ciseaux »), puis se qualifie (machine à états) et réserve un créneau de visite technique dans l'agence la plus proche. Trois entrées : « Estimer mes économies » (tiède), « Prendre rendez-vous » (chaud), bouton d'appel instrumenté (pressé). Ce que le simulateur a demandé n'est **jamais** redemandé au RDV. Aucune impasse : chaque sortie oriente vers une offre HomeServe réelle.

## Décisions non négociables
- **Aucun LLM dans le parcours**, aucune clé, aucune requête externe au runtime (CSP `default-src 'self'`, nonce par requête via `proxy.ts`, `script-src` sans `unsafe-inline`). Les pages sont rendues à la demande (`force-dynamic`) pour porter le nonce : choix assumé (D33), le réseau vers l'hébergeur est requis.
- **Zéro donnée personnelle transmise** : état en `sessionStorage`, RDV de démo en `localStorage`. Bandeau « Prototype non officiel — aucune donnée transmise » sur toutes les pages (déjà dans `app/layout.tsx`).
- **Logique métier en données** : `data/*.json` (hypothèses datées et sourcées, table TAP, zones, agences, barèmes PAC, arbre de qualification) et `content/fr-fr.json` (wording). Un changement de seuil ne touche aucun `.ts`.
- **Moteurs purs et testés** : `engine/*.ts` sans React ; Vitest (`pnpm test`). Non-régression obligatoire : exemple EDF (dept 69, 100–135 m², 101–135 €/mois, radiateurs électriques, véhicule électrique, chauffe-eau thermodynamique, 5 j+) → facture 1 416 €, TAP 29,94 ± 0,1 %, économies 424 €/an.
- **Tout ce qui est simulé le dit à l'écran** (badge « mode démo » / « agenda simulé ») : OTP, créneaux, prospects connus, agence surbookée.
- **Stack alignée sur homeserve.fr** : Next.js 16.3.x App Router, TypeScript, Tailwind v4 (tokens HomeServe dans `app/globals.css`, ne pas en inventer), Radix (popover, radio-group, dialog), pnpm, `output: 'standalone'`. Pas de fonctionnalité Vercel-only. husky + gitleaks en pre-commit, Vitest + Testing Library. Ne pas affaiblir la base de sécurité existante (`next.config.ts`, `proxy.ts`, `test/security-headers.test.ts`).
- Mode A/B : `?variant=mur` insère le mur de contact **avant** le résultat (reproduit le simulateur solaire HomeServe actuel : « un expert vous contactera sous 48 heures ouvrées ») ; `?debug=1` affiche le panneau d'événements.

## Architecture (voir doc 08 v3)
```
app/            routes (page.tsx entrée · (simulateur)/simulateur, resultat · (rdv)/rendez-vous, sortie/[type], confirmation, gerer · api/rdv/route.ts mock optionnel)
components/     'use client' (ChoixProjet, Simulateur, Resultat, MachineRdv, Calendrier, Creneaux, Engagement, MockBadge, DebugPanel, Hypotheses, Recap)
components/ui/  primitives Radix existantes (dialog, popover, radio-group)
lib/            store.ts (sessionStorage + useSyncExternalStore, getServerSnapshot = état vide) · analytics.ts (track → window.dataLayer.push) · content.ts · env.ts (contrat d'environnement zod, existant)
engine/         solaire.ts · pac.ts · couplage.ts · machine.ts (interpréteur de l'arbre JSON) · agenda.ts (créneaux déterministes seed = CP, ICS)
data/           hypotheses.json · tap-base.json · zones.json · agences.json · pac-baremes.json · arbre-rdv.json
content/        model.json (schéma type Prismic simulator_wording) · fr-fr.json
test/           engine/*.test.ts (moteurs) · données, page, primitives UI, en-têtes de sécurité
docs/           cadrage
```
Toute page lisant `variant`/`debug` le fait côté client (`useSearchParams` dans `<Suspense>`). Le rendu est dynamique (nonce CSP) : pas d'objectif `○ Static`.

## Règles métier clés (docs 09, 16)
- Seuils de non-rentabilité solaire (P(e)) : facture < 60 €/mois, surface < 70 m², résidence secondaire, en construction → pas d'arrêt, orientation en fin de parcours (écran O1) + « être rappelé ».
- Sorties immédiates : local pro (S1), appartement (S2), locataire (S3 → assistance 6 €/mois), panneaux existants (S4 → SAV/entretien/dépannage), toit impossible (S5 → PAC), hors zone (S6). URLs réelles dans `content/fr-fr.json`.
- Agenda (D31) : 14 jours, premier créneau J+1 ouvré, visites 60 min, matin/après-midi, jours travaillés de l'agence. Agence = la plus proche du code postal (`agences.json`), hors zone si aucune ≤ 60 km.
- Surbooking (D30) : < 4 créneaux libres sur 10 jours → self-booking masqué, écran « forte demande » + rappel. CP de test `99999` → agence `TEST` surbookée.
- Prospect existant (D29, D32, mock) : même téléphone/email qu'un RDV en localStorage → « vous avez déjà un rendez-vous » ; téléphone `0600000001` → « un conseiller vous a déjà contacté ; votre créneau reste réservable ».
- « Être rappelé » toujours à parité visuelle avec « choisir un créneau » ; consentement horodaté ; case « ne pas m'appeler ».
- Effet ciseaux : facture et économies inflatées au même taux ; conventions EDF pour la non-régression (facture à horizon N = N+1 incréments avec `Math.ceil`, cumul sur N+1 termes) puis libellés justes à l'affichage (« facture annuelle estimée dans N ans »).

## Événements (dataLayer)
`sim_start`, `sim_step_{n}`, `sim_result_shown`, `sim_inflation_changed`, `sim_option_toggled`, `sim_hypotheses_opened`, `sim_to_booking`, `booking_start{source}`, `booking_step_{n}`, `booking_exit_{type}`, `booking_disqualified_{regle}`, `booking_duplicate_detected`, `booking_plateau_conflict`, `booking_agency_overbooked`, `booking_contact_submitted`, `booking_otp_ok`, `booking_slot_selected`, `booking_engaged`, `booking_slot_confirmed`, `booking_out_of_hours`, `callback_requested`, `call_click{source, step}`. Chaque événement porte `variant`.

## Commandes
`pnpm dev` · `pnpm typecheck` · `pnpm test` · `pnpm build` · `pnpm start`

## Conventions
Français partout (UI, commentaires utiles, commits). Commits courts, impératif, préfixe conventionnel (`feat:`, `fix:`, `chore:`, `test:`, `docs:`). Ne jamais ajouter de dépendance réseau au runtime ni de variable d'environnement sans décision du product owner. Ce qui n'est pas dans le périmètre v1 est listé dans le README (statut POC / MOCK / CIBLE) : c'est un choix, pas un oubli.
