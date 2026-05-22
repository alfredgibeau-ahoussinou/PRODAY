#!/usr/bin/env node
/**
 * Génère un CV joueur HTML (imprimable en PDF).
 *
 *   node scripts/generate-player-cv.mjs
 *   node scripts/generate-player-cv.mjs "Yanis Diallo"
 *
 * Sortie : docs/design/exports/cv-joueur.html
 */

import { mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'docs/design/exports');

const sample = {
  display_name: process.argv[2] ?? 'Yanis Diallo',
  position: 'Milieu offensif',
  category: 'Seniors',
  level: 'R2',
  strong_foot: 'right',
  city: 'Marseille',
  department: '13',
  age: 19,
  height_cm: 176,
  weight_kg: 70,
  bio: 'Joueur créatif, bonne vision du jeu. Disponible pour projets ambitieux en Régional 2.',
  achievements: ['Capitaine équipe U19 (2024)', 'Tournoi inter-départemental — demi-finale'],
  season_stats: { matches: 24, goals: 9, assists: 7 },
  email: 'joueur@exemple.fr',
  generated_at: new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const BRAND = '#003399';
const logoPath = '../../../assets/branding/logo-light.png';

function buildHtml(data) {
  const stats = data.season_stats;
  const achievements = data.achievements?.length
    ? `<ul>${data.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>`
    : '<p class="muted">—</p>';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>CV — ${escapeHtml(data.display_name)} | ProDay</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, system-ui, sans-serif;
      color: #0f172a;
      font-size: 11pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .toolbar {
      position: fixed; top: 0; left: 0; right: 0; z-index: 10;
      background: #0f172a; color: #f8fafc; padding: 10px 20px;
      display: flex; gap: 12px; align-items: center; font-size: 13px;
    }
    .toolbar button {
      background: ${BRAND}; color: #fff; border: none;
      padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer;
    }
    .page { max-width: 210mm; margin: 56px auto 24px; padding: 24px; }
    @media print {
      .toolbar { display: none; }
      .page { margin: 0; padding: 0; box-shadow: none; }
    }
    .header {
      display: flex; justify-content: space-between; align-items: flex-start;
      border-bottom: 3px solid ${BRAND}; padding-bottom: 14px; margin-bottom: 20px;
    }
    .logo { height: 44px; }
    .tagline { font-size: 8pt; letter-spacing: 0.12em; color: #5c6478; margin-top: 6px; font-weight: 600; }
    h1 { font-size: 22pt; font-weight: 800; color: ${BRAND}; }
    .role { font-size: 12pt; color: #5c6478; font-weight: 600; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 18px 0; }
    .card { background: #f4f6fa; border: 1px solid #dde3ed; border-radius: 10px; padding: 12px; }
    .card label { font-size: 8pt; text-transform: uppercase; letter-spacing: 0.06em; color: #8b93a8; font-weight: 700; }
    .card strong { display: block; font-size: 12pt; margin-top: 4px; }
    .stats { display: flex; border: 1px solid #dde3ed; border-radius: 10px; overflow: hidden; margin: 16px 0; }
    .stat { flex: 1; text-align: center; padding: 14px; background: #fff; border-right: 1px solid #dde3ed; }
    .stat:last-child { border-right: none; }
    .stat .n { font-size: 20pt; font-weight: 800; color: ${BRAND}; }
    .stat .l { font-size: 8pt; color: #8b93a8; margin-top: 4px; }
    h2 { font-size: 11pt; color: ${BRAND}; margin: 16px 0 8px; text-transform: uppercase; }
    ul { padding-left: 18px; }
    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #dde3ed; font-size: 8pt; color: #8b93a8; }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>CV joueur ProDay</span>
    <button type="button" onclick="window.print()">Exporter en PDF</button>
  </div>
  <div class="page">
    <header class="header">
      <div>
        <img class="logo" src="${logoPath}" alt="ProDay" />
        <div class="tagline">CONNECTER • PROGRESSER • RÉUSSIR</div>
      </div>
      <div style="text-align:right;font-size:9pt;color:#5c6478">
        ${escapeHtml(data.generated_at)}
      </div>
    </header>
    <h1>${escapeHtml(data.display_name)}</h1>
    <p class="role">${escapeHtml([data.position, data.category, data.level].filter(Boolean).join(' · '))}</p>
    <div class="grid">
      <div class="card"><label>Ville</label><strong>${escapeHtml(data.city)} (${escapeHtml(data.department)})</strong></div>
      <div class="card"><label>Pied fort</label><strong>Droit</strong></div>
      <div class="card"><label>Âge</label><strong>${data.age} ans</strong></div>
      <div class="card"><label>Morphologie</label><strong>${data.height_cm} cm · ${data.weight_kg} kg</strong></div>
    </div>
    <h2>Statistiques saison</h2>
    <div class="stats">
      <div class="stat"><div class="n">${stats.matches}</div><div class="l">Matchs</div></div>
      <div class="stat"><div class="n">${stats.goals}</div><div class="l">Buts</div></div>
      <div class="stat"><div class="n">${stats.assists}</div><div class="l">Passes décisives</div></div>
    </div>
    <h2>Présentation</h2>
    <p>${escapeHtml(data.bio)}</p>
    <h2>Palmarès</h2>
    ${achievements}
    <footer class="footer">${escapeHtml(data.email)} · Document ProDay</footer>
  </div>
</body>
</html>`;
}

mkdirSync(outDir, { recursive: true });
const slug = sample.display_name.toLowerCase().replace(/\s+/g, '-');
const outPath = resolve(outDir, `cv-${slug}.html`);
writeFileSync(outPath, buildHtml(sample), 'utf8');
console.log(`✓ CV HTML : ${outPath}`);
console.log('  Ouvrir dans le navigateur → Imprimer → Enregistrer au format PDF');
