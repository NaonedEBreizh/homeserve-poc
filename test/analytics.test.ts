import { beforeEach, describe, expect, it } from "vitest";

import { evenements, track, viderBus } from "@/lib/analytics";
import { __reinitialiserPourTests, setVariant } from "@/lib/store";

beforeEach(() => {
  sessionStorage.clear();
  __reinitialiserPourTests();
  viderBus();
  delete window.dataLayer;
});

describe("track", () => {
  it("crée window.dataLayer s'il est absent", () => {
    expect(window.dataLayer).toBeUndefined();

    track("sim_start");

    expect(window.dataLayer).toHaveLength(1);
  });

  it("pousse event, variant et horodatage", () => {
    track("sim_result_shown", { horizon: 25 });

    expect(window.dataLayer?.[0]).toMatchObject({
      event: "sim_result_shown",
      variant: "defaut",
      horizon: 25,
    });
    expect(typeof window.dataLayer?.[0]?.ts).toBe("number");
  });

  it("porte la variante courante sur chaque événement", () => {
    setVariant("mur");

    track("call_click", { source: "header", step: "/resultat" });

    expect(window.dataLayer?.[0]).toMatchObject({
      event: "call_click",
      variant: "mur",
      source: "header",
      step: "/resultat",
    });
  });

  it("réutilise un dataLayer déjà en place (GTM chargé avant nous)", () => {
    window.dataLayer = [{ event: "gtm.js" }];

    track("sim_start");

    expect(window.dataLayer).toHaveLength(2);
    expect(window.dataLayer[0]).toEqual({ event: "gtm.js" });
  });

  it("alimente le bus interne lu par le panneau debug", () => {
    track("sim_step_1");
    track("sim_step_2");

    expect(evenements().map((e) => e.event)).toEqual([
      "sim_step_1",
      "sim_step_2",
    ]);
  });
});
