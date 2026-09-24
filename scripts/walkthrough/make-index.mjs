#!/usr/bin/env node
/**
 * Génère walkthrough-exports/README.md : index des 8 enregistrements
 * (durée réelle, chapitres, taille, limites) + commandes de reproduction.
 *
 *   node scripts/walkthrough/make-index.mjs
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const FFMPEG =
  process.env.PRODAY_FFMPEG ?? '/tmp/proday-rec/node_modules/ffmpeg-static/ffmpeg';
const OUT = path.resolve('walkthrough-exports');

const probeDur = (file) => {
  let stderr = '';
  try {
    execFileSync(FFMPEG, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    stderr = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf8') : String(e.stderr ?? '');
  }
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
};
const probeStreams = (file) => {
  let stderr = '';
  try {
    execFileSync(FFMPEG, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    stderr = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf8') : String(e.stderr ?? '');
  }
  const video = stderr.match(/Stream #0:0.*?(\d{3,4}x\d{3,4})/);
  const hasAudio = /Stream #0:\d+.*Audio:/.test(stderr);
  const chapters = (stderr.match(/Chapter #0:\d+/g) ?? []).length;
  return { res: video ? video[1] : '—', audio: hasAudio, chapters };
};
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;

const FILES = [
  { file: 'ProDay-Club-Desktop.mp4', pole: 'Club', view: 'Desktop (paysage)' },
  { file: 'ProDay-Club-Mobile.mp4', pole: 'Club', view: 'Mobile (portrait)' },
  { file: 'ProDay-Coach-Desktop.mp4', pole: 'Coach', view: 'Desktop (paysage)' },
  { file: 'ProDay-Coach-Mobile.mp4', pole: 'Coach', view: 'Mobile (portrait)' },
  { file: 'ProDay-Player-Desktop.mp4', pole: 'Joueur', view: 'Desktop (paysage)' },
  { file: 'ProDay-Player-Mobile.mp4', pole: 'Joueur', view: 'Mobile (portrait)' },
  { file: 'ProDay-Parent-Desktop.mp4', pole: 'Parent', view: 'Desktop (paysage)' },
  { file: 'ProDay-Parent-Mobile.mp4', pole: 'Parent', view: 'Mobile (portrait)' },
];

const root = process.env.PRODAY_ROOT ?? process.cwd();
let version = '1.0.10';
try {
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  version = app.expo?.version ?? app.version ?? version;
} catch {
  /* app.json absent : on garde la version par défaut */
}

const rows = [];
for (const f of FILES) {
  const p = path.join(OUT, f.file);
  if (!fs.existsSync(p)) {
    rows.push({ ...f, missing: true });
    continue;
  }
  const dur = probeDur(p);
  const { res, audio, chapters } = probeStreams(p);
  const size = fs.statSync(p).size;
  const md = p.replace(/\.mp4$/i, '.md');
  const mdText = fs.existsSync(md) ? fs.readFileSync(md, 'utf8') : '';
  const chapCount = mdText.match(/\| \d+ \| \d\d:\d\d \|/g)?.length ?? chapters;
  const sansCible = /## Étapes sans cible/.test(mdText)
    ? (mdText.match(/- \*\*[^*]+\*\*/g) ?? []).length
    : 0;
  rows.push({
    ...f,
    dur: dur ? mmss(dur) : '—',
    res,
    audio,
    chapters: chapCount,
    sizeMb: (size / 1024 / 1024).toFixed(1),
    sansCible,
    missing: false,
  });
}

const lines = [
  '# ProDay — enregistrements vidéo (walkthroughs)',
  '',
  `Application : **ProDay ${version}** — build web local (http://localhost:8081), Chrome piloté en CDP.`,
  "Périmètre : pôles **Club, Coach, Joueur, Parent**. L'espace **Admin plateforme est exclu** (hors demande).",
  '',
  'Chaque pôle dispose de **deux enregistrements indépendants** : la mise en page desktop (1920 × 1080, paysage)',
  'et la mise en page mobile (390 × 844 simulé, portrait), rendues et pilotées séparément —',
  'aucune vidéo mobile n’est un recadrage du desktop.',
  '',
  '## Fichiers livrés',
  '',
  '| Fichier | Pôle | Interface | Viewport | Durée | Chapitres | Format / audio | Taille |',
  '|---------|------|-----------|----------|-------|-----------|----------------|--------|',
  ...rows.map((r) =>
    r.missing
      ? `| \`${r.file}\` | ${r.pole} | ${r.view} | — | — | — | — | **manquant** |`
      : `| \`${r.file}\` | ${r.pole} | ${r.view} | ${r.res} | ${r.dur} | ${r.chapters} | H.264${r.audio ? ' + AAC' : ''} | ${r.sizeMb} Mo |`,
  ),
  '',
  'Chaque vidéo est accompagnée d’une fiche `ProDay-<Pôle>-<Interface>.md` : chapitres horodatés,',
  'contenu expliqué, écran affiché, limites et transcript intégral de la narration —',
  'et de sous-titres externes `ProDay-<Pôle>-<Interface>.srt` (les sous-titres sont aussi incrustés dans l’image).',
  'Le détail complet (par chapitre et par étape) figure dans `COUVERTURE.md`.',
  '',
  '## Ce que chaque vidéo contient',
  '',
  '| Livrable | Contenu |',
  '|----------|---------|',
  '| `ProDay-Club-Desktop.mp4` | Sidebar complète du pôle Club : accueil (carte club, recherche globale, prochain rendez-vous), équipes, joueurs, coachs, demandes d’adhésion, calendrier, matchs, entraînements, événements, classements FFF, vidéo & analyse, communication, covoiturage, copilote IA, notifications, identité, pack club, licences, finances, sponsoring, permissions, puis bascule Pôle Président. |',
  '| `ProDay-Club-Mobile.mp4` | Dock bas + hub « Tout ProDay » : accueil, bouton CRÉER, calendrier, équipes, matchs & live, événements, classements, vidéo & analyse (dont lecture **en paysage**), effectif & licences, staff & coachs, communication, finances, entraînements, covoiturage, documents & licences, sponsoring, rôles & permissions, identité, notifications, copilote, Pôle Président, retour accueil. |',
  '| `ProDay-Coach-Desktop.mp4` | Cockpit entraîneur : briefing et priorités du banc, calendrier, équipe, composition et tactique, entraînements, assistant coach IA, chat copilote, vidéos, forme, gestion, messagerie, covoiturage, coaching personnalisé. |',
  '| `ProDay-Coach-Mobile.mp4` | Même parcours en portrait, avec tableau tactique **en paysage** (rotation du support). |',
  '| `ProDay-Player-Desktop.mp4` | Espace joueur desktop : rail latéral (accueil, calendrier, ma carte, menu), puis parcours par le hub « Tout ProDay » — saison et progression, équipe et mercato, vestiaire et messagerie, covoiturage, compte et paramètres, coach IA. Les modules **Clips** et **Boutique** y sont montrés tels quels : annoncés « Bientôt », sans contenu. |',
  '| `ProDay-Player-Mobile.mp4` | Dock joueur : accueil, question de la semaine, calendrier, équipe, hub, saison, progression, vestiaire, clips (**paysage**), boutique, coach IA, trajet, compte — modules « Bientôt » inclus. |',
  '| `ProDay-Parent-Desktop.mp4` | Espace parent en paysage : synthèse enfants, guide (suggestions, alertes, rôle), messages, agenda, trajets, profil. |',
  '| `ProDay-Parent-Mobile.mp4` | Même parcours en portrait, avec écran trajet **en paysage**. |',
  '',
  '## Méthode',
  '',
  '1. **Inventaire** des routes et modules par pôle (`scripts/walkthrough/INVENTORY.md`).',
  '2. **Connexion** avec des comptes de démonstration isolés (club `FC ProDay Démo`, aucun membre réel).',
  '   Le mot de passe est saisi avant le début de la capture : il n’apparaît dans aucune vidéo.',
  '3. **Scénario écrit** par pôle et par interface (`scripts/walkthrough/configs/*.json`) : chaque étape',
  '   est jouée par de vrais événements souris/clavier, avec attente du rendu réel avant la narration.',
  '4. **Capture** : Chrome en CDP, frames horodatées (screencast) + instantané d’accessibilité par étape.',
  '5. **Assemblage** : vidéo muette à fps fixe, narration française (voix système), sous-titres incrustés',
  '   et chapitres intégrés au conteneur MP4.',
  '6. **Revue** : contrôle des légendes, de la couverture, des données sensibles, puis correction et ré-export.',
  '',
  '## Reproduction',
  '',
  '```bash',
  '# 1. Application locale (web)',
  'npm run web                    # http://localhost:8081',
  '',
  '# 2. Comptes et données de démonstration',
  'npm run seed:demo-player       # joueur',
  'npm run seed:demo-club         # club / coach / parent',
  '',
  '# 3. Capture pôle + interface (exemple)',
  'node scripts/walkthrough/record.mjs scripts/walkthrough/configs/club-desktop.json',
  'node scripts/walkthrough/record.mjs scripts/walkthrough/configs/club-mobile.json',
  '',
  '# 4. Assemblage de la vidéo finale',
  'bash scripts/walkthrough/assemble-all.sh',
  '',
  '# 5. Index et couverture',
  'node scripts/walkthrough/make-coverage.mjs && node scripts/walkthrough/make-index.mjs',
  '```',
  '',
  '## Limites connues',
  '',
  '- **Simulation de navigateur** : les vidéos « Mobile » sont la mise en page responsive réelle',
  '  (390 × 844, densité 3, tactile émulé), pas un appareil physique.',
  '- **Aucune donnée réelle** : club de démonstration uniquement ; finances, adhésions et sorties IA',
  '  sont des données de test, présentées comme telles (`démonstration`).',
  '- Les écrans dépendant d’un club réellement affilié (licences FFF, classements officiels) peuvent',
  '  afficher des états vides : ils sont conservés plutôt que masqués.',
  '- Les points de blocage rencontrés pendant la production (étapes sans cible, rechargements',
  '  automatiques de session) sont documentés dans chaque fiche et dans `COUVERTURE.md`.',
  '- `App.tsx` a reçu une correction de mise en page (`screenDesktop.alignSelf`) sans laquelle la',
  '  zone de contenu du pôle Joueur s’effondrait en hauteur nulle au-delà de ~900 px de large :',
  '  la vidéo Joueur desktop n’était pas exploitable avant cette correction.',
  "- **Modules annoncés « Bientôt »** : dans l'espace joueur, **Clips** et **Boutique** figurent dans le hub",
  '  mais n’ouvrent aucun contenu (aucun clip, aucun article livré). Ils sont montrés et expliqués comme',
  '  non disponibles, sans substitut simulé.',
  '- Navigation mobile du pôle Club : les modules s’atteignent par le hub « Tout ProDay » ; les transitions',
  '  d’écran prennent 3 à 6 secondes en mode développement, ce qui allonge les séquences (aucune coupe',
  '  n’est faite entre deux modules).',
  '',
];
fs.writeFileSync(path.join(OUT, 'README.md'), lines.join('\n'));
console.log(`[ok] ${path.join(OUT, 'README.md')}`);
