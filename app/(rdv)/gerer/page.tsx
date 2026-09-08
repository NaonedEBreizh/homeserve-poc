import { contenu } from "@/lib/content";

/**
 * `/gerer` est volontairement non fonctionnel : le prototype le dit à
 * l'écran plutôt que de simuler une modification qui n'existe pas.
 */
export default function PageGerer() {
  const { gerer } = contenu.rdv;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-5">
      <h1 className="text-2xl font-extrabold text-neutre-700">{gerer.titre}</h1>
      <p className="self-start rounded-full bg-orange-100 px-3 py-1 text-xs font-extrabold text-orange-600">
        {gerer.badge}
      </p>
      <p className="text-base text-neutre-500">{gerer.texte}</p>

      <div className="flex flex-col gap-3">
        {[gerer.modifier, gerer.annuler].map((libelle) => (
          <button
            key={libelle}
            type="button"
            disabled
            className="min-h-14 rounded-full border-2 border-neutre-300 bg-white text-lg font-extrabold text-neutre-300"
          >
            {libelle}
          </button>
        ))}
      </div>
    </main>
  );
}
