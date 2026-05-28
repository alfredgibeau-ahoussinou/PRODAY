import type { User } from '../models/User';

export interface PlayerCvData {
  display_name: string;
  position?: string;
  category?: string;
  level?: string;
  strong_foot?: string;
  city?: string;
  department?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  bio?: string;
  achievements?: string[];
  season_stats?: {
    matches: number;
    goals: number;
    assists: number;
  };
  email?: string;
  generated_at?: string;
}

const BRAND = '#0A0A0A';
const NAVY = '#0F172A';

function footLabel(foot?: string): string {
  if (foot === 'left') return 'Gauche';
  if (foot === 'right') return 'Droit';
  if (foot === 'both') return 'Ambidextre';
  return '—';
}

/** Transforme le profil joueur en données structurées pour génération PDF / HTML. */
export function buildPlayerCvFromUser(user: User): PlayerCvData {
  const p = user.profile;
  return {
    display_name: user.display_name,
    position: p.position,
    category: p.category,
    level: p.level,
    strong_foot: p.strong_foot,
    city: user.city,
    department: user.department,
    age: p.age,
    height_cm: p.height_cm,
    weight_kg: p.weight_kg,
    bio: p.bio,
    achievements: p.achievements,
    season_stats: p.season_stats,
    email: user.email,
    generated_at: new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}

/** Document HTML imprimable (A4) — ouvrir ou « Imprimer → PDF » dans le navigateur. */
export function buildPlayerCvHtml(data: PlayerCvData, logoDataUrl?: string): string {
  const stats = data.season_stats;
  const hasStats =
    stats && (stats.matches > 0 || stats.goals > 0 || stats.assists > 0);
  const logoBlock = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="ProDay" class="logo" />`
    : `<div class="logo-text">Pro<span>Day</span></div>`;

  const achievements =
    data.achievements?.length ?
      `<ul>${data.achievements.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>`
    : '<p class="muted">—</p>';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>CV — ${escapeHtml(data.display_name)} | ProDay</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Inter, system-ui, sans-serif;
      color: ${NAVY};
      font-size: 11pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid ${BRAND};
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .logo { height: 42px; width: auto; }
    .logo-text { font-size: 22pt; font-weight: 800; color: ${NAVY}; font-style: italic; }
    .logo-text span { color: ${BRAND}; }
    .tagline {
      font-size: 8pt;
      letter-spacing: 0.12em;
      color: #5c6478;
      margin-top: 4px;
      font-weight: 600;
    }
    .meta-right { text-align: right; font-size: 9pt; color: #5c6478; }
    h1 { font-size: 22pt; font-weight: 800; color: ${BRAND}; margin-bottom: 4px; }
    .role { font-size: 12pt; color: #5c6478; font-weight: 600; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin: 18px 0;
    }
    .card {
      background: #f4f6fa;
      border: 1px solid #dde3ed;
      border-radius: 10px;
      padding: 12px 14px;
    }
    .card label {
      display: block;
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #8b93a8;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .card strong { font-size: 12pt; color: ${NAVY}; }
    .stats {
      display: flex;
      gap: 0;
      margin: 18px 0;
      border: 1px solid #dde3ed;
      border-radius: 10px;
      overflow: hidden;
    }
    .stat {
      flex: 1;
      text-align: center;
      padding: 14px 8px;
      background: #fff;
      border-right: 1px solid #dde3ed;
    }
    .stat:last-child { border-right: none; }
    .stat .n { font-size: 20pt; font-weight: 800; color: ${BRAND}; }
    .stat .l { font-size: 8pt; color: #8b93a8; margin-top: 4px; font-weight: 600; }
    h2 {
      font-size: 11pt;
      color: ${BRAND};
      margin: 16px 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .bio { color: #1a1f36; white-space: pre-wrap; }
    ul { padding-left: 18px; }
    li { margin-bottom: 4px; }
    .muted { color: #8b93a8; font-style: italic; }
    .footer {
      margin-top: 28px;
      padding-top: 12px;
      border-top: 1px solid #dde3ed;
      font-size: 8pt;
      color: #8b93a8;
      display: flex;
      justify-content: space-between;
    }
    @media screen {
      body { max-width: 210mm; margin: 24px auto; padding: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
      .print-hint {
        background: #e8eef8;
        color: ${BRAND};
        padding: 10px 14px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 10pt;
        font-weight: 600;
      }
    }
    @media print {
      .print-hint { display: none; }
      body { margin: 0; padding: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <p class="print-hint">ProDay — Utilisez <strong>Fichier → Imprimer → Enregistrer au format PDF</strong> pour exporter ce CV.</p>
  <header class="header">
    <div>
      ${logoBlock}
      <div class="tagline">CONNECTER • PROGRESSER • RÉUSSIR</div>
    </div>
    <div class="meta-right">
      CV joueur ProDay<br />
      ${escapeHtml(data.generated_at ?? '')}
    </div>
  </header>
  <h1>${escapeHtml(data.display_name)}</h1>
  <p class="role">${escapeHtml([data.position, data.category, data.level].filter(Boolean).join(' · ') || 'Joueur')}</p>
  <div class="grid">
    <div class="card"><label>Ville</label><strong>${escapeHtml(data.city ?? '—')}${data.department ? ` (${escapeHtml(data.department)})` : ''}</strong></div>
    <div class="card"><label>Pied fort</label><strong>${footLabel(data.strong_foot)}</strong></div>
    <div class="card"><label>Âge</label><strong>${data.age != null ? `${data.age} ans` : '—'}</strong></div>
    <div class="card"><label>Morphologie</label><strong>${data.height_cm ? `${data.height_cm} cm` : '—'}${data.weight_kg ? ` · ${data.weight_kg} kg` : ''}</strong></div>
  </div>
  ${
    hasStats && stats
      ? `<h2>Statistiques saison</h2>
  <div class="stats">
    <div class="stat"><div class="n">${stats.matches}</div><div class="l">Matchs</div></div>
    <div class="stat"><div class="n">${stats.goals}</div><div class="l">Buts</div></div>
    <div class="stat"><div class="n">${stats.assists}</div><div class="l">Passes décisives</div></div>
  </div>`
      : ''
  }
  <h2>Présentation</h2>
  <p class="bio">${escapeHtml(data.bio?.trim() || 'Profil ProDay — complétez votre bio dans l’application.')}</p>
  <h2>Palmarès & distinctions</h2>
  ${achievements}
  <footer class="footer">
    <span>Document généré via ProDay · proday.app</span>
    <span>${escapeHtml(data.email ?? '')}</span>
  </footer>
</body>
</html>`;
}

export function buildPlayerCvHtmlFromUser(user: User, logoDataUrl?: string): string {
  return buildPlayerCvHtml(buildPlayerCvFromUser(user), logoDataUrl);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** URL Storage — en prod : Cloud Function ou signed URL après génération. */
export function generateCvPdfUrl(user: User): string {
  const slug = encodeURIComponent(user.display_name.replace(/\s+/g, '-'));
  return `https://storage.proday.app/cv/${user.uid}/${slug}.pdf`;
}
