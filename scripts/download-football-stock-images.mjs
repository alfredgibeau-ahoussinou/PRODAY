#!/usr/bin/env node
/**
 * Télécharge les photos stock foot dans website/public/images/.
 * Uniquement visuels soccer vérifiés (Unsplash / Pexels).
 * Usage : node scripts/download-football-stock-images.mjs
 */

import { copyFileSync, existsSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  CARD,
  STADIUM,
  PEXELS_CARD,
  PEXELS_STADIUM,
} from "./lib/showcase-image-url.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../website/public/images");
const showcaseDir = resolve(__dirname, "../website/public/showcase");

/** [filename, url] — sources vérifiées foot */
const STOCK = [
  ["football-amateur-01.jpg", CARD("1574629810360-7efbbe195018")],
  ["football-supporter-01.jpg", PEXELS_CARD(114296)],
  ["football-training-01.jpg", CARD("1431324155629-1a6deb1dec8d")],
  ["football-women-01.jpg", CARD("1560272564-c83b66b1ad12")],
  ["football-club-01.jpg", STADIUM("1522778119026-d647f0596c20")],
  ["football-fans-01.jpg", PEXELS_STADIUM(1884574)],
  ["football-stadium-night-01.jpg", STADIUM("1517747614396-d21a78b850e8")],
  ["football-action-01.jpg", PEXELS_CARD(274422)],
  ["football-pitch-01.jpg", CARD("1575361204480-aadea25e6e68", "entropy")],
];

/** Fichiers conservés si le téléchargement échoue (IDs Unsplash instables). */
const LEGACY_KEEP = [
  "football-match-01.jpg",
  "football-mercato-01.jpg",
  "football-pro-01.jpg",
  "football-team-01.jpg",
];

for (const [name, url] of STOCK) {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Skip ${name}: HTTP ${res.status}`);
    continue;
  }
  writeFileSync(resolve(outDir, name), Buffer.from(await res.arrayBuffer()));
  console.log(`OK ${name}`);
}

for (const name of LEGACY_KEEP) {
  if (existsSync(resolve(outDir, name))) {
    console.log(`Keep ${name}`);
  } else {
    console.warn(`Missing ${name} — regénérer manuellement si besoin`);
  }
}

function copyFootball(from, to) {
  if (!existsSync(from)) {
    console.warn(`Skip copy — missing ${from}`);
    return;
  }
  copyFileSync(from, to);
  console.log(`Copy → ${to.split("/").pop()}`);
}

// Dérivés foot (évite les IDs Pexels erronés)
copyFootball(
  resolve(outDir, "football-team-01.jpg"),
  resolve(outDir, "football-coach-01.jpg"),
);
copyFootball(
  resolve(outDir, "football-match-01.jpg"),
  resolve(outDir, "football-health-01.jpg"),
);
copyFootball(
  resolve(outDir, "football-team-01.jpg"),
  resolve(showcaseDir, "classic-staff.jpg"),
);

console.log("Done — website/public/images/");
