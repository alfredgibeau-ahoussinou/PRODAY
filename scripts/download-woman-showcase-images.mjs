#!/usr/bin/env node
/**
 * Foot féminin uniquement — joueuses / équipes F sur terrain (pas fitness ni foot M).
 *   node scripts/download-woman-showcase-images.mjs
 */

import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { CARD, HERO, STADIUM, WIDE } from './lib/showcase-image-url.mjs';
import { PEXELS_CARD, PEXELS_HERO, PEXELS_STADIUM } from './lib/showcase-image-url.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../assets/generated/woman');

/**
 * Chaque entrée = foot féminin confirmé (titre Unsplash / Pexels).
 * Unsplash : women playing soccer, girl team, joueuses.
 * Pexels : équipe F Córdoba, joueuse en maillot, ballon sur gazon.
 */
const SOURCES = [
  ['woman-discover-hero.jpg', HERO('1567989995326-46ed902b0494')], // Women playing soccer on field
  ['woman-mercato.jpg', CARD('1770237711068-6aebf8e5d591')],
  ['woman-profile.jpg', CARD('1478851814281-61a21b884e62')],
  ['woman-match.jpg', CARD('1526841216737-e3c3ac14dd0d')],
  ['woman-arena.jpg', PEXELS_STADIUM(1198174)], // Women's soccer team, Córdoba
  ['woman-staff.jpg', CARD('1517649763962-0c623066013b')],
  ['woman-exp-pulse.jpg', PEXELS_CARD(16399923)], // Young girl soccer player, uniform
  ['woman-exp-arena.jpg', PEXELS_STADIUM(1198174)],
  ['woman-exp-sponsors.jpg', PEXELS_CARD(3819644)], // Woman + soccer ball
  ['woman-exp-discover.jpg', HERO('1528024522223-f295b5bae7b1')], // All-girl football team, bench
  ['woman-exp-team.jpg', WIDE('1528024522223-f295b5bae7b1')],
  ['woman-exp-profile.jpg', PEXELS_CARD(3621104)], // Ballon sur gazon — détail foot
  ['woman-exp-messages.jpg', CARD('1770237711068-6aebf8e5d591')],
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

console.log('Done — assets/generated/woman/ (foot féminin)');
