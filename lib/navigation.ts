"use client";

/**
 * Les drapeaux de démonstration (`variant`, `debug`, `demo`) doivent survivre
 * à chaque navigation : sans cela, une démo lancée en `?variant=mur` perdrait
 * sa variante au premier clic.
 */
const DRAPEAUX = ["variant", "debug", "demo"] as const;

export function avecDrapeaux(
  chemin: string,
  parametres: URLSearchParams | null,
  extra: Record<string, string> = {},
): string {
  const query = new URLSearchParams();

  for (const drapeau of DRAPEAUX) {
    const valeur = parametres?.get(drapeau);
    if (valeur) query.set(drapeau, valeur);
  }
  for (const [cle, valeur] of Object.entries(extra)) query.set(cle, valeur);

  const suffixe = query.toString();
  return suffixe ? `${chemin}?${suffixe}` : chemin;
}
