/**
 * Couplage solaire + pompe à chaleur (projet « les deux », ou couplage activé
 * depuis le configurateur du résultat).
 *
 * Deux effets, tous deux paramétrés dans les données :
 * (a) le coefficient de chauffage du moteur solaire passe du malus PAC −9,2 à
 *     +3,0 : pilotée par le HEMS, la PAC consomme en journée ;
 * (b) le coût annuel de la PAC est réduit de la part de sa consommation
 *     couverte par l'autoconsommation (25 %).
 */
import hypotheses from "@/data/hypotheses.json";
import baremes from "@/data/pac-baremes.json";

import { simulerPac, type EntreesPac, type OptionsPac, type PacResult } from "./pac";
import {
  simulerSolaire,
  type EntreesSolaire,
  type OptionsSolaire,
  type SolaireResult,
} from "./solaire";

export type EntreesCouplage = {
  solaire: EntreesSolaire;
  pac: EntreesPac;
};

export type OptionsCouplage = {
  solaire?: Omit<OptionsSolaire, "couplagePac">;
  pac?: Omit<OptionsPac, "couplageSolaire">;
};

export type CouplageResult = {
  solaire: SolaireResult;
  pac: PacResult;
  economiesAnTotales: number;
  resteAChargeTotal: number;
  retourAns: number;
  /** Ce que le couplage change, pour l'afficher tel quel à l'écran. */
  effets: {
    bonusTapPacPilotee: number;
    partConsoPacCouverte: number;
  };
};

export const BONUS_TAP_PAC_PILOTEE =
  hypotheses.couplage_solaire_pac.bonus_tap_pac_pilotee_points.valeur;

export const PART_CONSO_PAC_COUVERTE =
  baremes.couplage_solaire_pac.part_conso_pac_couverte.valeur;

function arrondi2(valeur: number): number {
  return Math.round(valeur * 100) / 100;
}

export function simulerCouplage(
  entrees: EntreesCouplage,
  options: OptionsCouplage = {},
): CouplageResult {
  const solaire = simulerSolaire(entrees.solaire, {
    ...options.solaire,
    couplagePac: true,
  });

  const pac = simulerPac(entrees.pac, {
    ...options.pac,
    couplageSolaire: true,
  });

  const economiesAnTotales = solaire.economiesAn + pac.economieAn;
  const resteAChargeTotal = solaire.resteACharge + pac.resteACharge;

  return {
    solaire,
    pac,
    economiesAnTotales,
    resteAChargeTotal,
    retourAns:
      economiesAnTotales > 0
        ? arrondi2(resteAChargeTotal / economiesAnTotales)
        : Infinity,
    effets: {
      bonusTapPacPilotee: BONUS_TAP_PAC_PILOTEE,
      partConsoPacCouverte: PART_CONSO_PAC_COUVERTE,
    },
  };
}
