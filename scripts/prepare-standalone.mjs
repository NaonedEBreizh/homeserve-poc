// `output: "standalone"` produit un serveur autonome, mais Next.js laisse
// volontairement les fichiers statiques dehors. On les recopie à côté du
// serveur pour que `pnpm start` serve une application complète en local,
// exactement comme le Dockerfile le fait pour l'image de production.
//
// Le dossier standalone peut légitimement être absent : un build fait avec
// VERCEL défini ne le produit pas (voir next.config.ts). Ce script ne doit
// alors ni échouer ni bloquer — il se contente d'expliquer la situation.
import { cpSync, existsSync } from "node:fs";

const standalone = ".next/standalone";

if (!existsSync(standalone)) {
  console.warn(
    `prepare-standalone : ${standalone} absent — rien à copier.\n` +
      "  Cause probable : aucun build, ou build effectué avec VERCEL défini\n" +
      "  (la sortie standalone est alors désactivée). Lancez `pnpm build`\n" +
      "  sans VERCEL pour `pnpm start`, ou servez ce build avec `next start`.",
  );
  process.exit(0);
}

if (existsSync(".next/static")) {
  cpSync(".next/static", `${standalone}/.next/static`, { recursive: true });
}

if (existsSync("public")) {
  cpSync("public", `${standalone}/public`, { recursive: true });
}

console.log("prepare-standalone : fichiers statiques copiés.");
