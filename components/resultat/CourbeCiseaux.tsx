"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { contenu } from "@/lib/content";
import { euros, remplacer } from "@/lib/format";

export type SerieCourbe = {
  annees: number[];
  sans: number[];
  avec: number[];
};

export type Rentabilite = { annee: number; millesime: number } | null;

const MARGE = { haut: 14, bas: 26, gauche: 8, droite: 92 };

/**
 * Effet ciseaux (D36) — SVG inline, aucune bibliothèque.
 *
 * Deux séries, l'aire entre elles, les valeurs finales annotées à droite, et
 * un curseur vertical déplaçable au doigt comme au clavier : c'est ce curseur
 * qui rend la courbe lisible sur un écran de 390 px.
 */
export function CourbeCiseaux({
  serie,
  anneeCourante,
  rentabilite,
  libelles,
  apercu = false,
}: {
  serie: SerieCourbe;
  anneeCourante: number;
  rentabilite?: Rentabilite;
  /** Volet pompe à chaleur : la légende parle de chauffage, pas de solaire. */
  libelles?: { serie_sans: string; serie_avec: string };
  apercu?: boolean;
}) {
  const idAire = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const dernier = serie.annees.length - 1;
  const [indexBrut, setIndex] = useState(dernier);
  const [actif, setActif] = useState(false);

  /**
   * Changer d'horizon change la longueur de la série : sans recadrage,
   * le curseur resterait sur un index hors bornes et l'infobulle afficherait
   * 0 € — un résultat figé sur l'horizon précédent.
   */
  useEffect(() => {
    setIndex(dernier);
  }, [dernier]);

  // Filet de sécurité : aucun rendu ne doit lire hors de la série, même
  // pendant le rendu qui précède l'effet ci-dessus.
  const index = Math.min(indexBrut, dernier);

  const largeur = apercu ? 300 : 326;
  const hauteur = apercu ? 96 : 190;

  const geo = useMemo(() => {
    const max = Math.max(...serie.sans, 1);
    const x = (i: number) =>
      MARGE.gauche +
      (i / Math.max(dernier, 1)) *
        (largeur - MARGE.gauche - MARGE.droite);
    const y = (valeur: number) =>
      MARGE.haut +
      (1 - valeur / max) * (hauteur - MARGE.haut - MARGE.bas);

    const ligne = (valeurs: number[]) =>
      valeurs.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)} ${y(v)}`).join(" ");

    return {
      x,
      y,
      ligneSans: ligne(serie.sans),
      ligneAvec: ligne(serie.avec),
      aire: `${ligne(serie.sans)} L${x(dernier)} ${y(serie.avec[dernier]!)} ${serie.avec
        .map((v, i) => `L${x(dernier - i)} ${y(serie.avec[dernier - i]!)}`)
        .join(" ")} Z`,
    };
  }, [serie, dernier, largeur, hauteur]);

  const sansCourant = serie.sans[index] ?? 0;
  const avecCourant = serie.avec[index] ?? 0;
  const millesime = anneeCourante + (serie.annees[index] ?? 0);

  function positionner(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const ratio =
      (clientX - rect.left) / rect.width * largeur - MARGE.gauche;
    const utile = largeur - MARGE.gauche - MARGE.droite;
    const proche = Math.round((ratio / utile) * dernier);

    setIndex(Math.min(Math.max(proche, 0), dernier));
  }

  const courbe = { ...contenu.resultat.courbe, ...libelles };

  if (apercu) {
    return (
      <svg
        viewBox={`0 0 ${largeur} ${hauteur}`}
        className="w-full"
        aria-hidden="true"
      >
        <path
          d={geo.aire}
          fill="var(--color-canard-300)"
          fillOpacity={0.45}
        />
        <path d={geo.ligneSans} fill="none" stroke="var(--color-neutre-400)" strokeWidth={2} />
        <path d={geo.ligneAvec} fill="none" stroke="var(--color-canard-500)" strokeWidth={2} />
      </svg>
    );
  }

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5 text-neutre-500">
          <span className="inline-block h-0.5 w-4 bg-neutre-400" />
          {courbe.serie_sans}
        </span>
        <span className="flex items-center gap-1.5 text-canard-700">
          <span className="inline-block h-0.5 w-4 bg-canard-500" />
          {courbe.serie_avec}
        </span>
      </figcaption>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${largeur} ${hauteur}`}
        className="min-h-[190px] w-full touch-none"
        role="slider"
        tabIndex={0}
        aria-label={courbe.aide_curseur}
        aria-valuemin={serie.annees[0]}
        aria-valuemax={serie.annees[dernier]}
        aria-valuenow={serie.annees[index]}
        aria-valuetext={remplacer(courbe.infobulle, {
          annee: millesime,
          sans: euros(sansCourant),
          avec: euros(avecCourant),
        })}
        onPointerDown={(e) => {
          setActif(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          positionner(e.clientX);
        }}
        onPointerMove={(e) => {
          if (actif) positionner(e.clientX);
        }}
        onPointerUp={() => setActif(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setIndex(Math.max(index - 1, 0));
          if (e.key === "ArrowRight") setIndex(Math.min(index + 1, dernier));
        }}
      >
        <path d={geo.aire} fill="var(--color-canard-100)" />

        {/* Rentabilité (D41) : uniquement sous drapeau, jamais par défaut. */}
        {rentabilite ? (
          <g>
            <line
              x1={geo.x(rentabilite.annee)}
              x2={geo.x(rentabilite.annee)}
              y1={MARGE.haut}
              y2={hauteur - MARGE.bas}
              stroke="var(--color-canard-500)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              data-testid="trait-rentabilite"
            />
            <text
              x={geo.x(rentabilite.annee) + 4}
              y={MARGE.haut + 8}
              fontSize={9}
              fill="var(--color-canard-700)"
            >
              {remplacer(contenu.resultat.rentabilite.trait, {
                annee: rentabilite.millesime,
                n: rentabilite.annee,
              })}
            </text>
          </g>
        ) : null}

        <path
          d={geo.ligneSans}
          fill="none"
          stroke="var(--color-neutre-400)"
          strokeWidth={2.5}
        />
        <path
          d={geo.ligneAvec}
          fill="none"
          stroke="var(--color-canard-500)"
          strokeWidth={2.5}
        />

        {/* Valeurs finales annotées à droite */}
        <text
          x={geo.x(dernier) + 6}
          y={geo.y(serie.sans[dernier]!) + 3}
          fontSize={11}
          fontWeight={800}
          fill="var(--color-neutre-500)"
        >
          {remplacer(courbe.annotation, { valeur: euros(serie.sans[dernier]!) })}
        </text>
        <text
          x={geo.x(dernier) + 6}
          y={geo.y(serie.avec[dernier]!) + 3}
          fontSize={11}
          fontWeight={800}
          fill="var(--color-canard-500)"
        >
          {remplacer(courbe.annotation, { valeur: euros(serie.avec[dernier]!) })}
        </text>

        {/* Curseur de lecture */}
        <line
          x1={geo.x(index)}
          x2={geo.x(index)}
          y1={MARGE.haut}
          y2={hauteur - MARGE.bas}
          stroke="var(--color-corail-600)"
          strokeWidth={1.5}
        />
        <circle
          cx={geo.x(index)}
          cy={geo.y(sansCourant)}
          r={3.5}
          fill="var(--color-corail-600)"
        />
        <circle
          cx={geo.x(index)}
          cy={geo.y(avecCourant)}
          r={3.5}
          fill="var(--color-corail-600)"
        />

        {/* Axe : une graduation tous les 5 ans */}
        {serie.annees
          .filter((annee) => annee % 5 === 0)
          .map((annee) => (
            <text
              key={annee}
              x={geo.x(serie.annees.indexOf(annee))}
              y={hauteur - 8}
              fontSize={11}
              fill="var(--color-neutre-500)"
              textAnchor="middle"
            >
              {annee}
            </text>
          ))}
      </svg>

      <p
        aria-live="polite"
        className="self-start rounded-card bg-neutre-100 px-3 py-1.5 text-[13px] font-bold text-neutre-700"
      >
        {remplacer(courbe.infobulle, {
          annee: millesime,
          sans: euros(sansCourant),
          avec: euros(avecCourant),
        })}
      </p>
    </figure>
  );
}
