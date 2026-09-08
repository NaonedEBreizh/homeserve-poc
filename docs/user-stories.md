# User stories — « Mon projet énergie HomeServe » (v1, 08/09/2026)

Dérivées des personas (`04-etude-cible-personas.md`), de la cartographie (`09-cartographie-parcours.md`) et du PRD (`10-prd-poc-homeserve.md`). Priorité MoSCoW pour la v1 du POC. Chaque story cite ses écrans et ses événements de mesure. Les critères d'acceptation sont écrits pour devenir des tests (Vitest sur les moteurs et la machine, tests manuels sur les écrans).

Convention : **US-x.y** · persona · priorité · écrans · événements.

## Épic 1 — Comprendre ce que je gagne avant de me dévoiler (Sarah & Karim, porte tiède)

**US-1.1 — Choisir mon projet.** En tant que propriétaire curieux, je veux indiquer si mon projet est solaire, pompe à chaleur ou les deux, afin de n'avoir que les questions utiles. *Must · E0, A0 · `sim_start`.* Acceptation : trois cartes-options ; le choix conditionne A9–A10 et le gabarit de résultat ; la promesse « estimation en 2 minutes, sans coordonnées » est visible avant le premier clic.

**US-1.2 — Répondre à une question à la fois.** En tant qu'utilisateur sur mobile le soir, je veux répondre par cartes à choix fermés, une question par écran, avec une barre de progression, afin de finir en moins de deux minutes. *Must · A1–A10 · `sim_step_n`.* Acceptation : 8 écrans (solaire) ou 10 (PAC, les deux) ; retour arrière possible sans perte ; aucune saisie libre sauf le code postal ; temps médian de complétion mesuré < 120 s sur 5 testeurs.

**US-1.3 — Voir mon résultat sans donner mes coordonnées.** En tant que propriétaire méfiant vis-à-vis du démarchage, je veux obtenir mes économies estimées, le pack conseillé et son prix, les aides, le reste à charge et le temps de retour sans saisir ni email ni téléphone, afin de décider en confiance. *Must · AR · `sim_result_shown`.* Acceptation : aucun champ personnel avant AR en variante par défaut ; reproduction de l'exemple EDF (dept 69, 100-135 m², 101-135 €, radiateurs élec, VE, chauffe-eau thermo, 5 j+ → facture 1 416 €, TAP 29,94 ± 0,1 %, 424 €/an) ; prix des packs 6 490 / 10 190 / 12 990 € affichés « à partir de ».

**US-1.4 — Comprendre l'effet ciseaux de la hausse de l'électricité.** En tant que ménage qui subit l'inflation énergétique, je veux voir ma facture projetée sur 30 ans avec et sans solaire et faire varier moi-même le taux de hausse annuel, afin de comprendre que l'écart se creuse et que les économies cumulées grandissent avec l'inflation. *Must · AR · `sim_inflation_changed` (valeur).* Acceptation : deux courbes (sans solaire, avec solaire), contrôle 0–15 % défaut 4 % (source TRVE affichée), chips d'horizon 10–30 ans, recalcul < 100 ms, chiffre héros « économies cumulées sur 30 ans », phrase dynamique « +1 point de hausse = +X € sur 30 ans » ; à 4 % le cumul correspond au modèle EDF (Math.ceil annuel, échantillonnage 5 ans) ; à 0 % le cumul = 30 × économies annuelles.

**US-1.5 — Tester les options.** En tant que propriétaire équipé d'un véhicule électrique, je veux activer le stockage (virtuel ou batterie) ou le couplage avec une pompe à chaleur et voir le résultat changer, afin de dimensionner mon projet. *Should · AR · `sim_option_toggled`.* Acceptation : un **configurateur unique « Mon installation »** réunit centrale solaire (3/6/9 kWc), stockage (aucun · virtuel 15 €/mois · batterie sur devis) et couplage PAC (oui/non) ; chaque changement recalcule cumul, tuiles et courbe en direct ; TAP batterie ≤ 84 % ; couplage PAC recalcule le coefficient (−9,2 → +3,0) et le coût PAC (−25 %) ; toutes les hypothèses des options sont dans le bloc « nos hypothèses ». UX à résoudre au design (décision 08/09).

**US-1.6 — Vérifier les hypothèses.** En tant que personne qui compare avec Otovo et Hello Watt, je veux lire les constantes utilisées (prix du kWh, tarif de surplus, TVA, primes, date de validité), afin de juger la crédibilité de l'estimation. *Must · AR · `sim_hypotheses_opened`.* Acceptation : bloc repliable listant chaque constante de `hypotheses.json` avec sa date et sa source ; mention « ordre de grandeur, ne constitue pas un devis ».

**US-1.7 — Ne pas être poussé vers un RDV si je réfléchis encore.** En tant que couple qui veut en parler, je veux pouvoir m'arrêter au résultat, le garder à l'écran et y revenir dans la session, afin de décider à notre rythme. *Should · AR · `sim_result_dwell`.* Acceptation : aucun blocage ni pop-up à la sortie ; le résultat reste consultable en revenant en arrière (sessionStorage) ; **pas de capture d'email** (décision 08/09 : le résultat est fourni en direct, pas de nurturing en v1).

## Épic 2 — Réserver vite, sans appel (Thomas, porte chaude)

**US-2.1 — Aller directement au rendez-vous.** En tant que propriétaire décidé, je veux entrer par « Prendre rendez-vous » sans passer par le simulateur, afin de ne pas répondre à des questions d'économies. *Must · E0, B0 · `booking_start` (source = direct).* Acceptation : B0 s'ouvre sans pré-remplissage ; 16 à 18 questions selon le projet ; aucune mention d'économies dans ce parcours.

**US-2.2 — Être disqualifié tôt si ce n'est pas pour moi.** En tant qu'utilisateur pressé, je veux que les questions bloquantes (logement, statut, panneaux existants) viennent en premier, afin de ne pas perdre cinq minutes pour rien. *Must · B0–B2 · `booking_exit_*`.* Acceptation : ordre B0 → B1 → B2 respecté ; chaque sortie mène à un écran d'orientation en un clic.

**US-2.3 — Réserver un créneau réel de mon agence.** En tant que propriétaire, je veux choisir un jour et un créneau (matin / après-midi) dans les 14 jours à l'agence la plus proche de mon code postal, afin de ne pas attendre un rappel. *Must · B19–B20 · `booking_slot_selected`, `booking_out_of_hours`.* Acceptation : agence déduite du CP (`agences.json`), créneaux déterministes (seed CP), jours ouvrés de l'agence, badge « agenda simulé » visible ; « aucun créneau ne me convient » mène à R1.

**US-2.4 — Ne donner mon téléphone qu'au moment utile et ne pas être appelé.** En tant que personne qui refuse le démarchage, je veux saisir mes coordonnées seulement pour confirmer le rendez-vous et pouvoir cocher « je ne souhaite pas être appelé », afin de garder le contrôle. *Must · B15–B16 · `booking_contact_submitted`.* Acceptation : aucun champ personnel avant B15 ; case « ne pas m'appeler » stockée dans l'état et rappelée en confirmation ; mention « aucune donnée transmise (prototype) ».

**US-2.5 — Confirmer par SMS (démo) et m'engager en connaissance de cause.** En tant qu'utilisateur, je veux valider un code SMS et lire ce que le rendez-vous implique (technicien mobilisé ~1h, présence d'un propriétaire), afin qu'il soit pris au sérieux des deux côtés. *Must · B17, B21 · `booking_otp_ok`, `booking_engaged`.* Acceptation : code affiché à l'écran avec badge « mode démo » ; modale d'engagement avec bouton primaire « Je confirme » ; annulation possible.

**US-2.6 — Repartir avec une confirmation utilisable.** En tant que personne organisée, je veux un récapitulatif, la liste des documents à préparer et un fichier d'agenda, afin de ne rien oublier. *Must · B22 · `booking_slot_confirmed`.* Acceptation : ICS valide (fuseau Europe/Paris, titre, adresse de l'agence, lien « gérer ») téléchargeable sur Chrome, Safari, Firefox ; documents listés (factures, taxe foncière, photo compteur / toit) ; déroulé du rendez-vous en 4–5 cartes.

**US-2.7 — Enchaîner sans ressaisir après le simulateur.** En tant qu'utilisateur venu du simulateur, je veux que mes réponses (projet, code postal, surface, facture, année) soient réutilisées, afin de répondre à 12 questions au lieu de 16. *Must · AR → B0 · `sim_to_booking`.* Acceptation : nœuds pré-remplis sautés, règles P(e) évaluées quand même, panneau « vos réponses » affiche les valeurs héritées avec icône crayon ; accès direct à `/rendez-vous` sans état fonctionne (toutes les questions posées).

**US-2.8 — Appeler sans que le signal soit perdu.** En tant que prospect pressé qui veut parler à quelqu'un, je veux un bouton d'appel vers mon agence à chaque étape, afin de ne pas chercher un numéro ; et en tant que responsable acquisition je veux que ce clic soit mesuré. *Must · E0, AR, en-tête B · `call_click{source, step}`.* Acceptation : lien `tel:` de l'agence routée par CP (numéro national sinon) ; événement émis au clic ; mention « appel mesuré, jamais de démarchage » dans le README. (Porte « analogique pressé », D18.)

**US-2.9 — Ne pas réserver deux fois.** En tant qu'utilisateur qui revient, je veux être prévenu si un rendez-vous existe déjà pour mon téléphone ou mon email, afin de le gérer plutôt que d'en créer un second. *Must · B17b · `booking_duplicate_detected`.* Acceptation : détection sur téléphone normalisé ou email (localStorage en POC) ; écran « Vous avez déjà un rendez-vous » avec récapitulatif et lien « gérer » ; aucune seconde réservation possible. (D32.)

**US-2.10 — Réserver même si le plateau m'a déjà appelé.** En tant que prospect déjà contacté par le call-center, je veux quand même pouvoir choisir mon créneau en ligne, afin de ne pas dépendre d'un rappel. *Should · B17b · `booking_plateau_conflict`.* Acceptation : numéro de test `0600000001` déclenche l'écran « Un conseiller vous a déjà contacté ; votre créneau reste réservable, il en sera informé » ; le créneau se confirme normalement ; le README indique que la notification du plateau dépend du workflow HomeServe (identifié, non simulé). (D29, D32.)

**US-2.11 — Ne pas voir un calendrier vide.** En tant qu'utilisateur d'un secteur très demandé, je veux être orienté vers un rappel plutôt que vers un calendrier sans créneau, afin de ne pas perdre confiance. *Must · B19b · `booking_agency_overbooked`.* Acceptation : si l'agence a moins de 4 créneaux libres sur 10 jours (CP de test), le calendrier est masqué, écran « Forte demande dans votre secteur » + « être rappelé » à parité ; règle et seuil lisibles dans `agences.json`. (D30, D32.)

## Épic 3 — Avoir le droit à quelque chose et le comprendre (Michel & Annie, PAC, MPR jaune)

**US-3.1 — Connaître mon aide et mon reste à charge.** En tant que retraité chauffé au fioul, je veux indiquer ma tranche de revenus et l'âge de ma maison et voir MaPrimeRénov' + CEE déduits, « sans avance de frais », afin de savoir ce que je paierai vraiment. *Should · A9, A10, AR (PAC) · `sim_result_shown` (projet = pac).* Acceptation : barème 2026 5 000 / 4 000 / 2 000 / 0 (source HomeServe 26/08/2026) selon bleu / jaune / violet / rose ; CEE selon zone H1/H2/H3 ; aides = 0 si logement < 15 ans avec explication ; test : gaz 1 800 €/an, 100-135 m², dept 69, jaune, > 15 ans → économie ≈ 989 €/an, aides 9 110 €, reste 2 390 €.

**US-3.2 — Lire confortablement et répondre « environ ».** En tant que personne de 67 ans sur PC, je veux des textes en 18 px, des pictogrammes pour l'énergie actuelle, des tranches de revenus libellées « environ » et une question par écran, afin de ne pas me tromper ni renoncer. *Must · tous les écrans.* Acceptation : corps ≥ 18 px, contraste AA, cibles tactiles ≥ 44 px, navigation clavier, libellés sans jargon (« PAC » toujours accompagné de « pompe à chaleur »).

**US-3.3 — Préférer un rappel humain.** En tant que personne peu à l'aise avec les agendas en ligne, je veux demander à être rappelée par l'agence, avec mon créneau préféré, afin d'avoir un interlocuteur. *Must · AR, B20, O1 → R1 · `callback_requested` (avec tranche d'âge déclarée facultative).* Acceptation : bouton « Je préfère être rappelé » à parité visuelle avec « Choisir un créneau » ; texte « à votre demande, sous 5 jours ouvrés » ; consentement horodaté enregistré dans l'état ; disponible à trois endroits (résultat, calendrier, orientation).

**US-3.4 — Venir avec un proche.** En tant que couple senior, je veux voir que le rendez-vous à domicile peut se faire en présence de notre fille, afin d'être rassurés. *Could · B19.* Acceptation : mention « vous pouvez être accompagné(e) d'un proche » sur l'écran d'information du RDV. *Visio retirée (décision 08/09).*

## Épic 4 — Ne jamais tomber dans une impasse (Nadia, non éligible)

**US-4.1 — Savoir tout de suite si c'est pour moi.** En tant que propriétaire d'un appartement, je veux le dire dès la première question et être orientée sans faux résultat, afin de ne pas perdre mon temps. *Must · B0 → S2 · `booking_exit_copro`.* Acceptation : écran S2 positif (« voici ce que HomeServe peut faire pour vous ») avec entretien chaudière et assistance ; aucun chiffre solaire affiché.

**US-4.2 — Comprendre pourquoi je ne suis pas éligible.** En tant qu'utilisateur disqualifié par une règle (facture faible, résidence secondaire, petit toit, en construction), je veux lire la règle en clair et une alternative, afin de ne pas me sentir rejeté. *Must · B18 → O1 · `booking_disqualified_{regle}`.* Acceptation : chaque règle P(e) a un libellé explicatif et une orientation dans `arbre-rdv.json` ; le parcours continue jusqu'aux coordonnées en mode dégradé (comme EDF) puis affiche O1 ; « être rappelé » proposé.

**US-4.3 — Transmettre à un proche propriétaire.** En tant que non éligible, je veux partager le simulateur à quelqu'un que ça concerne, afin d'être utile quand même. *Could · S2, S3, O1 · `share_clicked`.* Acceptation : bouton « Transmettre » copiant l'URL de l'accueil ; aucune donnée personnelle dans l'URL.

**US-4.4 — Être orienté vers le dépannage si j'ai déjà des panneaux.** En tant que propriétaire déjà équipé par un autre installateur, je veux être dirigé vers le diagnostic en ligne, afin d'obtenir un devis. *Should · B2a → S4c.* Acceptation : lien vers `/diagnostic/oe`, seul flux HomeServe commandable en ligne, indiqué comme tel.

## Épic 5 — Mesurer et décider (responsable acquisition)

**US-5.1 — Comparer avec et sans mur de contact.** En tant que responsable acquisition, je veux ouvrir la même démo avec `?variant=mur` (coordonnées avant résultat, comme le tunnel produit actuel) et sans, afin de visualiser l'A/B que je lancerais. *Must · M1, AR · `variant` dans chaque événement.* Acceptation : M1 reproduit les quatre champs du tunnel actuel ; tous les événements portent la variante ; README explique le dimensionnement (12 000 visiteurs par variante pour +15 % relatif sur 4 %).

**US-5.2 — Voir les événements en direct.** En tant que responsable acquisition, je veux un panneau `?debug=1` listant les événements dataLayer au fil du parcours, afin de vérifier que le funnel est instrumenté. *Must · DebugPanel.* Acceptation : chaque événement listé (`sim_*`, `booking_*`, `callback_requested`) avec payload ; mapping Piwik PRO / GTM documenté dans le README.

**US-5.3 — Suivre le cross-sell et l'exclusion.** En tant que responsable acquisition, je veux distinguer les sorties par type et la part de rappels demandés par tranche d'âge déclarée, afin de piloter les orientations et surveiller l'exclusion des seniors. *Should · S*, O1, R1.* Acceptation : `booking_exit_{type}`, `booking_disqualified_{regle}`, `callback_requested{age_range}` (facultatif, non identifiant).

## Épic 6 — Faire confiance au code (CTO)

**US-6.1 — Vérifier qu'aucune donnée ne sort.** En tant que CTO, je veux ouvrir l'onglet Réseau et ne voir aucune requête externe, et lire des en-têtes de sécurité stricts, afin de juger la posture par rapport au site actuel (note F). *Must · toutes les pages.* Acceptation : zéro requête hors origine après chargement ; HSTS, CSP `default-src 'self'`, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy servis ; objectif A sur securityheaders.com ; démo fonctionnelle hors ligne après chargement.

**US-6.2 — Lire la logique métier en données.** En tant que CTO, je veux trouver l'arbre de qualification, les seuils, les barèmes et les hypothèses dans des JSON datés et sourcés, afin de les modifier sans code et de juger l'intégrabilité. *Must · `data/`, `content/`.* Acceptation : `arbre-rdv.json`, `hypotheses.json`, `pac-baremes.json`, `tap-base.json`, `zones.json`, `agences.json`, `content/fr-fr.json` au schéma Prismic ; un changement de seuil ne touche aucun fichier `.ts`.

**US-6.3 — Exécuter les tests.** En tant que CTO, je veux lancer `pnpm test` et voir passer les tests des moteurs (exemple EDF, bornes, chaque coefficient), de la machine (chaque P(e), chaque sortie, chaînage) et de l'agenda (déterminisme, ICS), afin de vérifier que le code généré est contrôlé. *Must.* Acceptation : suite Vitest verte en CI ; gitleaks vert ; `.env.example` vide et commenté.

**US-6.5 — Voir où le POC s'arrête, et pourquoi.** En tant que CTO, je veux lire dans le README chaque règle métier post-réservation avec son statut (POC, simulé, cible) et la question à poser au SI, afin de distinguer un choix de périmètre d'un oubli. *Must · README.* Acceptation : tableau des règles (doublon, lead plateau, client existant, surbooking, capacité, verrouillage, notifications, CRM, tournées) avec statut et question ; mention explicite « logiciel de tournée et workflow plateau HomeServe inconnus : non simulés ». (D32.)

**US-6.4 — Se projeter dans l'intégration.** En tant que CTO sur Next.js 16 / Tailwind v4 / Radix / Prismic / GKE, je veux retrouver mes conventions (tokens nommés, App Router, `output: 'standalone'`, Dockerfile), afin d'estimer le portage à quelques jours. *Should · README.* Acceptation : README avec les 5 lignes GKE, le mapping tokens, la liste des points de rebranchement (`/api/rdv` → `api.homeserve.fr` → Salesforce).

## Récapitulatif de priorisation v1

| Priorité | Stories | Couvert par le plan de build |
|---|---|---|
| Must | 1.1–1.4, 1.6, 2.1–2.7, 2.8, 2.9, 2.11, 3.2, 3.3, 4.1, 4.2, 5.1, 5.2, 6.1–6.3, 6.5 | Blocs 0 à 5 et 7 |
| Should | 1.5, 1.7, 2.10, 3.1, 4.4, 5.3, 6.4 | Bloc 6 (PAC) et marges |
| Could | 3.4, 4.3 | Si avance, sinon next steps |

Hors v1 (racontés en next steps) : nurturing par email, agenda réel d'une agence pilote, persistance Salesforce, pré-remplissage DPE/BDNB, anti-spam Turnstile, IA d'explication du résultat.
