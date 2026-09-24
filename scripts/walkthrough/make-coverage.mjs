/**
 * make-coverage — assemble la checklist de couverture des enregistrements.
 *
 *   node make-coverage.mjs <dossier de captures> <dossier de sortie>
 *
 * Lit chaque steps.json (+ diagnostics.json, + fichier MP4 associé) et produit
 * walkthrough-exports/COUVERTURE.md : périmètre, écrans atteints, étapes non
 * atteintes (documentées, jamais omises) et limites connues.
 */
import fs from 'fs';
import path from 'path';

const [, , shotsDir = '/tmp/proday-shots', outDir = 'walkthrough-exports'] = process.argv;

const FORMATS = [
  { dir: 'club-desktop', pole: 'Club', format: 'Desktop', mp4: 'ProDay-Club-Desktop.mp4', viewport: '1920 × 1080 (paysage)' },
  { dir: 'club-mobile', pole: 'Club', format: 'Mobile', mp4: 'ProDay-Club-Mobile.mp4', viewport: '390 × 844 (portrait, simulation iPhone, DSF 3)' },
  { dir: 'coach-desktop', pole: 'Coach', format: 'Desktop', mp4: 'ProDay-Coach-Desktop.mp4', viewport: '1920 × 1080 (paysage)' },
  { dir: 'coach-mobile', pole: 'Coach', format: 'Mobile', mp4: 'ProDay-Coach-Mobile.mp4', viewport: '390 × 844 (portrait, simulation iPhone, DSF 3)' },
  { dir: 'player-desktop', pole: 'Joueur', format: 'Desktop', mp4: 'ProDay-Player-Desktop.mp4', viewport: '1920 × 1080 (paysage)' },
  { dir: 'player-mobile', pole: 'Joueur', format: 'Mobile', mp4: 'ProDay-Player-Mobile.mp4', viewport: '390 × 844 (portrait, simulation iPhone, DSF 3)' },
  { dir: 'parent-desktop', pole: 'Parent', format: 'Desktop', mp4: 'ProDay-Parent-Desktop.mp4', viewport: '1920 × 1080 (paysage)' },
  { dir: 'parent-mobile', pole: 'Parent', format: 'Mobile', mp4: 'ProDay-Parent-Mobile.mp4', viewport: '390 × 844 (portrait, simulation iPhone, DSF 3)' },
];

const mmss = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;

// L'instantané d'accessibilité est pris au début de l'étape : l'écran affiché
// pendant le chapitre i est celui observé à l'étape i+1. Le texte brut est une
// concaténation de l'arbre d'accessibilité ; on en extrait le premier fragment
// signifiant (même logique que dans assemble.mjs).
const NAV_NOISE =
  /^(Accueil|Calendrier|Ma Carte|Menu|Équipe|Équipes|Carrière|Passeport & CV|Forme & Récup|Tactique|Profil|Enfant|Guide|Stats|Boutique|MON CLUB|Réglages|Tout|Créer|Aide|Matchs|Vestiaire|Club|Coach|Joueur|Parent|Staff|Coach Pro|Club Pro|Se déconnecter|Se deconnecter|\?|\d+)$/i;
const cleanObserved = (raw) => {
  if (!raw) return '—';
  const parts = String(raw)
    .split('|')
    .map((p) => p.replace(/^[?—\-\s]+/, '').trim())
    .filter(Boolean);
  const good = parts.find((p) => p.length > 3 && p.length <= 80 && !NAV_NOISE.test(p));
  const pick = good ?? parts.find((p) => p.length > 1) ?? '';
  return pick ? pick.replace(/\s+/g, ' ').slice(0, 80) : '—';
};

const lines = [
  '# Couverture des enregistrements ProDay',
  '',
  "Application : **ProDay** — build web Expo/Metro locale (`http://localhost:8081`), version **1.0.10**.",
  "Périmètre : pôles **Club, Coach, Joueur (Player), Parent**. L'espace **Admin plateforme est exclu**.",
  '',
  'Comptes de démonstration isolés (club `FC ProDay Démo`, aucun membre réel contacté) :',
  '',
  '| Pôle | Compte | Mot de passe |',
  '|------|--------|--------------|',
  '| Club | `club.demo@proday.app` | masqué (compte de démonstration) |',
  '| Coach | `coach.demo@proday.app` | masqué (compte de démonstration) |',
  '| Joueur | `player.demo@proday.app` | masqué (compte de démonstration) |',
  '| Parent | `parent.demo@proday.app` | masqué (compte de démonstration) |',
  '',
  'Rendu : **navigateur** (Chrome piloté en CDP, fenêtre 1920 × 1080 ou 390 × 844 selon la version).',
  'Aucun appareil physique n\'a été utilisé : les vidéos « Mobile » sont la **mise en page mobile réelle**',
  'de l\'application, rendue et pilotée séparément (jamais un recadrage du desktop).',
  '',
];

for (const f of FORMATS) {
  const dir = path.join(shotsDir, f.dir);
  const stepsPath = path.join(dir, 'steps.json');
  const mp4Path = path.join(outDir, f.mp4);
  const hasCapture = fs.existsSync(stepsPath);
  const hasMp4 = fs.existsSync(mp4Path);
  lines.push(`## ${f.pole} — ${f.format}`, '');
  lines.push(`- Fichier : ${hasMp4 ? `\`${f.mp4}\` (${(fs.statSync(mp4Path).size / 1e6).toFixed(1)} Mo)` : '_à produire_'}`);
  lines.push(`- Viewport : ${f.viewport}`);
  lines.push(`- Compte : \`${f.pole.toLowerCase()}.demo@proday.app\` (démonstration)`);
  if (!hasCapture) {
    lines.push('- Statut : **capture absente** — à enregistrer.', '');
    continue;
  }
  const steps = JSON.parse(fs.readFileSync(stepsPath, 'utf8'));
  let diag = { failedSteps: [] };
  try {
    diag = JSON.parse(fs.readFileSync(path.join(dir, 'diagnostics.json'), 'utf8'));
  } catch {
    /* pas de diagnostics */
  }
  const duration = steps.steps[steps.steps.length - 1]?.t0 ?? 0;
  lines.push(`- Durée du scénario : ${mmss(duration)} · ${steps.steps.length} chapitres`);
  lines.push('');
  lines.push('| # | Temps | Chapitre | Écran affiché (extrait d\'accessibilité) | Statut |');
  lines.push('|---|-------|----------|------------------------------------------|--------|');
  steps.steps.forEach((s, i) => {
    const failed = diag.failedSteps.some((x) => x.step === s.id);
    const observed = cleanObserved(
      steps.steps[i + 1]?.observed ?? steps.steps[i]?.observed,
    );
    lines.push(
      `| ${i + 1} | ${mmss(s.t0)} | ${s.label.replace(/\|/g, '\\|')} | ${observed.replace(/\|/g, '\\|')} | ${failed ? '⚠️ cible non atteinte' : '✅'} |`,
    );
  });
  lines.push('');
  if (diag.failedSteps.length) {
    lines.push('### Étapes à cible non atteinte (documentées)', '');
    for (const x of diag.failedSteps) {
      lines.push(`- **${x.step}** — ${x.label}`);
      lines.push(`  - cibles tentées : ${(x.actions ?? []).map((a) => a.text ?? a.label ?? a.type).join(', ')}`);
      lines.push(`  - écran au moment de l'échec : ${String(x.bodyText ?? '').slice(0, 140)}`);
    }
    lines.push('');
  }
}

lines.push(
  '## Limites connues',
  '',
  '- Application servie en mode développement (Metro) : les transitions d\'écran prennent 3 à 6 secondes ;',
  '  les séquences attendent le changement d\'écran avant la narration.',
  '- La navigation mobile du pôle Club passe par le hub « Tout ProDay » (cartes groupées) ; certaines pages',
  '  n\'y sont atteignables que par la recherche universelle, dont les résultats dépendent du catalogue chargé.',
  '- Les comptes de démonstration n\'ont pas accès aux fonctions payantes de certains modules : les écrans',
  '  affichant un état vide ou un mode démonstration sont conservés tels quels (aucun résultat simulé présenté',
  '  comme opérationnel).',
  '- Les captures n\'altèrent aucune donnée réelle : aucun message, paiement ou convocation n\'est envoyé.',
  '- **Joueur desktop** : la carte *Mon Coach IA* est présente dans le hub mais n\'ouvre aucun module sur',
  '  cette version du bureau (le même module s\'ouvre normalement en version mobile). Le constat est montré',
  '  tel quel et repris dans la narration du chapitre correspondant.',
  '- **Club desktop** : la bascule vers le pôle Président n\'existe qu\'en version mobile ; côté bureau,',
  '  l\'écran reste vide et le chapitre l\'explique au lieu de l\'omettre.',
  '- **Club mobile** : le retour à l\'accueil du club depuis le cockpit Président n\'a pas pu être',
  '  déclenché ; la dernière étape est documentée comme telle dans la fiche.',
  '- **Modules annoncés « Bientôt »** (espace joueur : *Clips*, *Boutique*) : présents dans le hub, ils',
  '  n\'ouvrent aucun contenu. Ils figurent dans la visite avec cette mention — aucun écran de',
  '  remplacement n\'a été fabriqué.',
  '- Les écrans de démonstration IA (copilote, coach IA, assistant) affichent leurs réponses comme des',
  '  sorties de démonstration : ils ne sont pas présentés comme opérationnels.',
  "- La colonne « écran affiché » est un extrait de l'arbre d'accessibilité, pris autour de l'étape : elle",
  '  atteste qu\'une navigation réelle a eu lieu sans être un titre officiel de page.',
  '',
  '## Correctifs apportés pendant la production',
  '',
  "- **`App.tsx` — colonne de contenu du pôle Joueur.** En 1920 × 1080, l'espace joueur affichait un écran",
  "  noir : `styles.screenDesktop` portait `alignSelf: 'center'` dans une rangée flex, ce qui centre et",
  "  dimensionne l'enfant sur l'axe **vertical** — hauteur réduite à 0 pour un enfant `flex: 1`.",
  "  Correctif : `alignSelf: 'stretch'`. La vidéo `ProDay-Player-Desktop.mp4` a été réenregistrée après",
  '  correction ; seule cette vidéo est concernée.',
  '- **Sous-titres.** libass suppose un canvas de 288 px de haut : à taille de police égale, les légendes',
  '  rendaient 6 × trop grandes en portrait 1080 × 2340. Les sous-titres sont désormais produits en ASS avec',
  "  `PlayResX`/`PlayResY` réels ; toutes les vidéos mobiles ont été réencodées.",
  '- **Pôle Coach desktop — capture refaite.** La première capture montrait le même accueil pendant dix',
  '  minutes : l\'application ne rendait plus les écrans suivants et les clics n\'avaient plus d\'effet.',
  '  Le scénario a été réécrit et **vérifié image par image** (`verify-config.mjs --shots`) avant la',
  '  nouvelle capture, qui traverse 17 écrans distincts.',
  '- **Revue par planches de chapitres.** Chaque vidéo a été contrôlée visuellement avec une planche',
  '  montrant une image par chapitre (`chapter-sheet.mjs`) : c\'est ce contrôle qui a révélé la capture',
  '  figée du pôle Coach, invisible dans un simple contrôle de flux.',
  '',
);

fs.mkdirSync(outDir, { recursive: true });
const dest = path.join(outDir, 'COUVERTURE.md');
fs.writeFileSync(dest, lines.join('\n'));
console.log(`[ok] ${dest}`);
