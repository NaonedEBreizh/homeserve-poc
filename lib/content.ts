import contenuFr from "@/content/fr-fr.json";

/**
 * Wording du parcours. Le type est inféré depuis `content/fr-fr.json`, qui suit
 * le schéma `content/model.json` (custom type Prismic « simulator_wording ») :
 * une clé absente devient donc une erreur de compilation, pas un « undefined »
 * à l'écran. Un changement de wording ne touche aucun `.ts`.
 */
export type Contenu = typeof contenuFr;

export const contenu: Contenu = contenuFr;
