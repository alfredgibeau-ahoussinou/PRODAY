#!/usr/bin/env node
/**
 * Télécharge / remplace les photos stock foot dans website/public/images/.
 * Usage : node scripts/download-football-stock-images.mjs
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { CARD, STADIUM } from "./lib/showcase-image-url.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../website/public/images");

/** [filename, url, source note] */
const STOCK = [
  [
    "football-coach-01.jpg",
    "https://images.pexels.com/photos/2904163/pexels-photo-2904163.jpeg?auto=compress&cs=tinysrgb&w=1400&h=900&fit=crop",
    "Pexels #2904163 — coach donnant consignes sur le terrain",
  ],
  [
    "football-health-01.jpg",
    "https://images.pexels.com/photos/3991878/pexels-photo-3991878.jpeg?auto=compress&cs=tinysrgb&w=1400&h=900&fit=crop",
    "Pexels #3991878 — joueur s'échauffant sur la pelouse",
  ],
  [
    "football-stadium-night-01.jpg",
    STADIUM("1518609878373-06d740f60d8b"),
    "Unsplash — stade / pelouse éclairée",
  ],
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

console.log("Done — website/public/images/");
