// `output: "standalone"` emits a self-contained server, but Next.js
// deliberately leaves the static assets out of it. Copy them next to the
// server so `pnpm start` serves a complete app locally, exactly as the
// Dockerfile does for the production image.
import { cpSync, existsSync } from "node:fs";

const standalone = ".next/standalone";

if (!existsSync(standalone)) {
  console.error(
    "prepare-standalone: .next/standalone is missing — run `pnpm build` first.",
  );
  process.exit(1);
}

cpSync(".next/static", `${standalone}/.next/static`, { recursive: true });

if (existsSync("public")) {
  cpSync("public", `${standalone}/public`, { recursive: true });
}

console.log("prepare-standalone: static assets copied.");
