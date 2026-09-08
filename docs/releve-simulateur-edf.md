# Relevé du simulateur EDF Solutions Solaires à partir des écrans réels (08/09/2026)

Source : 16 captures mobiles fournies par Benoît (session 2 du brief Chrome), planche HTML `EDF_simulateur_captures.html` livrée dans la conversation maître. Exemple joué : surface + 175 m², facture + 175 €/mois (base 2 280 €/an), radiateurs électriques. Ce relevé **corrige et complète** `04-retro-ingenierie-edf-deux-parcours.md` §1 (fait depuis le code).

## 1. Structure du parcours
- Entrée : département obligatoire + case CGU/confidentialité obligatoire, badges « 3 min », « Gratuit », « Sans engagement », CTA « Je découvre mes économies ». Mur léger sans donnée personnelle.
- Stepper à **2 étapes** (« Votre Foyer », « Vos Équipements »), pas 8. Bouton d'étape désactivé tant qu'aucune réponse.
- Étape 1 : occupation (3 tranches : < 3 j, 3–4 j, 5 j et + par semaine, « entre 10h et 16h ») · personnes (1–2, 3–4, 5+) · surface au sol par **curseur 5 crans** (< 20, 20–99, 100–135, 136–175, > 175 m²).
- Étape 2 : chauffage (radiateurs électriques, PAC, gaz/fioul/bois, autre) et, sur le même écran long, équipements multi-sélection (**8** : véhicule électrique, borne, piscine/jacuzzi, climatisation, PAC, lave-vaisselle, sèche-linge, chauffe-eau) · chauffe-eau (**5** : thermodynamique, gaz + 10 ans, électrique − 10 ans, électrique + 10 ans, je ne sais pas) · facture mensuelle par **curseur 6 crans** (< 20, 20–80, 81–100, 101–135, 136–175, > 175 €).
- Mention RGPD en italique sous les curseurs.

## 2. Écran de résultat
- Bouton « Comprendre vos résultats (?) » ouvrant un onboarding en 4 volets.
- Texte : « L'estimation finale dépend de la hausse du prix de l'électricité. Vous pouvez ajuster le taux, il sera appliqué chaque année. » Contrôle **− / valeur / +** de **0 à 15 %**, défaut **4 %** (« augmentation moyenne par an entre 2016 et 2025 », source TRVE résidentiel), bouton **« Valider »** (pas de recalcul en direct).
- Toggle **« Panneaux solaires » / « Panneaux + batterie »**.
- « Vos économies cumulées au bout de » : chips **10 · 15 · 20 · 25 · 30 ans**.
- **Tuile héros = économies cumulées** à l'horizon choisi.
- « Estimation de votre facture moyenne annuelle » : deux tuiles « Sans installation solaire » / « Avec installation solaire ».
- Section suivante « Évolution de votre facture… » non capturée (probable graphique).
- Bas de page : « Passer au solaire, c'est facile » (stepper Bilan · Démarches · Installation · Suivi, carrousel), témoignages, accordéon « Vous voulez en savoir plus ? » (potentiel d'autoconsommation, économies potentielles, calculs utilisés, données et hypothèses), CTA collant **« Je demande un bilan personnalisé »** (« étude approfondie à domicile ou à distance »).

## 3. Points de données relevés (facture de base 2 280 €/an)

| Taux | Horizon | Option | Cumul | Sans | Avec | TAP implicite |
|---|---|---|---|---|---|---|
| 4 % | 10 ans | panneaux | 7 395 € | 3 516 € | 2 702 € | 23,2 % |
| 6 % | 10 ans | panneaux | 8 368 € | 4 336 € | 3 333 € | 23,1 % |
| 6 % | 25 ans | panneaux | 33 188 € | 10 402 € | 7 988 € | 23,2 % |
| 6 % | 25 ans | batterie | 63 215 € | 10 402 € | 5 809 € | 44,2 % |

Lecture : 2 280 × 1,04¹¹ ≈ 3 510 → 3 516 avec arrondis `Math.ceil` : la « facture moyenne annuelle » à l'horizon N est la facture après **N + 1 incréments**, pas une moyenne. Cumul 4 %/10 ans : 2 280 × 23,2 % × Σ(1,04^k, k = 1..11) ≈ 7 400 : le cumul somme **11 termes** pour un horizon de 10 ans. Batterie = +21 pts de TAP (23,2 → 44,2), conforme au code. Ces deux conventions (N + 1, 11 termes) sont à reproduire dans `engine/solaire.ts` pour que les tests de non-régression collent aux écrans, puis à **corriger dans l'affichage** (libellé « facture annuelle estimée dans N ans », cumul sur N années).

## 4. Écarts avec la rétro-ingénierie du code (à réconcilier dans les JSON)

| Sujet | Code (`04-retro…`) | Écrans réels | Décision POC |
|---|---|---|---|
| Occupation | 2 valeurs (5 j+, moins) | 3 tranches | 3 cartes ; malus −8,7 sur « < 3 j » et « 3–4 j » sauf coefficient distinct trouvé dans le code |
| Surface | < 80 / 80–100 / 100–135 / 135–180 / > 180 | < 20 / 20–99 / 100–135 / 136–175 / > 175 (curseur) | Libellés de l'écran ; mapping segT à vérifier dans le code ; le seuil HomeServe 70 m² se porte par une tranche « < 70 » |
| Facture | 5 valeurs annuelles | 6 crans | Les crans « < 20 » et « 20–80 » partagent probablement 720 € ; POC : 5 crans « < 60 / 60–100 / 101–135 / 136–175 / > 175 » |
| Équipements | 4 (chauffage principal, secondaire, clim, VE) | 8 | Reprendre les 8 libellés ; coefficients piscine, lave-vaisselle, sèche-linge, borne à extraire du code ou estimer (documentés « extrapolés ») |
| Chauffe-eau | électrique / thermodynamique | 5 dont âge | Reprendre les 5 libellés ; l'âge n'a d'effet connu que dans le code (à vérifier) |
| Écran de progression | 8 écrans | 2 étapes, cartes pleine largeur | Stepper 2 étapes « Votre logement / Vos équipements » + compteur discret |
| Taux de hausse | 4 % « modifiable » | 0–15 %, bouton Valider, sourcé | 0–15 %, **recalcul en direct**, source affichée |
| Chiffre héros | non précisé | cumul à l'horizon | Cumul à l'horizon (D16 confirmée) + courbe ciseaux |

## 5. Ce que le POC HomeServe reprend, améliore, écarte
- **Reprend** : stepper court, cartes-options, curseurs à crans, toggle option sur le résultat, chips d'horizon, tuile héros cumul, onboarding « Comprendre mes résultats », accordéon hypothèses, CTA collant.
- **Améliore** : recalcul en direct du taux ; courbe ciseaux visible sous les tuiles ; libellés justes (« dans N ans ») ; kWc, prix du pack, aides, reste à charge et retour (absents chez EDF) ; pas de case CGU en entrée (aucune donnée personnelle) ; hypothèses remontées près du chiffre ; CTA vers un RDV **pré-rempli** avec créneau, au lieu d'un formulaire vierge.
- **Écarte** : le bouton « Valider » ; le wording « facture moyenne annuelle ».

## 6. Reste à observer
Section « Évolution de votre facture » (graphique ?) ; destination exacte de « Je demande un bilan personnalisé » ; comportement à 0 % et 15 % ; version desktop ; l'exemple de référence (dept 69, 100–135 m², 101–135 €) pour caler la table TAP sur la même facture de base que les tests.
