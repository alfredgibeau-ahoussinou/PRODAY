#!/usr/bin/env node
/**
 * Applique des remplacements i18n ciblés sur plusieurs fichiers.
 * Usage: node scripts/wire-i18n-files.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const IMPORT_HOOK = "import { useTranslation } from '../context/LocaleContext';";
const IMPORT_HOOK_COMPONENTS = "import { useTranslation } from '../../context/LocaleContext';";
const IMPORT_HOOK_ADMIN = "import { useTranslation } from '../../../context/LocaleContext';";

function ensureImport(content, importLine) {
  if (content.includes('useTranslation')) return content;
  const idx = content.indexOf('\n', content.indexOf('import '));
  return content.slice(0, idx + 1) + importLine + '\n' + content.slice(idx + 1);
}

function ensureTHook(content, componentPattern) {
  if (content.includes('const { t } = useTranslation()')) return content;
  const m = content.match(componentPattern);
  if (!m) return content;
  return content.replace(m[0], `${m[0]}\n  const { t } = useTranslation();`);
}

const patches = [
  {
    file: 'src/screens/admin/pages/AdminOverviewPage.tsx',
    importLine: IMPORT_HOOK_ADMIN,
    hook: /export const AdminOverviewPage[^=]*= \(\{ onNavigate \}\) => \{/,
    replacements: [
      ['title="Pilotage plateforme"', 'title={t(\'admin.overview.title\')}'],
      ['subtitle="Modération · utilisateurs · indicateurs temps réel"', 'subtitle={t(\'admin.overview.subtitle\')}'],
      ['title={`${stats.pendingVerifications} vérification(s) en attente`}', 'title={t(\'admin.overview.verifications\', { n: stats.pendingVerifications })}'],
      ['subtitle="Coachs, agents, joueurs — onglet Utilisateurs"', 'subtitle={t(\'admin.overview.verificationsSub\')}'],
      ['title={`${stats.pendingCommunityReels} reel(s) à modérer`}', 'title={t(\'admin.overview.reelsModerate\', { n: stats.pendingCommunityReels })}'],
      ['subtitle="Approuver avant publication dans le fil"', 'subtitle={t(\'admin.overview.reelsModerateSub\')}'],
      ['title={`${stats.reelReports} signalement(s) reel`}', 'title={t(\'admin.overview.reelReports\', { n: stats.reelReports })}'],
      ['subtitle="Consulter les rapports utilisateurs"', 'subtitle={t(\'admin.overview.reelReportsSub\')}'],
      ['Accès rapides', '{t(\'admin.overview.quickAccess\')}'],
      ['label="Utilisateurs" hint="Comptes & vérif."', 'label={t(\'admin.overview.users\')} hint={t(\'admin.overview.usersHint\')}'],
      ['label="Modération" hint={`${moderationPending} en attente`}', 'label={t(\'admin.overview.moderation\')} hint={t(\'admin.overview.moderationHint\', { n: moderationPending })}'],
      ['label="Clubs" hint="Structures"', 'label={t(\'admin.overview.clubs\')} hint={t(\'admin.overview.clubsHint\')}'],
      ['label="Système" hint="Stats & session"', 'label={t(\'admin.overview.system\')} hint={t(\'admin.overview.systemHint\')}'],
      ['<ProDayText variant="section">Synthèse</ProDayText>', '<ProDayText variant="section">{t(\'admin.overview.summary\')}</ProDayText>'],
      ['{stats.users} comptes · {stats.clubs} clubs · {stats.teamEvents} événements', '{t(\'admin.overview.summaryLine1\', { users: stats.users, clubs: stats.clubs, events: stats.teamEvents })}'],
      ['{stats.recruitmentPosts} annonces · {stats.applications} candidatures · {stats.pendingCommunityReels} reels en attente', '{t(\'admin.overview.summaryLine2\', { posts: stats.recruitmentPosts, apps: stats.applications, reels: stats.pendingCommunityReels })}'],
    ],
  },
];

for (const patch of patches) {
  const path = join(ROOT, patch.file);
  let content = readFileSync(path, 'utf8');
  content = ensureImport(content, patch.importLine);
  content = ensureTHook(content, patch.hook);
  for (const [from, to] of patch.replacements) {
    content = content.split(from).join(to);
  }
  writeFileSync(path, content);
  console.log('patched', patch.file);
}
