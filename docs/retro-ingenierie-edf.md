# Rétro-ingénierie EDF Solutions Solaires — les deux parcours et leur réappropriation pour HomeServe

Source : 7 documents produits par Benoît via Claude in Chrome (juin 2026) : règles de calcul du simulateur (moteur JS `SimulatorB2CResults`), arbre de branchement du parcours RDV (extrait de `common.js`), cartographies v2/v3, wireframes, 24 captures d'écran. Rédigé le 07/09/2026.

## 0. Deux produits distincts, pas deux étapes d'un même tunnel

| | Parcours 1 — Simulateur d'économies | Parcours 2 — Prise de RDV |
|---|---|---|
| URL | `/accueil-particuliers/simulateur/` → `/results/` | `/prise-de-rdv/` |
| Promesse | "Estimez vos économies" | "Bilan solaire gratuit : vérifiez votre éligibilité puis planifiez votre RDV — 4 étapes, 5 minutes" |
| Rôle | Haut de funnel : valeur, courbe 30 ans | Bas de funnel : qualifier, filtrer, engager, remplir l'agenda |
| Mur de contact | Aucun | Coordonnées + OTP SMS après qualification, avant éligibilité et calendrier |
| Chiffres affichés | Facture annuelle, taux d'autoproduction, économies €/an, projection 30 ans, surplus | Aucun (ni kWc, ni prix, ni aides) |
| Moteur | 100 % client, modèle statistique (pas de PVGIS) | Machine à états (~27 vues), fonction de disqualification P(e), 8 sorties, agenda 21 jours |
| Lien entre les deux | Aucun : l'utilisateur re-saisit tout | |

Opportunité HomeServe : **chaîner les deux**, le résultat du simulateur devient l'entrée pré-remplie du RDV.

## 1. Simulateur d'économies

### 1.1 Entrées (8 questions fermées)
Département · occupation (5 j+/semaine ou moins) · nombre de personnes · surface au sol (tranches) · chauffage (radiateurs élec / PAC / gaz-fioul-bois / autre) · équipements cumulables (chauffage principal, secondaire, clim, VE/borne) · chauffe-eau (élec / thermo) · facture mensuelle (tranches).

### 1.2 Modèle : taux d'autoproduction (TAP)
```
agence     = getAgenceInstallation(département)
segT       = getSegT(surface_sol)
segF       = getSegF(facture)                           // index 0..4
tapStat    = getTAPStatistique(agence, segT[, segF])    // table propriétaire EDF
tapClient  = clamp(tapStat + Σ bonus/malus, 12 %, 63 %)
tapBatt    = min(getTAPBatterie(tapClient), 84 %)
facture    = {720, 1080, 1416, 1860, 2280}[segF]
économies  = round(facture × tap / 100)
surplus    = getSurplus(agence, segT, segF)
```
Bonus/malus (points) : PAC −9,2 · gaz/fioul/bois/autre +7 · radiateurs élec 0 · chauffage principal −7,1 · secondaire +2,1 · clim +3,7 · VE/borne +8,9 · chauffe-eau élec +19,6 · thermo +16,3 · occupation < 5 j −8,7.

Projection 30 ans, hausse énergie 4 %/an (modifiable), `Math.ceil` à chaque itération, affichage tous les 5 ans.

Exemple vérifié : dept 69, 100-135 m², 101-135 €/mois, radiateurs élec, VE, chauffe-eau thermo, 5 j+ → facture 1 416 €, TAP 29,94 %, économies 423,95 €/an, TAP batterie 50,94 %, surplus 76,14.

### 1.3 Enseignements
- Modèle « économies-first », jamais « produit-first » : pas de kWc, prix, retour. Faiblesse : impossible de juger la rentabilité.
- Bonus/malus = logique de synchronisation production/consommation (ce qui consomme en journée monte le taux ; PAC nuit/hiver ou absence le baisse). Pédagogiquement juste.
- Tout côté client : zéro appel serveur, zéro secret, testable unitairement. Remplacer les tables propriétaires par une table construite depuis le productible par département (PVGIS ou statique).
- Batterie = uplift du taux (+~21 pts), plafonné à 84 %.

## 2. Prise de RDV

### 2.1 Structure
4 blocs (Besoin / Habitation / Toiture / Rendez-vous), barre de progression, panneau « Voici vos réponses » éditable. 16 questions max fermées, puis 3 écrans libres (adresse-CP-ville, prénom-nom, email-téléphone), OTP SMS 4 chiffres (5 min), éligibilité, calendrier, modale d'engagement, confirmation.

### 2.2 Arbre : 3 familles de règles
**a) Sorties de périmètre (8)** : entreprise → pro ; locataire → sortie ; déjà des panneaux + pas client → dépannage ; client → SAV dépannage / maintenance / autre ; autres matériaux de toit sans alternative → guide PDF ; CP 20/75/96-99 ou dept non éligible → territoire non desservi ; abandon → quit.

**b) P(e) — 5 réponses NON ÉLIGIBLE** : facture < 80 €/mois · résidence secondaire · surface < 80 m² · pas de box internet · maison en construction → collecte de coordonnées en mode dégradé. Règles de **rentabilité du RDV** (4h de conseiller), pas d'éligibilité technique.

**c) Sous-arbre toiture** : avant 1997 OU toit d'origine / nsp → question amiante ; amiante oui → alternatives (toit-terrasse, jardin) ; revêtement « autres » → alternatives.

### 2.3 Bloc rendez-vous
Coordonnées après 16 questions ; OTP SMS obligatoire (anti-faux-leads) ; éligibilité en 3 variantes (domicile ~2h, visio via flag `is-visio-enabled`, terrain) ; calendrier 21 jours, matin/après-midi, créneaux 30 min ; modale « Ce rendez-vous vous engage » (~4h conseiller) ; confirmation (récap, documents : factures élec, taxe foncière, « Ajouter à mon agenda », déroulé en 5 cartes) ; gestion doublon, aucun créneau → « être appelé sous 48h », modification, annulation, Bloctel.

### 2.4 Enseignements
- Mono-produit, sorties = culs-de-sac.
- Ordre pensé pour disqualifier tôt à moindre coût.
- Mur de contact au point de valeur maximale pour EDF et de frustration maximale pour l'utilisateur.

## 3. Réappropriation HomeServe

### 3.1 Ce que HomeServe a et qu'EDF n'a pas
- **Multi-produit** : chaque sortie EDF devient une orientation. Locataire → Dépannez-moi ; panneaux → entretien/dépannage ; non éligible solaire → PAC, chaudière, isolation ; entreprise → pro. Cross-sell = argument n°1.
- **Prix publics** (Sol&Go 6 490 / 10 190 / 12 990 €) : reste à charge affichable.
- **Réseau d'agences** (39 sites RGE, « à moins de 50 km ») : routage par département transposable.

### 3.2 Module A — Simulateur HomeServe
Architecture EDF conservée ; table `TAP_base(département, segT)` depuis PVGIS (constante embarquée) ; coefficients bonus/malus repris ; ajout : kWc conseillé (3/6/9), reste à charge packs, temps de retour, bloc hypothèses (tarif bleu 0,2001 €/kWh août 2026, surplus 0,011 €/kWh, TVA 5,5 %, prime supprimée 5/06/2026). CTA « Planifier mon bilan gratuit » → module B.

### 3.3 Module B — RDV HomeServe
Machine à états et P(e) dupliquées, sorties renommées vers les offres HomeServe. Chaînage : 16 → ~12 questions. Conservés : disqualification tôt, sous-arbre toiture/amiante, coordonnées après qualification, 3 variantes d'éligibilité, calendrier 21 jours, engagement, confirmation, ICS.
**Périmètre POC** : OTP simulé (code affiché « mode démo »), créneaux générés côté client par agence, pas d'email réel ni CRM, gestion post-RDV = un écran non fonctionnel. Logique réelle et testable ; infrastructure mockée et signalée.

### 3.4 Modèle de données commun
```
dept, code_postal, adresse (B)
occupation {5+, moins}, personnes {1-2,3-4,5+}
surface_sol {<80, 80-100, 100-135, 135-180, >180}
facture_mensuelle {<80, 80-100, 101-135, 136-180, >180}
chauffage {elec, pac, gaz_fioul_bois, autre}
equipements [chauffage_principal, secondaire, clim, ve]
chauffe_eau {elec, thermo, autre}
batterie {oui, non}
--- B uniquement ---
projet {maison, entreprise}, statut {proprietaire, locataire}
panneaux_existants, client_homeserve, besoin_sav {depannage, maintenance, autre}
horizon {dans_l_annee, information}
residence {principale, secondaire}, box_internet
annee_construction {<1997, >=1997, en_construction}
etat_toit {renove, origine, nsp}, revetement {tuile, ardoise, bac_acier, autre}
amiante {non, oui, nsp}, solution_alt {toit_terrasse, jardin, aucune}
identite, coordonnees, type_rdv {domicile, visio, terrain}, creneau
```

### 3.5 Métriques
`sim_start`, `sim_step_n`, `sim_result_shown`, `sim_to_booking`, `booking_step_n`, `booking_exit_{type}`, `booking_disqualified_{règle}`, `booking_contact_submitted`, `booking_slot_confirmed`, `booking_type_{domicile|visio}`, part hors heures ouvrées, complétion par étape.

## 4. Points ouverts
1. Tunnel HomeServe `/bilan/adresse` : étape du mur de contact, résultat chiffré après ?
2. Agences HES : liste et départements couverts.
3. Seuils P(e) HomeServe (pack 3 kWc à 6 490 € rentable plus bas).
4. Visio pratiquée par HomeServe ?
5. Sorties = cross-sell : offres réellement vendables en ligne.
