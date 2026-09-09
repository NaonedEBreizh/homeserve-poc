"use client";

import hypotheses from "@/data/hypotheses.json";
import type { SolaireResult } from "@/engine/solaire";
import { contenu } from "@/lib/content";
import { euros, remplacer } from "@/lib/format";
import { IllustrationToit } from "@/components/ui/pictos";

/** Tous les blocs acceptent `apercu` : réduit et inerte, pour le panneau D37. */
export type PropsApercu = { apercu?: boolean };

const TAUX_MIN = hypotheses.energie.hausse_annuelle_min.valeur;
const TAUX_MAX = hypotheses.energie.hausse_annuelle_max.valeur;

export function EncartTaux({
  taux,
  onChanger,
  apercu = false,
}: PropsApercu & { taux: number; onChanger?: (taux: number) => void }) {
  const { resultat } = contenu;
  const pourcent = Math.round(taux * 100);

  return (
    <section
      aria-hidden={apercu || undefined}
      className={`flex flex-col gap-2 rounded-card border border-neutre-200 p-4 ${apercu ? "pointer-events-none scale-95 opacity-90" : ""}`}
    >
      <h2 className="text-base font-bold text-neutre-700">
        {resultat.taux.libelle}
      </h2>

      <div className="flex items-center gap-4">
        <button
          type="button"
          tabIndex={apercu ? -1 : undefined}
          onClick={() => onChanger?.(Math.max(taux - 0.01, TAUX_MIN))}
          aria-label="Diminuer d'un point"
          className="flex size-12 items-center justify-center rounded-full border border-neutre-300 text-xl font-extrabold text-neutre-700"
        >
          −
        </button>
        <output className="text-[32px] font-extrabold text-corail-600">
          {pourcent} {resultat.taux.unite}
        </output>
        <button
          type="button"
          tabIndex={apercu ? -1 : undefined}
          onClick={() => onChanger?.(Math.min(taux + 0.01, TAUX_MAX))}
          aria-label="Augmenter d'un point"
          className="flex size-12 items-center justify-center rounded-full bg-corail-600 text-xl font-extrabold text-white"
        >
          +
        </button>
      </div>

      <p className="text-xs text-neutre-500">{resultat.taux.source}</p>
    </section>
  );
}

export function TuileHero({
  cumul,
  horizon,
  apercu = false,
}: PropsApercu & { cumul: number; horizon: number }) {
  return (
    <section
      aria-hidden={apercu || undefined}
      className={`flex flex-col items-center gap-1 rounded-tuile border-2 border-corail-600 bg-gradient-to-b from-corail-100 to-white p-6 text-center ${apercu ? "scale-95 p-3" : ""}`}
    >
      <h2 className="text-sm font-bold text-neutre-500">
        {remplacer(contenu.resultat.hero.libelle, { n: horizon })}
      </h2>
      <p
        className={`font-extrabold text-corail-600 ${apercu ? "text-2xl" : "text-[46px] leading-none"}`}
      >
        {euros(cumul)} €
      </p>
    </section>
  );
}

export function ChipsHorizon({
  horizon,
  onChanger,
  apercu = false,
}: PropsApercu & { horizon: number; onChanger?: (n: number) => void }) {
  return (
    <ul
      aria-hidden={apercu || undefined}
      // Les cinq horizons tiennent sur une ligne à 390 px.
      className={`grid grid-cols-5 gap-1.5 ${apercu ? "pointer-events-none scale-95" : ""}`}
    >
      {hypotheses.projection.horizons_ans.map((n) => (
        <li key={n}>
          <button
            type="button"
            tabIndex={apercu ? -1 : undefined}
            onClick={() => onChanger?.(n)}
            aria-pressed={n === horizon}
            className={`min-h-11 rounded-full border px-1 text-sm font-extrabold ${
              n === horizon
                ? "border-corail-600 bg-corail-600 text-white"
                : "border-neutre-200 bg-white text-neutre-700"
            }`}
          >
            {n} {contenu.resultat.horizons.unite}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function TuilesFacture({
  sans,
  avec,
  horizon,
  apercu = false,
}: PropsApercu & { sans: number; avec: number; horizon: number }) {
  const { tuiles } = contenu.resultat;

  return (
    <section aria-hidden={apercu || undefined} className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-neutre-500">
        {remplacer(tuiles.libelle, { n: horizon })}
      </h2>
      <div className={`grid grid-cols-2 gap-3 ${apercu ? "scale-95" : ""}`}>
        <div className="rounded-tuile bg-neutre-100 p-4">
          <p className="text-xs font-bold text-neutre-500">{tuiles.sans}</p>
          <p className="text-2xl font-extrabold text-neutre-700">
            {euros(sans)} €
          </p>
        </div>
        <div className="rounded-tuile border border-canard-500 bg-white p-4">
          <p className="text-xs font-bold text-canard-700">{tuiles.avec}</p>
          <p className="text-2xl font-extrabold text-canard-500">
            {euros(avec)} €
          </p>
        </div>
      </div>
    </section>
  );
}

export type ReglagesInstallation = {
  kwc: 3 | 6 | 9;
  stockage: "aucun" | "virtuel" | "batterie";
  couplage: boolean;
};

export function Configurateur({
  reglages,
  onChanger,
  apercu = false,
  bloc,
  avecPuissance = false,
}: PropsApercu & {
  reglages: ReglagesInstallation;
  onChanger?: (r: ReglagesInstallation) => void;
  /** Restreint l'aperçu à une seule ligne du configurateur (panneau D37). */
  bloc?: "kwc" | "stockage" | "couplage";
  /**
   * D45 : le choix de puissance ne figure pas dans la vue par défaut — le
   * dimensionnement relève de l'étude, pas d'un curseur. Il réapparaît sous
   * `?demo=1`, à côté de la rentabilité.
   */
  avecPuissance?: boolean;
}) {
  const { configurateur } = contenu.resultat;
  const inerte = apercu ? "pointer-events-none scale-95" : "";

  const lignes = [
    {
      cle: "kwc" as const,
      libelle: configurateur.solaire.libelle,
      options: [
        { valeur: "3", libelle: configurateur.solaire.options["3"] },
        { valeur: "6", libelle: configurateur.solaire.options["6"] },
        { valeur: "9", libelle: configurateur.solaire.options["9"] },
      ],
      actif: String(reglages.kwc),
      choisir: (v: string) =>
        onChanger?.({ ...reglages, kwc: Number(v) as 3 | 6 | 9 }),
    },
    {
      cle: "stockage" as const,
      libelle: configurateur.stockage.libelle,
      options: Object.entries(configurateur.stockage.options).map(
        ([valeur, libelle]) => ({ valeur, libelle }),
      ),
      // Le prix ne s'affiche que pour l'option retenue : la ligne reste lisible.
      sousLigne: (configurateur.stockage.prix as Record<string, string>)[
        reglages.stockage
      ],
      actif: reglages.stockage,
      choisir: (v: string) =>
        onChanger?.({
          ...reglages,
          stockage: v as ReglagesInstallation["stockage"],
        }),
    },
    {
      cle: "couplage" as const,
      libelle: configurateur.couplage.libelle,
      options: [
        { valeur: "non", libelle: configurateur.couplage.options.non },
        { valeur: "oui", libelle: configurateur.couplage.options.oui },
      ],
      actif: reglages.couplage ? "oui" : "non",
      choisir: (v: string) => onChanger?.({ ...reglages, couplage: v === "oui" }),
    },
  ]
    .filter((ligne) => ligne.cle !== "kwc" || avecPuissance || bloc === "kwc")
    .filter((ligne) => !bloc || ligne.cle === bloc);

  return (
    <section
      aria-hidden={apercu || undefined}
      className={`flex flex-col gap-4 rounded-tuile bg-neutre-100 p-4 ${inerte}`}
    >
      {bloc ? null : (
        <h2 className="text-lg font-extrabold text-neutre-700">
          {configurateur.titre}
        </h2>
      )}

      {lignes.map((ligne) => (
        <div key={ligne.cle} className="flex flex-col gap-1.5">
          <span className="text-[15px] font-bold text-neutre-500">
            {ligne.libelle}
          </span>
          <div className="flex gap-1 rounded-full bg-white p-1">
            {ligne.options.map((option) => (
              <button
                key={option.valeur}
                type="button"
                tabIndex={apercu ? -1 : undefined}
                onClick={() => ligne.choisir(option.valeur)}
                aria-pressed={ligne.actif === option.valeur}
                className={`min-h-11 flex-1 rounded-full px-2 text-[15px] font-bold ${
                  ligne.actif === option.valeur
                    ? "bg-corail-600 font-extrabold text-white"
                    : "text-neutre-700"
                }`}
              >
                {option.libelle}
              </button>
            ))}
          </div>
          {"sousLigne" in ligne && ligne.sousLigne ? (
            <span className="text-sm font-bold text-canard-700">
              {ligne.sousLigne}
            </span>
          ) : null}
        </div>
      ))}
    </section>
  );
}

export function CartePack({
  resultat,
  rentabiliteAns,
  apercu = false,
  afficherAides = false,
}: PropsApercu & {
  resultat: SolaireResult;
  rentabiliteAns?: number | null;
  /**
   * D48 : en solaire, la prime à l'autoconsommation est nulle depuis le
   * 05/06/2026 — afficher « Aides : 0 € » dessert le message. La ligne reste
   * pour les projets avec pompe à chaleur, où MaPrimeRénov' et le CEE pèsent.
   */
  afficherAides?: boolean;
}) {
  const { recommandation, rentabilite } = contenu.resultat;

  return (
    <section
      aria-hidden={apercu || undefined}
      className={`overflow-hidden rounded-tuile border border-neutre-200 ${apercu ? "scale-95" : ""}`}
    >
      <p className="bg-orange-100 px-4 py-2 text-sm font-extrabold text-neutre-700">
        {recommandation.titre}
      </p>

      <div className="flex flex-col gap-2 p-4">
        {apercu ? null : (
          <IllustrationToit className="h-16 w-full self-center" />
        )}
        {/* Jamais « votre installation » : le dimensionnement vient de l'étude. */}
        <p className="text-sm text-neutre-500">{recommandation.intro}</p>
        <h2 className="text-xl font-extrabold text-neutre-700">
          {resultat.nomPack} — {remplacer(recommandation.prix, { prix: euros(resultat.prixPack) })}
        </h2>
        <p className="text-xs text-neutre-500">{recommandation.prix_note}</p>
        <p className="text-sm font-bold text-canard-700">
          {remplacer(recommandation.puissance, { kwc: resultat.kwcConseille })}
        </p>

        <dl className="mt-2 flex flex-col divide-y divide-neutre-100 text-[17px]">
          {afficherAides ? (
            <div className="flex justify-between py-2">
              <dt className="text-neutre-500">{recommandation.aides}</dt>
              <dd className="font-extrabold text-vert-600">
                {euros(resultat.aides)} €
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between py-2">
            <dt className="text-neutre-500">{recommandation.reste}</dt>
            <dd className="font-extrabold text-neutre-700">
              {euros(resultat.resteACharge)} €
            </dd>
          </div>
          {typeof rentabiliteAns === "number" ? (
            <div className="flex justify-between py-2">
              <dt className="text-neutre-500">
                {remplacer(rentabilite.pack, { n: rentabiliteAns })}
              </dt>
              <dd />
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}

export function BlocHypotheses() {
  const { energie, aides_solaire, tap } = hypotheses;

  const lignes = [
    [`Prix du kWh : ${energie.prix_elec_kwh_ttc.valeur} €`, energie.prix_elec_kwh_ttc.source],
    [`Surplus racheté : ${energie.prix_surplus_kwh.valeur} €/kWh`, energie.prix_surplus_kwh.source],
    [
      `Prime à l'autoconsommation : ${aides_solaire.prime_autoconsommation_eur_par_kwc.valeur} €/kWc`,
      aides_solaire.prime_autoconsommation_eur_par_kwc.source,
    ],
    [`Taux d'autoproduction borné à ${tap.min}–${tap.max} %`, tap.facture_annuelle_par_tranche.source],
  ];

  return (
    <details className="rounded-card bg-neutre-100 p-4">
      <summary className="min-h-11 cursor-pointer text-base font-extrabold text-neutre-700">
        {contenu.resultat.hypotheses.titre}
      </summary>
      <ul className="mt-3 flex flex-col gap-2 text-sm">
        {lignes.map(([libelle, source]) => (
          <li key={libelle}>
            <span className="font-bold text-neutre-700">{libelle}</span>
            <span className="block text-xs text-neutre-500">{source}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-neutre-500">
        {contenu.resultat.hypotheses.disclaimer}
      </p>
    </details>
  );
}
