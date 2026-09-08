import { afterEach, describe, expect, it, vi } from "vitest";

const vercelInitial = process.env.VERCEL;

/**
 * `next.config.ts` lit `process.env.VERCEL` au chargement du module : il faut
 * donc réinitialiser le cache de modules entre les deux branches.
 */
async function chargerConfig() {
  vi.resetModules();
  const module = await import("@/next.config");
  return module.default;
}

afterEach(() => {
  if (vercelInitial === undefined) {
    delete process.env.VERCEL;
  } else {
    process.env.VERCEL = vercelInitial;
  }
  vi.resetModules();
});

describe("next.config — output", () => {
  it("reste 'standalone' hors Vercel (Dockerfile / GKE, pnpm start)", async () => {
    delete process.env.VERCEL;

    const config = await chargerConfig();

    expect(config.output).toBe("standalone");
  });

  it("est désactivé sur Vercel, qui fait son propre empaquetage", async () => {
    process.env.VERCEL = "1";

    const config = await chargerConfig();

    expect(config.output).toBeUndefined();
  });

  it("laisse les en-têtes de sécurité intacts dans les deux cas", async () => {
    process.env.VERCEL = "1";
    const surVercel = await chargerConfig();
    const entetes = await surVercel.headers?.();

    expect(entetes?.[0]?.headers.map((h) => h.key)).toContain(
      "Strict-Transport-Security",
    );
  });
});
