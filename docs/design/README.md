# Handoff : POC « Mon projet énergie » (HomeServe) — maquettes v1

## Overview
Prototype destiné à être intégré dans www.homeserve.fr. Un propriétaire de maison choisit son projet (solaire, pompe à chaleur, les deux), obtient en 8 questions une estimation chiffrée **sans donner ses coordonnées** (économies cumulées avec un taux de hausse de l'électricité réglable, pack et prix, aides, reste à charge), puis se qualifie et réserve un créneau de visite technique dans l'agence la plus proche. S'il n'est pas éligible, il est orienté vers une autre offre HomeServe — jamais vers une impasse.

Trois entrées, un moteur : « J'estime mes économies » (simulateur → RDV pré-rempli), « Je prends rendez-vous » (qualification directe), bouton d'appel (présent partout, discret). **Ce que le simulateur a demandé n'est jamais redemandé au RDV.**

## About the Design Files
`Mon projet energie - Maquettes POC.dc.html` est une **référence de design écrite en HTML** (board de 20 planches, styles inline), pas du code de production. La tâche est de **recréer ces écrans dans l'environnement du site cible** (framework et design system HomeServe existants) — ou, à défaut, dans le framework le plus adapté (Next.js/React recommandé pour un widget intégrable). Le fichier s'ouvre dans un navigateur (avec `support.js` à côté) ; on peut aussi lire directement le markup : chaque planche est un `<div id="…">` nommé (voir « Screens »).

## Fidelity
**Hi-fi.** Couleurs, typographie, espacements, rayons, états et copies sont finaux. Les valeurs chiffrées (économies, prix, aides) sont des ordres de grandeur pour la maquette — le moteur de calcul les remplacera. Les pictogrammes sont Lucide (trait 1,75 px).

## Contraintes globales
- Mobile first **390 px** ; desktop **1440 px** pour E0, AR-solaire, B-calendrier.
- Bandeau permanent en haut de chaque écran : fond `#fff0e3`, texte `#c24e00`, 12 px/700 : « Prototype non officiel — aucune donnée transmise ».
- Mot-symbole « HomeServe » en Nunito 800, `#e22c22`, 19 px (mobile) / 24 px (desktop). Aucun logo, aucune photo, aucune donnée réelle.
- Corps ≥ 16 px ; **18 px sur AR** et écrans seniors. Cibles tactiles ≥ 44 px. Contraste AA.
- Focus visible : `border:1.5px solid #258386; outline:3px solid #7fbdbf`. Erreur : bordure `#f0463c`, message `#b3231b` 13 px/700. Chargement : squelettes `#f4f4f4`.
- Transitions 150 ms, aucune animation décorative.
- Sélection d'une carte à choix unique **avance directement** (pas de bouton Valider). Curseurs et multi-sélections : bouton « Continuer ».

## Design Tokens
Couleurs (nom → hex) :
- corail-600 `#e22c22` (primaire, CTA, sélection) · corail-500 `#f0463c` (accent, crayon, erreur) · corail-100 `#fdeceb` (fond sélection)
- canard-500 `#258386` (info, lien, série « avec solaire ») · canard-300 `#7fbdbf` (focus) · canard-100 `#e9f3f3` (bandeaux info, aire courbe) · canard-700 `#1e6b6e` (texte sur canard-100)
- vert-600 `#255a2e` (succès texte) · vert-400 `#4f9a5c` (picto succès) · vert-100 `#e6f2e8`
- orange-500 `#fb6500` · orange-600 `#c24e00` (texte sur orange-100) · orange-100 `#fff0e3`
- neutre-700 `#1e1e1e` · neutre-500 `#5c5c5c` · neutre-400 `#8a8a8a` · neutre-300 `#c9c9c9` · neutre-200 `#e3e3e3` · neutre-100 `#f4f4f4` · blanc `#ffffff`
- error-700 `#b3231b`

Typographie : **Nunito** (400/600/700/800). Échelle : xs 12 · sm 13–14 · base 16 · lg 17–18 · xl 19–20 · 2xl 24–26 · 3xl 29 · 5xl 46 (héros mobile) / 58 (héros desktop) · H1 desktop 52. Titres 800, letter-spacing −0.01 à −0.02em ; line-height 1.1–1.2 titres, 1.4–1.5 corps.

Espacement : unité 4 px ; padding écran 20 px (mobile) / 64 px (desktop) ; gap cartes 12 px ; gap sections 20 px.

Rayons : boutons/chips/pilules 999 ; champs 12 ; cartes options 16 (xl) ; cartes contenu / tuiles 20 (2xl) ; modale 24 ; petits badges 6–8.

Ombres : CTA primaire `0 2px 6px rgba(226,44,34,.24)` ; barre collante `0 -2px 8px rgba(30,30,30,.08)` ; poignée curseur `0 2px 6px rgba(30,30,30,.2)`. Ailleurs : aucune, séparation par contour `#e3e3e3` 1 px.

## Composants récurrents
- **Bouton primaire** : h 48 (barre) / 56 (CTA pleine largeur), pilule, `#e22c22`, texte blanc 17–18 px/800.
- **Bouton secondaire** : même géométrie, fond blanc, `border:2px solid #1e1e1e`, texte `#1e1e1e`.
- **Bouton retour rond** : 48×48, `border:1px solid #e3e3e3`, icône `arrow-left` 20.
- **Lien téléphone** : `#258386`, 13–16 px/700, icône `phone` / `phone-call`.
- **Carte option** : fond blanc, `border:1px solid #e3e3e3`, r 16, padding 16, picto 32, libellé 16/700. Survol : bordure `#8a8a8a`. Sélectionnée : `border:2px solid #e22c22`, fond `#fdeceb`, picto `#e22c22`. Multi : coche 20×20 r 6 `#e22c22` en haut à droite.
- **Stepper à pastilles** : pastille 24 (mobile) / 26 (desktop), active `#e22c22`, faite `#1e1e1e` + `check`, à venir `#c9c9c9` ; libellés 13/800 (active) ou 13/700 `#8a8a8a` ; trait 2 px `#e3e3e3` (fait : `#1e1e1e`). Compteur « 3 / 8 » 13/700 `#8a8a8a`.
- **Chips** (horizon, créneaux) : padding 9–11×16, pilule, `border:1px solid #e3e3e3` ; active fond `#e22c22` blanc/800 ; indisponible `#c9c9c9` barré.
- **Segmented control** : conteneur blanc pilule padding 4 gap 4, segments flex:1 15/700 padding 10 ; actif `#e22c22` blanc/800.
- **Badge** : pilule padding 4–6×10–12, 12–13/700–800 ; vert (`#e6f2e8`/`#255a2e`), canard (`#e9f3f3`/`#1e6b6e`), orange (`#fff0e3`/`#c24e00`), corail (`#fdeceb`/`#e22c22`).
- **Bandeau info** : fond `#e9f3f3`, r 14, padding 14, icône `info` 20 `#258386`, texte 14.
- **Champ** : h 48, r 12, `border:1px solid #c9c9c9`, padding 0 14, 16 px ; libellé 13/600 au-dessus.
- **Barre collante bas** : padding 14×20, `border-top:1px solid #f4f4f4`, retour rond + (optionnel) bouton primaire flex:1.

## Screens / Views (id du `<div>` dans le HTML)

### E0 — Accueil (`E0` mobile, `E0-desktop`)
Sur-titre 13/800 uppercase `#258386` « Propriétaire d'une maison ? ». H1 29 px (52 desktop)/800 « Votre projet énergie, chiffré en 2 minutes ». 3 badges verts : Sans coordonnées · Gratuit · Sans engagement. Deux cartes d'entrée pleine largeur r 20 padding 20 (28 desktop) avec picto 52×52 (64) dans un carré r 16 : (1) primaire `#e22c22` « J'estime mes économies » / « solaire, pompe à chaleur ou les deux », icône `sun` ; (2) secondaire blanc `border:2px #1e1e1e` « Je prends rendez-vous » / « visite technique gratuite dans votre agence », icône `calendar-check`. Lien « Appeler mon agence » `#258386`. Bandeau chiffres (fond `#f4f4f4` r 16) : 21 agences RGE · 1 200 000+ clients · depuis 2001. Footer `#1e1e1e`. Desktop : grille 2 colonnes `1fr / 600px`, cartes à droite.

### Q — Gabarit question du simulateur (`Q-choix`, `Q-curseur`, `Q-multi`, `Q-pac`)
En-tête : mot-symbole + lien appel, stepper 2 étapes « Votre logement · Vos équipements », compteur « n / 8 ». Titre 24/800, sous-titre 16 `#5c5c5c`.
- `Q-choix` (A5 chauffage) : grille 2 col gap 12, cartes min-h 112 : Radiateurs électriques (`thermometer`), Pompe à chaleur (`fan`), Gaz, fioul ou bois (`flame`), Autre (`circle-help`). Barre bas : retour seul + mention « Votre choix enregistre et passe à la suite ».
- `Q-curseur` (A8 facture) : valeur courante 22/800 `#e22c22` « 101 – 135 €/mois » ; piste 8 px `#e3e3e3` r 999, remplissage `#f0463c`, 5 crans 6×24 `#c9c9c9`, poignée 44 `#e22c22` bord blanc 3 ; libellés `< 60 · 60–100 · 101–135 · 136–175 · > 175` 12/700 (actif corail). Bandeau info. Barre bas : retour + « Continuer ».
- `Q-multi` (A6 équipements) : badge corail « 3 sélectionnés », grille 2 col gap 10, 8 cartes min-h 96 picto 28 (Voiture électrique `car`, Piscine `waves`, Ballon d'eau chaude `droplet`, Climatisation `air-vent`, Sèche-linge `washing-machine`, Congélateur `refrigerator`, Poêle ou insert `flame-kindling`, Borne de recharge `battery-charging`) + carte pleine largeur « Aucun de ces équipements » (`circle-slash`). « Continuer ».
- `Q-pac` : A9 revenus — bascule pilule « Hors Île-de-France / Île-de-France » (fond `#f4f4f4`, actif blanc), 4 cartes horizontales `users` « jusqu'à 22 000 € / pour 2 personnes », etc. ; A10 année de construction — 4 cartes `house` : Avant 1975 · 1975 – 1999 · 2000 – 2012 · Après 2012.

### AR — Écran de résultat (`AR-solaire`, `AR-pac`, `AR-lesdeux`, `AR-solaire-desktop`)
Ordre vertical, corps 17–18 px :
1. « Votre estimation » 26/800 + bouton rond « ? » 44 `border:2px #258386` « Comprendre mon résultat » → ouvre `AR-onboarding`.
2. **Bloc taux** (carte contour `#e3e3e3` r 16) : « Hausse annuelle du prix de l'électricité » 16/700 ; − (rond 48 contour) / **4 %** 32/800 corail / + (rond 48 `#e22c22`) ; bornes 0–15 ; source 12 `#8a8a8a` « Moyenne 2016-2025, tarifs réglementés ». Recalcul en direct.
3. **Chips horizon** 10 · 15 · 20 · 25 · 30 ans (active 25).
4. **Tuile héros** `border:2px #e22c22` r 20 padding 24 centré : « Vos économies cumulées sur 25 ans » 14/700 `#5c5c5c`, valeur **46/800 `#e22c22`** « 33 188 € », mention 14.
5. **Deux tuiles** grille 2 col : « Sans solaire 10 402 € » (fond `#f4f4f4`, valeur 24/800) / « Avec solaire 7 988 € » (blanc, `border:1px #258386`, icône `sun`, valeur `#258386`).
6. **Courbe effet ciseaux** (SVG, viewBox 326×170 mobile / 800×240 desktop) : série « sans » `#8a8a8a` 2.5 px, série « avec » `#258386`, aire `#e9f3f3` légendée « vos économies », axe années tous les 5 ans 11 px `#8a8a8a`, pas de grille. Phrase 17/600 : « Chaque point de hausse supplémentaire, c'est **+2 100 €** d'économies sur 25 ans. » (montant 800 corail).
7. **Configurateur « Mon installation »** — carte `#f4f4f4` r 20 padding 18, titre 19/800, badge « recalcul immédiat ». Trois segmented controls (libellé 15/700 `#5c5c5c` au-dessus) : Centrale solaire 3 · **6** · 9 kWc ; Stockage **Aucun** · Virtuel (15 €/mois) · Batterie (sur devis) ; Couplage pompe à chaleur **Non** · Oui. Chaque changement met à jour héros, tuiles et courbe. `AR-lesdeux` : couplage **Oui** par défaut, 9 kWc, Virtuel. `AR-pac` : lignes « Ajouter du solaire : Non · Oui » et « Eau chaude sanitaire : Non incluse · Incluse ». Disposition retenue ; alternative accordéon en `AR-config-alt` (non recommandée, voir Notes).
8. **Pack conseillé** — carte contour r 20, en-tête `#fdeceb` avec `badge-check` + « Pack conseillé » 14/800 corail ; titre 20/800 « Sol&Go 6 kWc — à partir de 10 190 € » ; lignes 17 px séparées par 1 px `#f4f4f4` : Aides estimées (valeur `#255a2e`) · Reste à charge · Rentabilisé en N ans. PAC : « Pompe à chaleur air/eau — 11 000 à 16 000 € », « MaPrimeRénov' + CEE », « Reste à charge », encart vert « Aucune avance de frais ».
9. **Nos hypothèses** repliable, fond `#f4f4f4` r 16 : prix du kWh 0,2001 € (août 2026) · surplus 0,011 €/kWh · TVA 5,5 % · prime autoconsommation 0 € depuis le 05/06/2026 · hausse par défaut 4 %/an ; mention « Ordre de grandeur, ne constitue pas un devis. »
10. **CTA** : primaire 56 « Je planifie ma visite technique gratuite » ; secondaire 56 « Je préfère être rappelé » ; lien « Appeler mon agence ». **Widget collant** en bas au défilement : « Économies 25 ans / 33 188 € » à gauche + bouton primaire 48 « Planifier ma visite ».
Desktop : grille `1fr / 420px`, colonne droite sticky (pack + CTA + hypothèses) ; taux et horizon côte à côte ; héros + 2 tuiles sur une ligne ; configurateur en 3 colonnes.

### AR-onboarding (`AR-onboarding`)
3 volets plein écran : compteur « 1 / 3 » 13/800 `#8a8a8a` + `x` ; rond 120 (fond `#e9f3f3` / `#fdeceb` / `#e6f2e8`) picto 56 (`trending-up` canard / `sliders-horizontal` corail / `piggy-bank` vert) ; titre 26/800 ; texte 18 `#5c5c5c`. Titres : « Pourquoi le taux de hausse compte », « Jouer avec l'installation », « Vos économies cumulées ». Bas : retour rond, points de pagination (actif 24×6 corail), suivant rond corail ; dernier volet : « Voir mon résultat ».

### M1-mur (`M1-mur`) — AVANT, variante A/B
Reproduction du tunnel actuel : titre 24/800 corail « Vous n'êtes plus qu'à un clic de votre étude solaire ! », texte 16, champs Nom / Prénom / Email / Téléphone, bandeau RGPD canard, CTA « Valider ma demande » ; écran 2 « Merci, un expert vous rappelle » (rond vert `check`). À conserver uniquement comme variante de test.

### B — Qualification RDV (`B-question`, `B-toiture`)
Stepper 3 sections « Votre situation · Votre logement · Votre RDV » (pastilles 22). **Panneau « Vos réponses »** (accordéon mobile, colonne droite desktop) : carte contour r 16, badge canard « repris de votre estimation », lignes 15 px « Code postal **69001** », « Surface **100–135 m²** », « Facture **101–135 €/mois** », « Projet **solaire** », icône `pencil` 16 `#f0463c`. Accès direct sans estimation : panneau vide + bandeau explicatif.
- `B-question` (B0) : cartes horizontales picto 32 : Maison (`house`), Appartement (`building-2`), Local professionnel (`store`).
- `B-toiture` (B10) : lien « Pourquoi cette question ? » (`circle-help` canard) ouvrant un bandeau canard ; cartes Rénovée (`hammer`, « moins de 15 ans »), D'origine (`house`, « jamais refaite »), Je ne sais pas. Inclut le spécimen des états transverses (focus, erreur, squelette).

### B-coordonnees-otp (`B-coordonnees-otp`)
- B15 : champs Prénom / Nom / Email / Téléphone ; case 24 r 6 `border:2px #1e1e1e` « Je ne souhaite pas être appelé, uniquement le SMS de confirmation » ; bandeau canard `lock` « Prototype : aucune donnée n'est transmise ni conservée. » ; CTA « Recevoir mon code ».
- B17 : 4 cases OTP 64 px r 14 (active `border:2px #e22c22`), 26/800 ; badge orange « Mode démo — votre code : 4821 » ; lien « Renvoyer le code ». B19 en dessous : carte `clipboard-check` « Visite technique à domicile — Environ 1 h, en présence d'un propriétaire du logement. Vous pouvez être accompagné d'un proche. », chips Gratuite · Sans engagement · Technicien RGE.

### B-calendrier (`B-calendrier`, `B-calendrier-desktop`) + modale B21
Bandeau agence (fond `#f4f4f4` r 16, `map-pin` corail) « Agence HomeServe Rénov' Lyon — à 12 km de votre logement », badge vert « Certifiée RGE ». Titre « Choisissez votre créneau », sous-titre « 14 jours ouvrés à partir de demain ». Grille 7 col, cases 44 (48 desktop) r 12, 16/700 ; indisponible `#c9c9c9` ; sélectionné pastille ronde `#e22c22`. Légende. Onglets pilule « Matin / Après-midi ». Chips créneaux 30 min 08:30 → 11:00 (10:30 indisponible barré). Badge orange « Agenda simulé ». Lien canard « Aucun créneau ne me convient → être rappelé ». Barre collante : récap « Mardi 15 sept. / 09:30 – 10:30 » + « Je confirme ce créneau ».
**Modale B21** : voile `rgba(30,30,30,.45)`, feuille r 24 padding 24 ; rond 56 `#fdeceb` `user-check` ; titre 24/800 « Ce rendez-vous mobilise un technicien » ; texte 17 ; « Je confirme » (primaire) / « Modifier » (secondaire).
Desktop : stepper en ligne ; grille `1fr / 400px` ; calendrier et créneaux côte à côte ; colonne droite agence + récap + CTA.

### B-conditionnels (`B-conditionnels`)
« Vous avez déjà un rendez-vous » (`calendar-clock` canard, récap Date/Agence/Type, « Gérer mon rendez-vous » secondaire) et « Forte demande dans votre secteur » (`users` orange, « Je préfère être rappelé » primaire, « Voir les dates suivantes » secondaire, badge orange « Règle simulée »).

### B-confirmation (`B-confirmation`, B22)
Rond 88 `#e6f2e8` `check` 44 `#4f9a5c` ; « Votre visite est confirmée » 27/800 ; texte 17. Carte récap r 20 : Date · Créneau · Agence · Adresse · Type. Bouton secondaire `calendar-plus` « Ajouter à mon agenda ». Bloc « À préparer » (fond `#f4f4f4`) : factures d'énergie (`file-text`), taxe foncière (`receipt`), photo compteur ou toit (`camera`), icônes canard. « Comment se déroule la visite » : 4 cartes contour, numéro dans rond 34 `#fdeceb`/`#e22c22` : Le technicien appelle · Relevé sur place · Étude chiffrée · Devis, sans engagement. Lien « Gérer mon rendez-vous ».

### S-orientation (`S-orientation`) — sorties S3 / O1
Picto rond 72 ; titre positif 25/800 (« Locataire ? Protégez votre logement sans travaux » / « Le solaire ne serait pas rentable chez vous aujourd'hui ») ; pour O1, règle en clair dans un encart `#f4f4f4` (« facture inférieure à 60 €/mois… »). Carte offre HomeServe (en-tête `#f4f4f4` `shield-check` corail, titre 19/800, texte 16, prix 28/800 corail « 6 €/mois », CTA « Découvrir » → URL réelle). Secondaire « Être rappelé ». Lien « Transmettre à un proche propriétaire ».

### Parcours (`Parcours`)
Vue d'ensemble : E0 → Q ×8 → AR → B0…B10 → B15…B17 → B20/B21 → B22 ; bifurcation « Je prends rendez-vous » (E0 → B0, panneau vide) ; bouton d'appel partout ; sorties S3 / O1 / déjà un RDV / forte demande.

## Interactions & Behavior
- Carte à choix unique : sélection → 150 ms → écran suivant. Multi-sélection : compteur live, « Continuer ».
- AR : − / + (pas de 1, bornes 0–15), chips horizon, segmented controls → recalcul synchrone de héros, tuiles, courbe, phrase « +N € ». Pas de bouton Valider. Widget collant apparaît quand le CTA principal sort du viewport.
- Hypothèses : accordéon (`chevron-up/down`).
- Panneau « Vos réponses » : accordéon mobile ; crayon → retour à la question correspondante, réponses conservées.
- OTP : 4 chiffres, auto-focus suivant ; code démo 4821 ; « Renvoyer ».
- Calendrier : J+1 → J+14 ; jour → onglets Matin/Après-midi → chip → barre collante active → modale B21 → B22.
- Règles simulées : « déjà un RDV », « forte demande » → écrans conditionnels. Non éligible (facture < 60 €/mois, locataire, appartement) → S-orientation.
- Toutes transitions 150 ms ease-out ; aucune animation décorative.

## State Management
- `project`: solaire | pac | lesdeux
- `answers`: codePostal, typeLogement, surface, chauffage, equipements[], facture (tranche), revenus, idf, anneeConstruction, toiture…
- `assumptions`: tauxHausse (4), horizon (25), kwc (6), stockage (aucun|virtuel|batterie), couplagePac (bool), ecs (bool)
- `result` dérivé : economiesCumulees, factureSans, factureAvec, serie[], pack, aides, resteACharge, retour
- `booking`: agence, date, creneau, contact {prenom, nom, email, tel, smsOnly}, otpVerified
- `entry`: simulateur | rdvDirect | appel — détermine si le panneau « Vos réponses » est pré-rempli.
- Aucune donnée transmise (prototype) ; persistance locale possible pour reprise.

## Assets
- Police : Nunito (Google Fonts) 400/600/700/800.
- Icônes : Lucide (`https://unpkg.com/lucide`), trait 1,75 px — noms listés par écran ci-dessus.
- Aucune image, aucun logo : mot-symbole texte uniquement.

## Notes de conception
- **Configurateur** : les 3 segmented controls empilés sont retenus (tout visible, même grammaire que les chips d'horizon). L'accordéon (`AR-config-alt`) n'est à retenir que si les tests montrent que les pilules ne sont pas comprises comme réglages.
- **Extrapolé, à valider** : chiffres AR-pac / AR-lesdeux ; nuances intermédiaires non listées dans la charte (corail-500/100, canard-300/100/700, vert-400/100, orange-600, error-700, neutres 500/400/300/200) ; barème revenus A9 (à caler sur ANAH) ; liste des 8 équipements A6 ; pictogrammes Lucide monochromes ; copies S3/O1 et « déroulé de la visite » ; OTP 4 cases (6 si le SMS réel en a 6).

## Files
- `Mon projet energie - Maquettes POC.dc.html` — board canvas des 20 planches (référence principale ; chaque planche = `<div id="…">`).
- `support.js` — runtime nécessaire pour ouvrir le board dans un navigateur (pas à porter).
