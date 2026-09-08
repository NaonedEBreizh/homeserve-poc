"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import hypotheses from "@/data/hypotheses.json";
import { projeter, simulerSolaire } from "@/engine/solaire";
import { track } from "@/lib/analytics";
import { contenu } from "@/lib/content";
import { entreesSolaire } from "@/lib/entrees";
import { euros, remplacer } from "@/lib/format";
import { avecDrapeaux } from "@/lib/navigation";
import { CTA_PRIMAIRE, CTA_SECONDAIRE, SECTION_ALTERNEE } from "@/lib/styles";
import { useHydrate, useProjet } from "@/lib/store";

import { IllustrationBatterie, IllustrationPac, IllustrationToit } from "./ui/pictos";
import { MurContact } from "./MurContact";
import { CourbeCiseaux, type Rentabilite } from "./resultat/CourbeCiseaux";
import { EtApres } from "./resultat/EtApres";
import { PanneauComprendre, type OngletComprendre } from "./resultat/PanneauComprendre";
import {
  BlocHypotheses,
  CartePack,
  ChipsHorizon,
  Configurateur,
  EncartTaux,
  TuileHero,
  TuilesFacture,
  type ReglagesInstallation,
} from "./resultat/blocs";

const ANNEE_COURANTE = 2026;
const HORIZON_RECHERCHE_RENTABILITE = 40;

export function Resultat() {
  const parametres = useSearchParams();
  const etat = useProjet();
  const hydrate = useHydrate();

  const [taux, setTaux] = useState(hypotheses.energie.hausse_annuelle_defaut.valeur);
  const [horizon, setHorizon] = useState(hypotheses.projection.horizon_defaut);
  const [reglages, setReglages] = useState<ReglagesInstallation | null>(null);

  const entrees = hydrate ? entreesSolaire(etat) : null;

  // Le kWc conseillé sert de point de départ au configurateur.
  const conseil = useMemo(
    () => (entrees ? simulerSolaire(entrees) : null),
    [entrees],
  );

  useEffect(() => {
    if (conseil && !reglages) {
      setReglages({
        kwc: conseil.kwcConseille,
        stockage: "aucun",
        couplage: etat.projet === "les_deux",
      });
    }
  }, [conseil, reglages, etat.projet]);

  const resultat = useMemo(() => {
    if (!entrees || !reglages) return null;
    return simulerSolaire(entrees, {
      kwc: reglages.kwc,
      stockage: reglages.stockage,
      couplagePac: reglages.couplage,
    });
  }, [entrees, reglages]);

  const projection = useMemo(
    () =>
      resultat
        ? projeter({
            factureAnnuelle: resultat.factureAnnuelle,
            tapPct: resultat.tapEffectifPct,
            tauxHausse: taux,
            horizon,
            convention: "homeserve",
          })
        : null,
    [resultat, taux, horizon],
  );

  useEffect(() => {
    if (resultat) track("sim_result_shown", { horizon, taux });
  }, [resultat, horizon, taux]);

  /**
   * Rentabilité (D41) : première année où le cumul des économies, surplus
   * inclus, atteint le prix public du pack. Uniquement sous `?demo=1`.
   */
  const rentabilite = useMemo(() => {
    if (!etat.demo || !resultat) return null;

    const longue = projeter({
      factureAnnuelle: resultat.factureAnnuelle,
      tapPct: resultat.tapEffectifPct,
      tauxHausse: taux,
      horizon: HORIZON_RECHERCHE_RENTABILITE,
      convention: "homeserve",
    });

    let cumul = 0;
    for (let annee = 1; annee <= HORIZON_RECHERCHE_RENTABILITE; annee++) {
      cumul += (longue.economies[annee] ?? 0) + resultat.surplusAn;
      if (cumul >= resultat.prixPack) return annee;
    }
    return null;
  }, [etat.demo, resultat, taux]);

  const traitRentabilite: Rentabilite =
    rentabilite !== null && rentabilite <= horizon
      ? { annee: rentabilite, millesime: ANNEE_COURANTE + rentabilite }
      : null;

  // Variante mur : le résultat n'est pas affiché du tout.
  if (etat.variant === "mur") return <MurContact />;

  if (!hydrate || !resultat || !projection || !reglages) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
        <div className="h-8 w-2/3 animate-pulse rounded bg-neutre-100" />
        <div className="h-40 animate-pulse rounded-tuile bg-neutre-100" />
      </main>
    );
  }

  const { resultat: t } = contenu;
  const serie = {
    annees: projection.annees,
    sans: projection.factureSans,
    avec: projection.factureAvec,
  };

  const deltaUnPoint = (() => {
    const plus = projeter({
      factureAnnuelle: resultat.factureAnnuelle,
      tapPct: resultat.tapEffectifPct,
      tauxHausse: taux + 0.01,
      horizon,
      convention: "homeserve",
    });
    return plus.cumul - projection.cumul;
  })();

  const onglets: OngletComprendre[] = [
    {
      cle: "taux",
      ...t.comprendre_panneau.blocs.taux,
      vignette: <EncartTaux taux={taux} apercu />,
    },
    {
      cle: "hero",
      ...t.comprendre_panneau.blocs.hero,
      vignette: <TuileHero cumul={projection.cumul} horizon={horizon} apercu />,
    },
    {
      cle: "courbe",
      ...t.comprendre_panneau.blocs.courbe,
      vignette: (
        <CourbeCiseaux serie={serie} anneeCourante={ANNEE_COURANTE} apercu />
      ),
    },
    {
      cle: "factures",
      ...t.comprendre_panneau.blocs.factures,
      vignette: (
        <TuilesFacture
          sans={projection.factureSans.at(-1)!}
          avec={projection.factureAvec.at(-1)!}
          horizon={horizon}
          apercu
        />
      ),
    },
    {
      cle: "pack",
      ...t.comprendre_panneau.blocs.pack,
      vignette: (
        <>
          <IllustrationToit className="h-16 w-full" />
          <CartePack resultat={resultat} apercu />
        </>
      ),
    },
    ...(etat.demo
      ? [
          {
            cle: "kwc",
            ...t.comprendre_panneau.blocs.kwc,
            vignette: <Configurateur reglages={reglages} bloc="kwc" apercu />,
            impacts: impactsOption("kwc"),
          },
        ]
      : []),
    {
      cle: "stockage",
      ...t.comprendre_panneau.blocs.stockage,
      vignette: (
        <>
          <IllustrationBatterie className="h-16 w-full" />
          <Configurateur reglages={reglages} bloc="stockage" apercu />
        </>
      ),
      impacts: impactsOption("stockage"),
    },
    {
      cle: "couplage",
      ...t.comprendre_panneau.blocs.couplage,
      vignette: (
        <>
          <IllustrationPac className="h-16 w-full" />
          <Configurateur reglages={reglages} bloc="couplage" apercu />
        </>
      ),
      impacts: impactsOption("couplage"),
    },
  ];

  /** Impact chiffré d'une option sur le cumul, à réglages égaux par ailleurs. */
  function impactsOption(bloc: "kwc" | "stockage" | "couplage"): string[] {
    if (!entrees || !reglages) return [];

    const cumulDe = (r: ReglagesInstallation) => {
      const s = simulerSolaire(entrees, {
        kwc: r.kwc,
        stockage: r.stockage,
        couplagePac: r.couplage,
      });
      return projeter({
        factureAnnuelle: s.factureAnnuelle,
        tapPct: s.tapEffectifPct,
        tauxHausse: taux,
        horizon,
        convention: "homeserve",
      }).cumul;
    };

    const reference = cumulDe(reglages);
    const variantes: Array<[string, ReglagesInstallation]> =
      bloc === "kwc"
        ? ([3, 6, 9] as const)
            .filter((kwc) => kwc !== reglages.kwc)
            .map((kwc) => [
              remplacer(t.configurateur.solaire.options[String(kwc) as "3"], {}),
              { ...reglages, kwc },
            ])
        : bloc === "stockage"
          ? (["aucun", "virtuel", "batterie"] as const)
              .filter((s) => s !== reglages.stockage)
              .map((stockage) => [
                t.configurateur.stockage.options[stockage],
                { ...reglages, stockage },
              ])
          : [
              [
                reglages.couplage
                  ? t.configurateur.couplage.options.non
                  : t.configurateur.couplage.options.oui,
                { ...reglages, couplage: !reglages.couplage },
              ],
            ];

    return variantes.map(([libelle, variante]) => {
      const ecart = cumulDe(variante) - reference;
      return remplacer(t.comprendre_panneau.impact, {
        option: libelle,
        impact: `${ecart >= 0 ? "+" : "−"}${euros(Math.abs(ecart))} €`,
        n: horizon,
      });
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-5 pb-24 text-[17px]">
      {resultat.horsZone ? (
        <p className="rounded-card bg-orange-100 p-3 text-sm font-bold text-orange-600">
          {t.hors_zone.bandeau}
        </p>
      ) : null}

      <header className="flex items-center justify-between gap-3">
        <h1 className="text-[26px] font-extrabold text-neutre-700">{t.titre}</h1>
        <PanneauComprendre onglets={onglets} />
      </header>

      <EncartTaux
        taux={taux}
        onChanger={(valeur) => {
          setTaux(valeur);
          track("sim_inflation_changed", { taux: valeur });
        }}
      />

      <TuileHero cumul={projection.cumul} horizon={horizon} />

      <ChipsHorizon horizon={horizon} onChanger={setHorizon} />

      <CourbeCiseaux
        serie={serie}
        anneeCourante={ANNEE_COURANTE}
        rentabilite={traitRentabilite}
      />

      <TuilesFacture
        sans={projection.factureSans.at(-1)!}
        avec={projection.factureAvec.at(-1)!}
        horizon={horizon}
      />

      <p className="text-[17px] text-neutre-700">
        {remplacer(t.courbe.phrase, {
          delta: euros(deltaUnPoint),
          n: horizon,
        })}
      </p>

      <div className={SECTION_ALTERNEE}>
      <Configurateur
        reglages={reglages}
        avecPuissance={etat.demo}
        onChanger={(r) => {
          setReglages(r);
          track("sim_option_toggled", { ...r });
        }}
      />
      </div>

      <CartePack resultat={resultat} rentabiliteAns={rentabilite} />

      {etat.demo ? (
        <p className="text-xs text-neutre-500">{t.rentabilite.mention}</p>
      ) : null}

      {/* D44 : entre la carte pack et le CTA. */}
      <EtApres />

      <BlocHypotheses />

      <div className="flex flex-col gap-3">
        <Link
          href={avecDrapeaux("/rendez-vous", parametres, { source: "resultat" })}
          onClick={() => track("sim_to_booking", { horizon })}
          className={CTA_PRIMAIRE}
        >
          {t.cta_principal}
        </Link>
        <Link
          href={avecDrapeaux("/rendez-vous", parametres, { rappel: "1" })}
          onClick={() => track("callback_requested", { source: "resultat" })}
          className={CTA_SECONDAIRE}
        >
          {t.cta_rappel}
        </Link>
        {/* Aucun bouton d'appel ici : D34 le réserve à /, aux sorties et à la
            confirmation. */}
      </div>

      {/* Barre d'actions collante : sur mobile, le CTA principal ne quitte
          jamais l'écran. */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center gap-3 border-t border-neutre-200 bg-white px-5 py-3 shadow-[0_-2px_8px_rgba(30,30,30,0.08)]">
        <span className="flex flex-col">
          <span className="text-xs text-neutre-500">
            {remplacer(t.hero.libelle, { n: horizon })}
          </span>
          <span className="text-base font-extrabold text-corail-600">
            {euros(projection.cumul)} €
          </span>
        </span>
        <Link
          href={avecDrapeaux("/rendez-vous", parametres, { source: "sticky" })}
          onClick={() => track("sim_to_booking", { source: "sticky", horizon })}
          className="ml-auto flex min-h-11 items-center rounded-full bg-corail-600 px-4 text-sm font-extrabold text-white shadow-[0_2px_6px_rgba(226,44,34,0.24)]"
        >
          {t.widget_sticky}
        </Link>
      </div>
    </main>
  );
}
