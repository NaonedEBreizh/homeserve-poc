/** Formats français partagés par les écrans (espaces insécables comprises). */
const EUROS = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function euros(valeur: number): string {
  return EUROS.format(Math.round(valeur));
}

export function remplacer(
  modele: string,
  valeurs: Record<string, string | number>,
): string {
  return Object.entries(valeurs).reduce(
    (texte, [cle, valeur]) => texte.replaceAll(`{${cle}}`, String(valeur)),
    modele,
  );
}
