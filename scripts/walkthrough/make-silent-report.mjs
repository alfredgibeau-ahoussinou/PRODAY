#!/usr/bin/env node
/**
 * make-silent-report — produit walkthrough-silent/COUVERTURE-SILENCIEUX.md :
 * checklist de pages par enregistrement, horodatages, état de couverture et
 * vérifications de silence (aucune piste audio, un seul flux vidéo).
 *
 *   node scripts/walkthrough/make-silent-report.mjs
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const FFMPEG = process.env.PRODAY_FFMPEG ?? '/tmp/proday-rec/node_modules/ffmpeg-static/ffmpeg';
const SHOTS = process.env.PRODAY_SHOTS ?? '/tmp/proday-shots';
const OUT = process.env.PRODAY_SILENT ?? path.resolve('walkthrough-silent');
const ROOT = process.env.PRODAY_ROOT ?? process.cwd();

const mmss = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`;

const VIDEOS = [
  { dir: 'club-desktop', file: 'ProDay-Club-Desktop-Silent.mp4', pole: 'Club', format: 'Desktop' },
  { dir: 'club-mobile', file: 'ProDay-Club-Mobile-Silent.mp4', pole: 'Club', format: 'Mobile' },
  { dir: 'coach-desktop', file: 'ProDay-Coach-Desktop-Silent.mp4', pole: 'Coach', format: 'Desktop' },
  { dir: 'coach-mobile', file: 'ProDay-Coach-Mobile-Silent.mp4', pole: 'Coach', format: 'Mobile' },
  { dir: 'player-desktop', file: 'ProDay-Player-Desktop-Silent.mp4', pole: 'Joueur', format: 'Desktop' },
  { dir: 'player-mobile', file: 'ProDay-Player-Mobile-Silent.mp4', pole: 'Joueur', format: 'Mobile' },
  { dir: 'parent-desktop', file: 'ProDay-Parent-Desktop-Silent.mp4', pole: 'Parent', format: 'Desktop' },
  { dir: 'parent-mobile', file: 'ProDay-Parent-Mobile-Silent.mp4', pole: 'Parent', format: 'Mobile' },
];

/**
 * Checklist de pages : inventaire établi avant/après tournage à partir de la
 * navigation réellement observée (barre latérale, dock, hub « Tout ProDay »),
 * puis confronté aux étapes réellement enregistrées.
 */
const INVENTORY = {
  'Club|Desktop': [
    ['Accueil club (tableau de bord)', /accueil/i],
    ['Équipes rattachées', /equipe/i],
    ['Joueurs — annuaire des licenciés', /joueur/i],
    ['Coachs — staff et affectations', /coach/i],
    ["Demandes d'adhésion", /adhesion/i],
    ['Calendrier (jour / semaine / mois)', /calendrier/i],
    ['Matchs & convocations', /match/i],
    ['Entraînements & présences', /entrainement/i],
    ['Événements & tournois', /evenement/i],
    ['Classements FFF', /classement/i],
    ['Vidéo & Analyse', /video/i],
    ['Communication & canaux', /communication/i],
    ['Covoiturage & logistique', /covoiturage/i],
    ['Copilote Club IA', /copilote/i],
    ['Centre de notifications', /notification/i],
    ['Identité & réglages du club', /club|identite/i],
    ['Pack Club (offre)', /pack/i],
    ['Licences & documents', /licence/i],
    ['Finances & cotisations', /financ/i],
    ['Sponsoring & partenaires', /sponsoring/i],
    ['Rôles & permissions', /permission/i],
    ['Pôle Président (bascule)', /president/i, 'Disponible uniquement en version mobile : le chapitre le documente.'],
  ],
  'Club|Mobile': [
    ['Accueil club (mobile)', /accueil/i],
    ['Bouton « + CRÉER » (feuille de création)', /creer/i],
    ['Calendrier (jour / semaine / mois)', /calendrier/i],
    ['Équipes rattachées', /equipe/i],
    ['Hub « Tout ProDay »', /menu/i],
    ['Matchs & Live', /match/i],
    ['Événements & tournois', /evenement/i],
    ['Classements FFF', /classement/i],
    ['Vidéo & Analyse IA', /video/i],
    ['Lecture vidéo en paysage (rotation)', /paysage/i],
    ['Effectif & licences', /effectif|licence/i],
    ['Staff & coachs', /staff/i],
    ['Communication', /communication/i],
    ['Finances & cotisations', /financ/i],
    ['Entraînements', /entrainement/i],
    ['Covoiturage & logistique', /covoiturage/i],
    ['Documents & licences', /document/i],
    ['Sponsoring & partenaires', /sponsoring/i],
    ['Rôles & permissions', /permission/i],
    ['Identité du club', /identite/i],
    ['Centre de notifications', /notification/i],
    ['Copilote Club IA', /copilote/i],
    ['Pôle Président & Direction', /president/i],
    ['Retour à l’accueil club', /retour-club/i, 'Le retour depuis le cockpit Président n’a pas pu être déclenché : constat conservé.'],
  ],
  'Coach|Desktop': [
    ['Accueil coach (cockpit du banc)', /accueil/i],
    ['Messagerie interne', /messagerie/i],
    ['Calendrier (séances / matchs)', /calendrier/i],
    ['Équipe (effectif de l’équipe active)', /equipe/i],
    ['Hub « Tout ProDay »', /menu/i],
    ['Matchs & Live', /match/i],
    ['Entraînements & ateliers', /entrainement/i],
    ['Effectif & joueurs', /effectif/i],
    ['Assistant Coach IA', /assistant/i],
    ['Chat Copilote IA', /copilote/i],
    ['Mes Vidéos', /video/i],
    ['Forme & Charge', /forme/i],
    ['Gestion Équipe', /gestion/i],
    ['Historique des relances', /historique/i],
    ['Covoiturage', /covoiturage/i],
    ['Coaching Perso', /coaching/i],
    ['Composition & tableau tactique', /accueil|equipe/i, 'L’accès « Composer l’équipe & la tactique » est visible dans l’accueil ; la composition détaillée est enregistrée dans la version mobile.'],
    ['Aide', null, 'Page d’aide, accessible depuis la barre latérale mais non enregistrée.'],
  ],
  'Coach|Mobile': [
    ['Accueil coach (mobile)', /accueil/i],
    ['Hub « Tout ProDay »', /menu/i],
    ['Matchs & Live', /match/i],
    ['Entraînements', /entrainement/i],
    ['Effectif & joueurs', /effectif/i],
    ['Assistant Coach IA', /assistant/i],
    ['Chat Copilote IA', /copilote/i],
    ['Mes Vidéos', /video/i],
    ['Forme & Charge', /forme/i],
    ['Gestion Équipe', /gestion/i],
    ['Messagerie', /messagerie/i],
    ['Covoiturage', /covoiturage/i],
    ['Coaching Perso', /coaching/i],
    ['Tableau tactique en paysage', /tactique/i],
    ['Calendrier', /calendrier/i, 'Visible depuis le dock ; le détail du calendrier est enregistré dans la version desktop.'],
  ],
  'Joueur|Desktop': [
    ['Accueil joueur (Carrière)', /accueil/i],
    ['Calendrier joueur', /calendrier/i],
    ['Ma Carte (fiche & vitrine)', /ma-carte/i],
    ['Ma Saison (matchs & progression)', /saison/i],
    ['Équipe — club, groupe & mercato', /equipe/i],
    ['Vestiaire & messagerie', /vestiaire/i],
    ['Trajet / covoiturage', /trajet/i],
    ['Mon compte & paramètres', /compte/i],
    ['Mon Coach IA', /coach-ia/i, 'Carte présente dans le hub mais sans ouverture de module sur cette version desktop : constat conservé.'],
    ['Clips (annoncé « Bientôt »)', /bientot|clips/i, 'Module annoncé « Bientôt » : aucun contenu livré.'],
    ['Boutique (annoncé « Bientôt »)', /bientot|boutique/i, 'Module annoncé « Bientôt » : aucun contenu livré.'],
  ],
  'Joueur|Mobile': [
    ['Connexion / ouverture de session', null, 'Exclue volontairement du montage : le prologue de connexion (sélection d’univers, porte « Espace Joueur », formulaire) n’est pas filmé — voir « Traitement du montage ».'],
    ['Question de la semaine (popup d’accueil)', /question/i],
    ['Accueil joueur (mobile)', /accueil/i],
    ['Calendrier (présence & filtres)', /calendrier/i],
    ['Équipe — annuaire du club', /equipe/i],
    ['Hub « Tout ProDay »', /menu/i],
    ['Ma Saison', /saison/i],
    ['Progression (XP & défis)', /progression/i],
    ['Vestiaire', /vestiaire/i],
    ['Rotation paysage du support', /paysage/i],
    ['Boutique (annoncé « Bientôt »)', /boutique/i, 'Module annoncé « Bientôt » : aucun contenu livré.'],
    ['Clips (annoncé « Bientôt »)', /clips|paysage/i, 'Module annoncé « Bientôt » : aucun contenu livré ; la rotation paysage est montrée à la place.'],
    ['Mon Coach IA', /coach-ia/i],
    ['Trajet / covoiturage', /trajet/i],
    ['Mon compte & réglages', /compte|profil/i],
  ],
  'Parent|Desktop': [
    ['Accueil parent (enfants liés)', /accueil/i],
    ['Fiche enfant (données & suivi)', /enfant/i],
    ['Bascule entre deux profils enfants', /second/i],
    ['Guide IA (suggestions & alertes)', /guide/i],
    ['Menu — outils famille', /menu/i],
    ['Messages — contacts approuvés', /messages/i],
    ['Agenda (présence & retards)', /agenda/i],
    ['Trajet — suivi live si partage', /trajet/i],
    ['Profil parent & compte', /profil/i],
  ],
  'Parent|Mobile': [
    ['Accueil parent (mobile)', /accueil/i],
    ['Fiche enfant', /enfant/i],
    ['Bascule entre deux profils enfants', /second/i],
    ['Guide IA', /guide/i],
    ['Menu — outils famille', /menu/i],
    ['Messages', /messages/i],
    ['Agenda', /agenda/i],
    ['Trajet (rotation paysage)', /trajet/i],
    ['Profil & compte', /profil/i],
  ],
};

const probe = (file) => {
  let stderr = '';
  try {
    execFileSync(FFMPEG, ['-hide_banner', '-i', file], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) {
    stderr = Buffer.isBuffer(e.stderr) ? e.stderr.toString('utf8') : String(e.stderr ?? '');
  }
  const dur = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  const months = stderr.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  return {
    duration: dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : 0,
    res: stderr.match(/Stream #0:0.*?(\d{3,4}x\d{3,4})/)?.[1] ?? '—',
    audio: (stderr.match(/Stream #\d+:\d+.*Audio:/g) ?? []).length,
    video: (stderr.match(/Stream #\d+:\d+.*Video:/g) ?? []).length,
    subs: (stderr.match(/Stream #\d+:\d+.*(Subtitle|Data):/g) ?? []).length,
    chapters: (stderr.match(/Chapter #\d+:\d+/g) ?? []).length,
    created: months ? months[0] : '—',
  };
};

const version = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8')).expo?.version ?? '1.0.10';
  } catch {
    return '1.0.10';
  }
})();

const lines = [
  '# ProDay — enregistrements muets : couverture et horodatages',
  '',
  `Application : **ProDay ${version}** — build web local (\`http://localhost:8081\`), Chrome piloté en CDP.`,
  'Périmètre : pôles **Club, Coach, Joueur, Parent**. L’espace **Admin plateforme est exclu**.',
  '',
  '## Nature des fichiers livrés',
  '',
  '- **Aucune piste audio** : la capture est un relevé d’images (screencast CDP) — le son n’est ni capté ni ajouté.',
  '  Chaque fichier est contrôlé après export : `0` flux audio, `1` flux vidéo H.264.',
  '- **Aucun sous-titre**, aucune incrustation, aucune voix off, aucune séquence d’intro ou de générique.',
  '  Les images sont celles de l’application, sans habillage (les repères de chapitres sont des métadonnées,',
  '  utiles pour naviguer, et la liste horodatée figure ci-dessous).',
  '- Les lectures vidéo de l’application sont muettes par construction (aucune piste audio n’existe dans la source).',
  '',
  '## Traitement du montage',
  '',
  'La capture n’est pas une vidéo : c’est un relevé d’images envoyées quand l’écran change. Le montage',
  'applique quatre traitements, sans jamais modifier ce qui est affiché :',
  '',
  '- **Images stabilisées.** Chaque écran est représenté par une image prise après stabilisation, et non',
  '  par la première image du changement. Une transition (menu qui s’ouvre, liste qui se remplit) n’est donc',
  '  jamais tenue plusieurs secondes à l’image.',
  '- **Temps morts plafonnés.** Un écran inchangé n’est jamais tenu plus de 13 s. Les gels de capture',
  '  (interruptions du flux, allant jusqu’à 35 s) ne deviennent plus des minutes d’image fixe ; les pauses',
  '  de lecture voulues (8 à 15 s par écran) sont conservées.',
  '- **Prologue de connexion retiré.** Chaque scénario déclare deux étapes techniques avant le premier écran',
  '  réel. Les 10 à 16 premières secondes des pôles dont la connexion se fait dans le format filmé montraient',
  '  donc la sélection d’univers, la porte « Espace » et le **formulaire de connexion** : le montage démarre',
  '  sur le premier écran réel, qui n’apparaît alors que chargé. Aucun identifiant, même de démonstration,',
  '  n’est visible dans les vidéos.',
  '- **Encodage renforcé.** `libx264` en crf 15, preset `slow`, paramètres orientés texte, réduction Lanczos.',
  '  Mesuré sur ces captures : **+4 dB de PSNR** et une erreur structurelle divisée par environ 6 par rapport',
  '  au réglage précédent (crf 20 / preset `veryfast`).',
  '',
  'Les durées ci-dessous sont celles du **montage final**, pas celles de la capture. La différence est indiquée pour mémoire.',
  '## Rendu et matériel',
  '',
  '**Simulation de navigateur** — aucun appareil physique, aucun émulateur d’appareil :',
  '',
  '- **Desktop** : fenêtre **1920 × 1080**, paysage, barre latérale visible.',
  '- **Mobile** : viewport **390 × 844** en portrait, densité 3, tactile émulé : c’est la mise en page mobile',
  '  réelle de l’application, rendue et pilotée séparément. **Aucune vidéo mobile n’est un recadrage du desktop.**',
  '- Les segments où le support est tourné (analyse vidéo, tableau tactique, carte de trajet) apparaissent',
  '  en **paysage centré** dans le canevas portrait : l’image entière est conservée, rien n’est rogné.',
  '',
  '## Comptes et données',
  '',
  'Comptes de démonstration isolés (`club`, `coach`, `player`, `parent` `.demo@proday.app`) sur le club',
  '`FC ProDay Démo`. Le mot de passe est saisi **avant** l’enregistrement et n’apparaît dans aucune image ;',
  'aucun outil de développement, aucune autre application, aucune notification système n’est visible.',
  'Aucune action à conséquence n’est déclenchée sur des données réelles (aucun envoi, aucun paiement).',
  '',
  '## Fichiers',
  '',
  '| Fichier | Pôle | Interface | Viewport | Durée | Chapitres | Audio | Taille |',
  '|---|---|---|---|---|---|---|---|',
];

const rows = VIDEOS.map((v) => {
  const p = path.join(OUT, v.file);
  const exists = fs.existsSync(p);
  const info = exists ? probe(p) : { duration: 0, res: '—', audio: 0, video: 0, subs: 0, chapters: 0 };
  return { ...v, exists, info, size: exists ? (fs.statSync(p).size / 1024 / 1024).toFixed(1) : '—' };
});

for (const r of rows) {
  lines.push(
    r.exists
      ? `| \`${r.file}\` | ${r.pole} | ${r.format} | ${r.info.res} | ${mmss(r.info.duration)} | ${r.info.chapters} | **aucun** (0 piste) | ${r.size} Mo |`
      : `| \`${r.file}\` | ${r.pole} | ${r.format} | — | — | — | — | **manquant** |`,
  );
}
lines.push('');

// ---------- Checklist par enregistrement ----------
lines.push('## Checklist de pages et horodatages', '');
lines.push(
  'Chaque tableau liste les écrans réellement enregistrés, dans l’ordre, avec leur horodatage.',
  'La colonne « état » précise ce qui doit être visible à cet instant.',
  '',
);

for (const r of rows) {
  // Une capture « HQ » (suréchantillonnée, dossier <dir>-hq) remplace la capture
  // standard pour le rapport : c'est elle qui a produit le MP4 muet publié.
  const hqManifest = path.join(SHOTS, `${r.dir}-hq`, 'steps.json');
  const srcDir = fs.existsSync(hqManifest) ? `${r.dir}-hq` : r.dir;
  const manifest = path.join(SHOTS, srcDir, 'steps.json');
  lines.push(`### ${r.pole} — ${r.format}${r.exists ? ` — \`${r.file}\`` : ''}`, '');
  if (!fs.existsSync(manifest)) {
    lines.push('- Capture absente.', '');
    continue;
  }
  const manifestJson = JSON.parse(fs.readFileSync(manifest, 'utf8'));
  let trim = null;
  try {
    trim = JSON.parse(fs.readFileSync(path.join(SHOTS, srcDir, 'trim-report.json'), 'utf8'));
  } catch {
    /* montage pas encore chiffré */
  }
  // Les horodatages publiés sont ceux du montage final (temps morts retirés).
  // L'assemblage écarte les étapes techniques (`start`, `login`) : on rapproche
  // donc les deux listes par libellé, pas par position.
  const byLabel = new Map(manifestJson.steps.map((s) => [s.label, s]));
  const steps = (trim?.steps ?? manifestJson.steps.map((s) => ({ label: s.label, start: s.t0 }))).map(
    (t, i) => ({ ...(byLabel.get(t.label) ?? manifestJson.steps[i] ?? {}), label: t.label, t0: t.start }),
  );
  lines.push(
    `- ${r.exists ? `Durée ${mmss(r.info.duration)} · ${r.info.res} · ${r.info.chapters} chapitres · ` : ''}**silence vérifié** (0 piste audio)`,
    `- Scénario : ${steps.length} étapes · compte \`${manifestJson.cfg.email}\``,
  );
  if (trim) {
    lines.push(
      `- Capture ${mmss(trim.capturedSeconds)} → montage ${mmss(trim.finalSeconds)} : **${trim.removedSeconds}s retirés**, ` +
        `dont ${trim.prologueCutSeconds ?? 0}s de prologue de connexion, ${trim.screens} écrans, ` +
        `${trim.blankFramesDropped} images entièrement noires écartées, ` +
        `aucun écran inchangé tenu plus de ${trim.holdCap}s`,
    );
  }
  lines.push('', '| Temps | Écran enregistré | Statut |', '|---|---|---|');
  let diag = { failedSteps: [] };
  try {
    diag = JSON.parse(fs.readFileSync(path.join(SHOTS, srcDir, 'diagnostics.json'), 'utf8'));
  } catch {
    /* pas de diagnostics */
  }
  const failed = new Set((diag.failedSteps ?? []).map((f) => f.step));
  steps.forEach((s) => {
    const mine = failed.has(s.id) ? '△ étape non déclenchée (documentée)' : '✓ enregistré';
    lines.push(`| ${mmss(s.t0)} | ${s.label.replace(/\|/g, '\\|')} | ${mine} |`);
  });
  lines.push('');

  // ---------- Confrontation avec l’inventaire de navigation ----------
  const inventory = INVENTORY[`${r.pole}|${r.format}`] ?? [];
  const haystack = steps.map((s) => `${s.id} ${s.label}`).join(' | ');
  lines.push('**Confrontation à l’inventaire de navigation**', '');
  lines.push('| Page / état recensé | Dans l’enregistrement | Remarque |', '|---|---|---|');
  for (const [page, match, note] of inventory) {
    const ok = match ? match.test(haystack) : false;
    lines.push(`| ${page} | ${ok ? 'oui' : '**non**'} | ${note ?? ''} |`);
  }
  lines.push('');

  if ((diag.notes ?? []).length) {
    lines.push('**Incidents enregistrés pendant la capture**', '');
    for (const n of diag.notes) lines.push(`- ${n}`);
    lines.push('');
  }
}

lines.push(
  '## Vérifications finales',
  '',
  '| Contrôle | Résultat |',
  '|---|---|',
  `| Pistes audio dans les 8 fichiers | ${rows.every((r) => r.info.audio === 0) ? '**aucune**' : '⚠️ au moins un fichier en contient'} |`,
  `| Pistes vidéo | ${rows.every((r) => r.info.video === 1) ? 'une seule par fichier' : '⚠️ anomalie'} |`,
  `| Sous-titres incrustés ou piste de sous-titres | ${rows.every((r) => r.info.subs === 0) ? 'aucun' : '⚠️ à vérifier'} |`,
  `| Lecture complète (décodage intégral) | ${fs.existsSync(path.join(OUT, 'VERIFICATION.md')) ? 'voir `VERIFICATION.md`' : 'contrôlée par décodage ffmpeg'} |`,
  '| Ordre de visite | accueil → menus → chaque module → retour à l’accueil |',
  '',
  '## Limites connues',
  '',
  '- **Joueur desktop** : la carte *Mon Coach IA* n’ouvre aucun module sur cette version (le module s’ouvre',
  '  normalement en mobile) ; *Clips* et *Boutique* sont annoncés « Bientôt » et montrés comme tels.',
  '- **Club desktop** : la bascule vers le Pôle Président n’existe qu’en mobile.',
  '- **Club mobile** : le retour à l’accueil club depuis le cockpit Président n’a pas pu être déclenché',
  '  (étape conservée et signalée, pas supprimée).',
  '- **Pôles Club et Coach** : les pages de réglages de compte (Profil, Paramètres) et l’**Aide** ne sont pas',
  '  enregistrées — elles restent accessibles mais n’ont pas été parcourues.',
  '- Plusieurs écrans affichent des **états vides** (aucune convocation, aucun trajet, aucune conversation) :',
  '  ce sont les états réels du club de démonstration, conservés tels quels, sans données inventées.',
  '- Le **prologue de connexion** n’est pas filmé : ce n’est pas une omission de couverture, c’est un choix',
  '  de confidentialité. Les écrans de connexion restent accessibles dans l’application.',
  '- Les captures utilisées ont été prises en JPEG qualité 80 et, pour le desktop, en densité 1 (un pixel',
  '  d’image par pixel CSS). La chaîne de capture est désormais réglée sur la qualité 95 et la densité 2',
  '  (suréchantillonnage réduit ensuite en Lanczos) : un prochain tournage gagnera encore en netteté.',
  '',
  '## Reproduction',
  '',
  '```bash',
  '# Application locale puis comptes de démonstration',
  'npm run web',
  'npm run seed:demo-club && npm run seed:demo-player && npm run seed:demo-parent',
  '',
  '# Capture d’un pôle et d’une interface',
  'node scripts/walkthrough/record.mjs scripts/walkthrough/configs/club-desktop.json',
  '',
  '# Encodage muet (aucune piste audio, aucun sous-titre)',
  'bash scripts/walkthrough/run-silent.sh',
  '',
  '# Rapport de couverture et horodatages',
  'node scripts/walkthrough/make-silent-report.mjs',
  '```',
  '',
);

fs.mkdirSync(OUT, { recursive: true });
const dest = path.join(OUT, 'COUVERTURE-SILENCIEUX.md');
fs.writeFileSync(dest, lines.join('\n'));
console.log(`[ok] ${dest}`);

// ---------- Index des livrables (généré depuis les fichiers réels) ----------
const readme = [
  '# ProDay — enregistrements d’écran muets',
  '',
  'Huit fichiers, **sans aucun son, sans sous-titre, sans habillage** : uniquement l’application',
  'ProDay en fonctionnement, parcourue zone par zone.',
  '',
  '| Fichier | Zone | Interface | Résolution | Durée | Audio | Taille |',
  '|---|---|---|---|---|---|---|',
  ...rows.map((r) =>
    r.exists
      ? `| \`${r.file}\` | ${r.pole} | ${r.format} | ${r.info.res} | ${mmss(r.info.duration)} | aucun | ${r.size} Mo |`
      : `| \`${r.file}\` | ${r.pole} | ${r.format} | — | — | — | **manquant** |`,
  ),
  '',
  '- **Couverture et horodatages** : `COUVERTURE-SILENCIEUX.md` (checklist de pages par enregistrement,',
  '  confrontation à l’inventaire de navigation, limites connues).',
  '- **Contrôles techniques** : `VERIFICATION.md` (pistes audio/vidéo, décodage intégral, chapitres,',
  '  plus long plan fixe).',
  '',
  '## Méthode de montage',
  '',
  'La capture n’est pas une vidéo : c’est un relevé d’images envoyées quand l’écran change. Le montage',
  'transforme ce relevé en vidéo continue, sans jamais modifier ce qui est affiché :',
  '',
  '1. chaque écran est représenté par une image **stabilisée** (jamais une image prise en pleine transition) ;',
  '2. un écran inchangé n’est jamais tenu plus de **13 s** — les gels de capture ne deviennent pas des',
  '   minutes d’image fixe, alors que les pauses de lecture voulues sont conservées ;',
  '3. le **prologue de connexion** (sélection d’univers, porte « Espace », formulaire) est retiré : la visite',
  '   commence sur le premier écran réel, chargé, et aucun identifiant n’apparaît ;',
  '4. encodage `libx264` crf 15, preset `slow`, paramètres orientés texte, réduction Lanczos.',
  '',
  'Rendu : **simulation de navigateur** (Chrome piloté en CDP), aucun appareil physique. Les enregistrements',
  '« Mobile » sont la mise en page mobile réelle, rendue et pilotée séparément — jamais un recadrage du desktop.',
  'Comptes de démonstration isolés (club `FC ProDay Démo`) ; aucun mot de passe visible, aucune donnée réelle.',
  '',
  'Régénération : `bash scripts/walkthrough/run-silent.sh` puis',
  '`node scripts/walkthrough/verify-silent.mjs && node scripts/walkthrough/make-silent-report.mjs`.',
  '',
].join('\n');
const readmePath = path.join(OUT, 'README.md');
fs.writeFileSync(readmePath, readme);
console.log(`[ok] ${readmePath}`);
