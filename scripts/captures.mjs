/**
 * `pnpm screenshots` — captures de la démo pour la note et la revue.
 *
 * Lance le serveur standalone sur un port libre, pilote Chromium en 390 px,
 * écrit les six vues dans docs/captures/, puis s'arrête. Chromium est celui
 * déjà installé dans l'environnement ; aucun téléchargement.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { chromium } from "playwright-core";

const PORT = Number(process.env.PORT_CAPTURES ?? 3210);
const BASE = `http://127.0.0.1:${PORT}`;
const DOSSIER = "docs/captures";
const LARGEUR = 390;

/** Chemins possibles du Chromium préinstallé, du plus précis au plus large. */
const CHROMIUM = [
  process.env.CHROMIUM_PATH,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].filter((chemin) => chemin && existsSync(chemin));

/** État d'un parcours solaire complet, tel que le simulateur l'enregistre. */
const ETAT_SOLAIRE = {
  version: 1,
  variant: "defaut",
  debug: false,
  projet: "solaire",
  events: [],
  reponses: {
    projet: "solaire",
    cp: "69002",
    occupation: "5_jours_et_plus",
    personnes: "3-4",
    surface_sol: "100-135",
    chauffage: "radiateurs_electriques",
    equipements: ["vehicule_electrique", "chauffe_eau_thermodynamique"],
    facture_mensuelle: "101-135",
  },
};

function attendre(ms) {
  return new Promise((resoudre) => setTimeout(resoudre, ms));
}

async function serveurPret(essais = 40) {
  for (let i = 0; i < essais; i++) {
    try {
      const reponse = await fetch(`${BASE}/`);
      if (reponse.ok) return true;
    } catch {
      // le serveur n'écoute pas encore
    }
    await attendre(500);
  }
  return false;
}

async function capturer(page, nom) {
  await page.screenshot({ path: `${DOSSIER}/${nom}.png`, fullPage: true });
  console.log(`  ${DOSSIER}/${nom}.png`);
}

/** Remplit le store, puis ouvre la route demandée. */
async function ouvrir(page, route, etat) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  if (etat) {
    await page.evaluate(
      (valeur) => sessionStorage.setItem("hs.projet", valeur),
      JSON.stringify(etat),
    );
  }
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
  await attendre(900);
}

async function main() {
  if (CHROMIUM.length === 0) {
    console.error(
      "Aucun Chromium trouvé. Renseignez CHROMIUM_PATH vers un binaire existant.",
    );
    process.exit(1);
  }
  if (!existsSync(".next/standalone/server.js")) {
    console.error("Build absent : lancez `pnpm build` d'abord.");
    process.exit(1);
  }

  mkdirSync(DOSSIER, { recursive: true });

  const serveur = spawn("node", [".next/standalone/server.js"], {
    env: { ...process.env, NODE_ENV: "production", PORT: String(PORT), HOSTNAME: "127.0.0.1" },
    stdio: "ignore",
  });

  try {
    if (!(await serveurPret())) throw new Error(`Serveur muet sur ${BASE}`);

    const navigateur = await chromium.launch({
      executablePath: CHROMIUM[0],
      args: ["--no-sandbox"],
    });
    const contexte = await navigateur.newContext({
      viewport: { width: LARGEUR, height: 844 },
      hasTouch: true,
    });
    const page = await contexte.newPage();

    await ouvrir(page, "/?projet=solaire");
    await capturer(page, "accueil");

    // Un écran de question : la multi-sélection, la plus riche visuellement.
    // L'assistant est linéaire : préremplir le store ne l'avance pas, on le
    // pilote donc par l'interface jusqu'à A6.
    const clic = async (nom) => {
      await page.getByRole("button", { name: nom }).first().click();
      await attendre(280);
    };

    await ouvrir(page, "/simulateur?source=captures", {
      ...ETAT_SOLAIRE,
      reponses: { projet: "solaire" },
    });
    await page.locator("input[inputmode=numeric]").fill("69002");
    await clic("Continuer");
    await clic("5 jours et plus");
    await clic("3 ou 4 personnes");
    await clic("Continuer");
    await clic("Radiateurs électriques");
    await attendre(400);
    await capturer(page, "question");

    await ouvrir(page, "/resultat", ETAT_SOLAIRE);
    await capturer(page, "resultat");

    // Calendrier : on traverse la porte chaude jusqu'à B20.
    await ouvrir(page, "/rendez-vous", ETAT_SOLAIRE);
    await clic("Une maison");
    await clic("Propriétaire");
    await clic("Non");
    await clic("Votre résidence principale");
    // L'année de construction n'est pas héritée du simulateur solaire, et
    // le parcours solaire n'en propose que trois tranches (D49).
    await clic("Après 1997");
    await clic("Rénovée");
    await clic("Tuiles");
    await page.locator("input").nth(0).fill("1 place Bellecour");
    await page.locator("input").nth(2).fill("Lyon");
    await clic("Continuer");
    await page.locator("input").nth(0).fill("Camille");
    await page.locator("input").nth(1).fill("Martin");
    await clic("Continuer");
    await page.locator("input[type=email]").fill("camille.martin@example.org");
    await page.locator("input[inputmode=numeric]").fill("0612345678");
    await clic("Recevoir mon code");
    await page.locator("input[inputmode=numeric]").fill("4821");
    await clic("Continuer");
    await clic("Continuer");
    await attendre(700);
    await capturer(page, "rdv-calendrier");

    // Confirmation : on choisit le premier créneau proposé.
    const chips = page.locator("ul").last().getByRole("button");
    if ((await chips.count()) > 0) {
      await chips.first().click();
      await attendre(300);
      await clic("Je confirme ce créneau");
      await clic("Je confirme");
      await attendre(400);
      await clic("Continuer");
      await attendre(900);
    }
    await capturer(page, "confirmation");

    await navigateur.close();
    console.log(`\n6 captures écrites dans ${DOSSIER}/ (${LARGEUR} px).`);
  } finally {
    serveur.kill("SIGKILL");
  }
}

await main();
