#!/usr/bin/env node
/**
 * Télécharge des visuels foot classique, recadrés pour l’UI ProDay.
 *   node scripts/download-classic-showcase-images.mjs
 */

import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CARD, HERO, STADIUM, WIDE } from './lib/showcase-image-url.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../assets/generated/classic');

const SOURCES = [
  ['classic-discover-hero.jpg', HERO('1721506931381-3ba300ad71f4')],
  ['classic-mercato.jpg', CARD('1431324155629-1a6deb1dec8d')],
  ['classic-profile.jpg', CARD('1574629810360-7efbbe195018')],
  ['classic-match.jpg', CARD('1560272564-c83b66b1ad12')],
  ['classic-arena.jpg', STADIUM('1731870881782-1948058d9ce1')],
  ['classic-staff.jpg', CARD('1526232761682-c235c4d8e8c0')],
  ['classic-exp-messages.jpg', STADIUM('1522778119026-d647f0596c20')],
  ['classic-exp-pulse.jpg', STADIUM('1434648957308-5e6a859697e8')],
  ['classic-exp-arena.jpg', STADIUM('1727873275022-d5189075c660')],
  ['classic-exp-sponsors.jpg', CARD('1575361204480-aadea25e6e68', 'entropy')],
  ['classic-exp-discover.jpg', STADIUM('1517747614396-d21a78b850e8')],
  ['classic-exp-team.jpg', WIDE('1522778119026-d647f0596c20', 'entropy')],
  ['classic-exp-profile.jpg', CARD('1574629810360-7efbbe195018')],
];

mkdirSync(outDir, { recursive: true });

for (const [name, url] of SOURCES) {
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Skip ${name}: HTTP ${res.status}`);
    continue;
  }
  writeFileSync(resolve(outDir, name), Buffer.from(await res.arrayBuffer()));
  console.log(`OK ${name}`);
}

console.log('Done — assets/generated/classic/');
