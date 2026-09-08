/**
 * Classes partagées de l'habillage (D46-A). Centralisées pour que la
 * sélection, les CTA et les cartes se ressemblent d'un écran à l'autre —
 * et pour qu'un changement se fasse en un seul endroit.
 *
 * Aucune couleur en dur : uniquement des utilitaires adossés aux tokens de
 * app/globals.css.
 */

/** CTA principal : pilule corail, ombre portée légère, cible 56 px. */
export const CTA_PRIMAIRE =
  "flex min-h-14 items-center justify-center rounded-full bg-corail-600 px-5 text-lg font-extrabold text-white shadow-[0_2px_6px_rgba(226,44,34,0.24)]";

/** CTA secondaire : même géométrie, contour neutre. */
export const CTA_SECONDAIRE =
  "flex min-h-14 items-center justify-center rounded-full border-2 border-neutre-700 bg-white px-5 text-lg font-extrabold text-neutre-700";

/** Carte d'option au repos : ombre douce plutôt qu'un simple contour. */
export const CARTE_OPTION =
  "flex w-full items-center gap-3 rounded-card border border-neutre-200 bg-white p-4 text-left shadow-[0_1px_3px_rgba(30,30,30,0.06)]";

/** Carte d'option sélectionnée : contour et fond orange (D46-A). */
export const CARTE_OPTION_ACTIVE =
  "flex w-full items-center gap-3 rounded-card border-2 border-orange-500 bg-orange-100 p-4 text-left shadow-[0_1px_3px_rgba(30,30,30,0.06)]";

/** Bandeau d'information : fond canard clair, texte canard foncé. */
export const BANDEAU_INFO =
  "rounded-card bg-canard-100 p-3 text-sm text-canard-700";

/** Section sur fond neutre, pour alterner avec le blanc. */
export const SECTION_ALTERNEE =
  "-mx-5 bg-neutre-100 px-5 py-5";
