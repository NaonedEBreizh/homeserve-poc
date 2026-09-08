const ENTREES = [
  {
    titre: "Estimer mes économies",
    detail: "8 à 10 questions fermées, sans coordonnées.",
    accent: "text-canard-500",
  },
  {
    titre: "Prendre rendez-vous",
    detail: "Visite technique dans l'agence la plus proche.",
    accent: "text-vert-600",
  },
  {
    titre: "Être appelé",
    detail: "Mise en relation directe avec un conseiller.",
    accent: "text-corail-600",
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center gap-10 p-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-semibold tracking-tight text-canard-500">
          Hello HomeServe POC
        </h1>
        <p className="text-base text-slate-600">
          Mon projet énergie — solaire, pompe à chaleur, ou les deux.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-3">
        {ENTREES.map((entree) => (
          <li
            key={entree.titre}
            className="rounded-card border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className={`text-lg font-semibold ${entree.accent}`}>
              {entree.titre}
            </h2>
            <p className="mt-2 text-sm text-slate-600">{entree.detail}</p>
          </li>
        ))}
      </ul>

      <p className="text-xs text-slate-500">
        Tokens de marque : <span className="text-corail-600">corail-600</span> ·{" "}
        <span className="text-canard-500">canard-500</span> ·{" "}
        <span className="text-vert-600">vert-600</span> · rayon{" "}
        <code className="rounded-card bg-slate-100 px-1">radius-card</code>
      </p>
    </main>
  );
}
