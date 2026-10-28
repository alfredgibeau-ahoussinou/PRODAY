/**
 * WAVE 7a — QA visual / proto parity (source invariants).
 *
 * Locks design tokens, the 7 mandatory desktop layouts, and gap-ticket
 * honesty (no fake CTAs for import×8 / proposal / guides / onboarding).
 * Does not redesign pages — read-only asserts against owned source.
 */
import fs from 'fs';
import path from 'path';
import {
  COACH_PROTO_CATEGORY_COLORS,
  COACH_PROTO_CATEGORY_PAGE,
  COACH_PROTO_DESKTOP,
  COACH_PROTO_LIVE,
  COACH_PROTO_RADII,
} from '../features/coach/theme/coachProtoTokens';
import { coachChrome } from '../features/coach/theme/coachDesignSystem';

const ROOT = path.resolve(__dirname, '..');
const read = (relative: string) => fs.readFileSync(path.join(ROOT, relative), 'utf8');

const PROTO_CATEGORY_KEYS = [
  'saison',
  'entrainements',
  'effectif',
  'analyse',
  'communication',
  'mon_espace',
] as const;

/** Expected tile accents — `coach-pages.css` / Parcourir gradients. */
const EXPECTED_TILE = {
  saison: { base: '#1587f6', light: '#64adfc' },
  entrainements: { base: '#ef641e', light: '#ffa065' },
  effectif: { base: '#05a790', light: '#57d4b9' },
  analyse: { base: '#6751e9', light: '#9c85ff' },
  communication: { base: '#cb477c', light: '#ef8cad' },
  mon_espace: { base: '#657384', light: '#a3b1c1' },
} as const;

/** Expected page accents — `body[data-category]` in coach-rich-pages.css. */
const EXPECTED_PAGE = {
  saison: { accent: '#0878de', tint: '#e6f2ff' },
  entrainements: { accent: '#b94810', tint: '#fff0e5' },
  effectif: { accent: '#087f6a', tint: '#e0f6ef' },
  analyse: { accent: '#6c46c4', tint: '#efe8ff' },
  communication: { accent: '#b63870', tint: '#fce7ef' },
  mon_espace: { accent: '#536579', tint: '#e8edf4' },
} as const;

describe('WAVE 7b — live visual QA guards (contrast / overflow)', () => {
  it('dock actif n’utilise pas tokens.accent brut sur surface claire', () => {
    const tabBar = read('features/coach/shell/CoachTabBar.tsx');
    expect(tabBar).toContain('activeInk');
    expect(tabBar).toContain('tokens.isLight ? tokens.deep : tokens.accent');
    // Régression : libellé actif branché directement sur tokens.accent (or 2.46:1).
    expect(tabBar).not.toMatch(/color:\s*on\s*\?\s*tokens\.accent\s*:/);
  });

  it('feuille langue première visite garde encre sombre sur blanc', () => {
    const sheet = read('components/branding/intro/FirstVisitLanguageSheet.tsx');
    expect(sheet).toContain("inkOnLight: { color: '#0A0A0F' }");
    expect(sheet).toContain('styles.inkOnLight');
  });

  it('Parcourir — tuiles catégorie mobile labelSize 15 (anti-wrap mid-word)', () => {
    const tiles = read('features/coach/theme/coachMenuTiles.ts');
    expect(tiles).toContain('COACH_BROWSE_CATEGORY_TILE_SIZE');
    expect(tiles).toMatch(/labelSize:\s*15/);
    expect(tiles).not.toMatch(/labelSize:\s*20/);
  });

  it('Parcourir — Communication icon ≠ Effectif (DEF-PF-002)', () => {
    const menu = read('features/coach/shell/CoachMenuPane.tsx');
    expect(menu).toMatch(/effectif:\s*'people'/);
    expect(menu).toMatch(/communication:\s*'chat'/);
    expect(menu).not.toMatch(/communication:\s*'people-outline'/);
  });

  it('Web dock clearance inset ≥ 96 (DEF-PF-001 / DEF-PF-001b)', () => {
    const layout = read('navigation/tabBarLayout.ts');
    expect(layout).toMatch(/TAB_BAR_CONTENT_INSET = Platform\.OS === 'web' \? 112 : 98/);
    const shell = read('features/coach/shell/CoachAppShell.tsx');
    expect(shell).toContain('DEF-PF-001b');
    expect(shell).toContain('marginBottom: TAB_BAR_CONTENT_INSET');
    expect(shell).toContain('paneBody');
    const home = read('screens/coach/CoachHomeScreen.tsx');
    expect(home).toContain('tabBarScrollInset(');
    expect(home).toContain('DEF-PF-001b');
  });

  it('Entraînements — titre carte sans durée/âge dupliqués (DEF-W7-006)', () => {
    const training = read('features/coach/training/CoachTrainingHome.tsx');
    const sessions = read('features/coach/training/prodayPreloadedSessions.ts');
    expect(sessions).toContain('export function preloadedSessionCardTitle');
    expect(training).toContain('preloadedSessionCardTitle');
    expect(training).toContain('DEF-W7-006');
  });

  it('Entraînements — shell atterrit sur CoachTrainingHome (pas le Planner legacy)', () => {
    const shell = read('features/coach/shell/CoachAppShell.tsx');
    expect(shell).toContain("from '../training/CoachTrainingHome'");
    expect(shell).toContain('<CoachTrainingHome');
    expect(shell).not.toMatch(/case 'entrainements':[\s\S]*?CoachTrainingPlannerScreen/);
  });

  it('Entraînements — IA proto (CTA · bibliothèque 2 rows · aside Vidéothèque)', () => {
    const training = read('features/coach/training/CoachTrainingHome.tsx');
    expect(training).toContain("'Préparer une séance'");
    expect(training).not.toContain('Séances à thème animées');
    expect(training).not.toContain('THEMED_ANIMATION_ROWS');
    expect(training).toContain('Présences et invitations');
    expect(training).toContain("onNavigate?.('mes_videos')");
    expect(training).toContain('coach.training.row.videotheque');
    expect(training).not.toContain('Séances vedettes');
    expect(training).not.toContain('Mode terrain (Chrono & Bilan)');
    expect(training).not.toContain('sessionsGrid');
  });

  it('Communication — hub proto communicationHub (pas Messagerie en atterrissage)', () => {
    const hub = read('screens/coach/CoachCommunicationHubScreen.tsx');
    const shell = read('features/coach/shell/CoachAppShell.tsx');
    const nav = read('features/coach/navigation/coachNavConfig.ts');
    expect(hub).toContain('testID="coach-communication-hub"');
    expect(hub).toContain('Vos outils de communication');
    expect(hub).toContain('Messagerie');
    expect(hub).toContain('Déplacements');
    expect(hub).toContain('Relances');
    expect(shell).toContain('CoachCommunicationHubScreen');
    expect(shell).toContain("case 'communication_hub'");
    expect(nav).toContain("id: 'communication_hub'");
  });
});

describe('WAVE 7a — design tokens (proto parity)', () => {
  it('expose les 6 accents catégorie (tuiles + page)', () => {
    for (const key of PROTO_CATEGORY_KEYS) {
      expect(COACH_PROTO_CATEGORY_COLORS[key].base).toBe(EXPECTED_TILE[key].base);
      expect(COACH_PROTO_CATEGORY_COLORS[key].light).toBe(EXPECTED_TILE[key].light);
      expect(COACH_PROTO_CATEGORY_PAGE[key].accent).toBe(EXPECTED_PAGE[key].accent);
      expect(COACH_PROTO_CATEGORY_PAGE[key].tint).toBe(EXPECTED_PAGE[key].tint);
    }
  });

  it('aligne rayons carte / bouton / tuile sur 25 px (`.card` / `.primaryaction`)', () => {
    expect(COACH_PROTO_RADII.card).toBe(25);
    expect(COACH_PROTO_RADII.button).toBe(25);
    expect(COACH_PROTO_RADII.tile).toBe(25);
    expect(COACH_PROTO_RADII.search).toBe(25);
    expect(COACH_PROTO_RADII.sheetDesktop).toBe(25);
    expect(COACH_PROTO_RADII.videoStage).toBe(22);
  });

  it('aligne rayons desktop (carte 20 / listgroup 18 / sidebar nav 13)', () => {
    expect(COACH_PROTO_RADII.cardDesktop).toBe(20);
    expect(COACH_PROTO_RADII.listGroupDesktop).toBe(18);
    expect(COACH_PROTO_RADII.sidebarNav).toBe(13);
    expect(COACH_PROTO_RADII.sidebarTeam).toBe(15);
  });

  it('aligne la géométrie desktop sur coach-desktop.css (--sidebar: 236px)', () => {
    expect(COACH_PROTO_DESKTOP.sidebarWidth).toBe(236);
    expect(COACH_PROTO_DESKTOP.contentMaxWidth).toBe(1440);
    expect(COACH_PROTO_DESKTOP.rightColWidth).toBe(310);
    expect(COACH_PROTO_DESKTOP.topbarHeight).toBe(76);
    expect(COACH_PROTO_DESKTOP.sidebarPaddingTop).toBe(42);
    expect(COACH_PROTO_DESKTOP.sidebarPaddingX).toBe(17);
    expect(COACH_PROTO_DESKTOP.videoToolsWidth).toBe(300);
    expect(coachChrome.sidebarExpanded).toBe(236);
    expect(coachChrome.sidebarWidth).toBe(236);
    expect(coachChrome.contentMaxWidth).toBe(1440);
  });
});

describe('WAVE 7c — remaining pixel chrome locks', () => {
  it('dock Parcourir utilise icône grid (proto #grid), pas hamburger', () => {
    const nav = read('features/coach/navigation/coachNavConfig.ts');
    expect(nav).toMatch(/id:\s*'plus'[\s\S]*?icon:\s*'grid'/);
    expect(nav).not.toMatch(/id:\s*'plus'[\s\S]*?icon:\s*'hamburger'/);
  });

  it('CoachCard / CoachListGroup basculent rayons desktop via workspace', () => {
    const ui = read('features/coach/ui/coachCommonUi.tsx');
    expect(ui).toContain('useCoachWorkspace');
    expect(ui).toContain('R.cardDesktop');
    expect(ui).toContain('R.listGroupDesktop');
  });

  it('sidebar desktop suit padding / nav radius proto', () => {
    const sidebar = read('features/coach/shell/CoachSidebar.tsx');
    expect(sidebar).toContain('COACH_PROTO_DESKTOP.sidebarPaddingTop');
    expect(sidebar).toContain('COACH_PROTO_RADII.sidebarNav');
    expect(sidebar).toContain('#E9EFFF');
  });

  it('video studio playerFrame = videoStage 22 + tools column cardDesktop', () => {
    const video = read('features/video/CoachVideoWorkspace.tsx');
    expect(video).toContain('COACH_PROTO_RADII.videoStage');
    expect(video).toContain('COACH_PROTO_RADII.cardDesktop');
    expect(video).toContain("testID=\"coach-video-studio-layout\"");
  });

  it('home KPI cards utilisent COACH_PROTO_RADII.card (25)', () => {
    const strip = read('components/coach/CoachHomeWeekStrip.tsx');
    expect(strip).toContain('COACH_PROTO_RADII.card');
    expect(strip).toContain('COACH_PROTO_RADII.cardDesktop');
  });

  it('live taggrid = proto colors + solid aplats (COACH_PROTO_LIVE)', () => {
    expect(COACH_PROTO_LIVE.timerFontSize).toBe(68);
    expect(COACH_PROTO_LIVE.tagColors[0]).toBe('#258849');
    expect(COACH_PROTO_LIVE.tagColors[5]).toBe('#7955b5');
    const tagger = read('components/coach/match/CoachLiveTaggerBar.tsx');
    expect(tagger).toContain('coach-live-taggrid');
    expect(tagger).toContain('Tir cadré');
    expect(tagger).toContain('COACH_PROTO_LIVE.tagColors');
    const live = read('screens/coach/CoachLiveMatchCenterScreen.tsx');
    expect(live).toContain('COACH_PROTO_LIVE.timerFontSize');
    expect(live).toContain('coach-match-live-timer');
  });

  it('field mode timer + debrief checkrows alignent le proto', () => {
    const field = read('features/coach/training/CoachFieldModeOverlay.tsx');
    expect(field).toContain('COACH_PROTO_LIVE.timerFontSize');
    const debrief = read('features/coach/training/CoachFieldDebriefSheet.tsx');
    expect(debrief).toContain('COACH_PROTO_LIVE.checkrowMinHeight');
    expect(debrief).toContain('styles.checkrow');
  });

  it('carpool + messages chrome = pageGutter 20', () => {
    const carpool = read('features/coach/carpool/CoachCarpoolChrome.tsx');
    expect(carpool).toContain('COACH_PROTO_SPACING.pageGutter');
    const messages = read('features/coach/messaging/CoachMessagesChrome.tsx');
    expect(messages).toContain('COACH_PROTO_SPACING.pageGutter');
  });

  it('rides form density = coach form tokens via palette (shared CarpoolScreen)', () => {
    const palette = read('utils/carpoolUiPalette.ts');
    expect(palette).toContain('COACH_FORM_DENSITY');
    expect(palette).toContain('COACH_PROTO_RADII.card');
    expect(palette).toContain('COACH_PROTO_RADII.input');
    expect(palette).toContain('COACH_PROTO_RADII.button');
    expect(palette).toContain("shell: 'coach'");
    const form = read('components/carpool/StandaloneCarpoolForm.tsx');
    expect(form).toContain("form.shell === 'coach'");
    expect(form).toContain('form.cardRadius');
    expect(form).toContain('form.inputRadius');
    expect(form).toContain('form.buttonMinHeight');
    expect(form).not.toContain("backgroundColor: '#1C1D26'");
    const propose = read('components/carpool/CarpoolProposeCard.tsx');
    expect(propose).toContain("form.shell === 'coach'");
    expect(propose).toContain('form.inputMinHeight');
    const seats = read('components/carpool/CarpoolSeatPicker.tsx');
    expect(seats).toContain("form.shell === 'coach'");
    expect(seats).toContain('palette.surfaceMuted');
    const guest = read('components/carpool/CarpoolGuestPrompt.tsx');
    expect(guest).toContain("palette.form.shell === 'coach'");
    expect(guest).toContain('showSpace');
  });

  it('report videoplace placeholder (clip folded) + Après-match rows', () => {
    const report = read('screens/coach/matchCenter/CoachMatchCenterReportPanel.tsx');
    expect(report).toContain('coach-match-report-videoplace');
    expect(report).toContain('COACH_PROTO_LIVE.videoPlaceHeight');
    expect(report).toContain('Après-match');
    expect(report).toContain('Évaluer un joueur');
  });
});

describe('WAVE 7a — 7 desktop layouts (code evidence)', () => {
  it('home — CoachHomeScreen desktop-dashboard (main + aside 310)', () => {
    const home = read('screens/coach/CoachHomeScreen.tsx');
    expect(home).toContain('testID="coach-home-desktop"');
    expect(home).toContain('testID="coach-home-desktop-main"');
    expect(home).toContain('testID="coach-home-desktop-aside"');
    expect(home).toContain('desktopGrid');
    expect(home).toMatch(/width:\s*310/);
  });

  it('session — CoachTrainingEventDetail déroulé | aperçu', () => {
    const session = read('screens/coach/CoachTrainingEventDetail.tsx');
    expect(session).toContain('desktopSessionLayout');
    expect(session).toContain('testID="coach-training-session-layout"');
    expect(session).toContain('testID="coach-training-session-preview"');
  });

  it('training — CoachTrainingHome layout desktop séances', () => {
    const training = read('features/coach/training/CoachTrainingHome.tsx');
    expect(training).toContain('desktopTrainingLayout');
    expect(training).toContain('testID="coach-training-session-desktop"');
    expect(training).toContain('testID="coach-training-home"');
  });

  it('builder — CoachTrainingHome form split + aside (GAP-PROPOSAL honnête)', () => {
    const training = read('features/coach/training/CoachTrainingHome.tsx');
    expect(training).toContain('desktopFormSplit');
    expect(training).toContain('testID="coach-training-builder"');
    expect(training).toContain('testID="coach-training-builder-aside"');
    expect(training).toContain('GAP-PROPOSAL');
    expect(training).not.toMatch(/setView\(['"]proposal['"]\)/);
  });

  it('videoEditor — CoachVideoWorkspace studio desktop (player | tools)', () => {
    const video = read('features/video/CoachVideoWorkspace.tsx');
    expect(video).toContain('desktopVideoLayout');
    expect(video).toContain('testID="coach-video-studio-layout"');
    expect(video).toContain('testID="coach-video-studio-player"');
    expect(video).toContain('testID="coach-video-studio-tools"');
  });

  it('lineup — CoachCompositionSurface desktop-lineup (rail 280 | pitch)', () => {
    const lineup = read('components/coach/CoachCompositionSurface.tsx');
    expect(lineup).toContain('desktopSplitLayout');
    expect(lineup).toContain('DESKTOP_LINEUP_RAIL = 280');
    expect(lineup).toContain('DESKTOP_PITCH_MAX = 650');
    expect(lineup).toContain('desktopSideControls');
    expect(lineup).toContain('desktopPitchColumn');
  });

  it('player — CoachPlayer360Screen fiche + aside desktop', () => {
    const player = read('screens/coach/CoachPlayer360Screen.tsx');
    expect(player).toContain('desktopPlayerLayout');
    expect(player).toContain('testID="coach-player360-desktop"');
    expect(player).toContain('testID="coach-player360-aside"');
  });
});

describe('WAVE 7a — sidebar PC = maquette desktopLinks (pas de feuilles)', () => {
  it('COACH_NAV_FOLDERS = Espace de travail + Accès direct (coach-desktop.js)', () => {
    const {
      COACH_NAV_FOLDERS,
    } = require('../features/coach/navigation/coachNavConfig') as typeof import('../features/coach/navigation/coachNavConfig');
    expect(COACH_NAV_FOLDERS.map((f) => f.id)).toEqual(['espace_travail', 'acces_direct']);
    expect(COACH_NAV_FOLDERS[0].items.map((i) => i.label)).toEqual([
      'Résumé',
      'Saison',
      'Entraînements',
      'Effectif',
      'Analyse',
      'Communication',
      'Mon espace',
    ]);
    expect(COACH_NAV_FOLDERS[1].items.map((i) => i.label)).toEqual([
      'Classement',
      'Composition',
      'Vidéothèque',
    ]);
    const listed = COACH_NAV_FOLDERS.flatMap((f) => f.items.map((i) => i.id));
    expect(listed).not.toContain('gestion');
    expect(listed).not.toContain('joueurs');
    expect(listed).not.toContain('com_staff');
    expect(listed).not.toContain('copilot_chat');
  });

  it('CoachSidebar allume les hubs par catégorie (miroir categoryMap desktop)', () => {
    const sidebar = read('features/coach/shell/CoachSidebar.tsx');
    expect(sidebar).toContain('isDesktopSidebarItemActive');
    expect(sidebar).toContain('coachMainCategoryOf');
    expect(sidebar).toContain("folderId !== 'espace_travail'");
  });
});

describe('WAVE 7a — gap tickets remain gaps (no fake CTAs)', () => {
  const nav = read('features/coach/navigation/coachNavConfig.ts');
  const menu = read('features/coach/shell/CoachMenuPane.tsx');
  const sidebar = read('features/coach/shell/CoachSidebar.tsx');
  const account = read('screens/coach/CoachProfileSettingsScreen.tsx');
  const training = read('features/coach/training/CoachTrainingHome.tsx');
  const squad = read('screens/coach/CoachSquadScreen.tsx');
  const importPanel = read('components/coach/CoachSquadImportPanel.tsx');

  it('nav / menu / sidebar n’inventent pas importChoice · proposal · guides · onboarding', () => {
    for (const src of [nav, menu, sidebar]) {
      expect(src).not.toMatch(/id:\s*['"]importChoice['"]/);
      expect(src).not.toMatch(/id:\s*['"]importFiles['"]/);
      expect(src).not.toMatch(/id:\s*['"]proposal['"]/);
      expect(src).not.toMatch(/id:\s*['"]guides['"]/);
      expect(src).not.toMatch(/id:\s*['"]onboarding['"]/);
      expect(src).not.toMatch(/requestNav\(['"]guides['"]\)/);
      expect(src).not.toMatch(/requestNav\(['"]onboarding['"]\)/);
      expect(src).not.toMatch(/requestNav\(['"]proposal['"]\)/);
    }
    expect(sidebar).toContain("pas d'import / proposal / guides inventés");
  });

  it('GAP-IMPORT×8 — pas de wizard 8 écrans ; import réel seulement', () => {
    expect(squad).not.toMatch(/importChoice|importFiles|importAnalysis|importDuplicates/);
    expect(importPanel).not.toMatch(/Étape \d+\/8|wizard/i);
    expect(importPanel).toContain('clubLicenseService.importLicensedRoster');
  });

  it('GAP-PROPOSAL — builder sans vue proposal distante', () => {
    expect(training).toContain('GAP-PROPOSAL');
    expect(training).not.toMatch(/setView\(['"]proposal['"]\)/);
    expect(training).not.toContain('Votre proposition');
  });

  it('GAP-GUIDES / GAP-ONBOARDING — Mon espace garde la modal, pas de routes inventées', () => {
    expect(account).toContain('CoachInteractiveGuideModal');
    expect(account).toContain('GAP-GUIDES');
    expect(account).not.toMatch(/requestNav\(['"]guides['"]\)/);
    expect(account).not.toMatch(/requestNav\(['"]onboarding['"]\)/);
  });
});

describe('WAVE 7a — P-001…017 ownership surfaces still present', () => {
  const pages: Array<{ id: string; file: string; marker: string }> = [
    { id: 'P-001', file: 'screens/coach/CoachHomeScreen.tsx', marker: 'WAVE 5 P-001' },
    { id: 'P-002', file: 'screens/coach/CoachCalendarScreen.tsx', marker: 'WAVE 4 P-002' },
    { id: 'P-003', file: 'features/coach/shell/CoachMenuPane.tsx', marker: 'WAVE 4 · P-003' },
    { id: 'P-004', file: 'screens/coach/CoachSquadScreen.tsx', marker: 'WAVE 4 P-004' },
    { id: 'P-005', file: 'features/coach/training/CoachTrainingHome.tsx', marker: 'WAVE 4 — P-005' },
    { id: 'P-006', file: 'features/coach/messaging/CoachMessagesChrome.tsx', marker: 'WAVE 5 P-006' },
    { id: 'P-007', file: 'screens/coach/CoachRsvpReminderLogScreen.tsx', marker: 'WAVE 5 P-007' },
    { id: 'P-008', file: 'features/coach/ai/CoachProdayAiPane.tsx', marker: 'WAVE 5 · P-008' },
    { id: 'P-009', file: 'features/coach/training/TacticalLabScreen.tsx', marker: 'WAVE 5 · P-009' },
    { id: 'P-011', file: 'screens/coach/CoachPlayer360Screen.tsx', marker: 'WAVE 5 P-011' },
    { id: 'P-012', file: 'screens/coach/CoachVideoHubScreen.tsx', marker: 'WAVE 5 · P-012' },
    { id: 'P-013', file: 'features/coach/shell/CoachGestionPane.tsx', marker: 'WAVE 5 / P-013' },
    { id: 'P-014', file: 'features/coach/shell/CoachHourlyPane.tsx', marker: 'WAVE 5b · P-014' },
    { id: 'P-015', file: 'screens/coach/CoachLiveMatchCenterScreen.tsx', marker: 'P-015' },
    { id: 'P-016', file: 'screens/coach/CoachCarpoolScreen.tsx', marker: 'WAVE 5b P-016' },
    { id: 'P-017', file: 'screens/coach/CoachProfileSettingsScreen.tsx', marker: 'WAVE 4 / P-017' },
  ];

  it.each(pages)('$id surface exists with wave marker', ({ file, marker }) => {
    const src = read(file);
    expect(src).toContain(marker);
  });

  it('P-010 Memory remains as IA section (not a solo page rebuild)', () => {
    const memory = read('features/coach/os/screens/MemoryScreen.tsx');
    expect(memory).toContain('WAVE 5 · P-008 / P-010');
    const shell = read('features/coach/shell/CoachAppShell.tsx');
    expect(shell).toContain("resolveCoachNavTarget('memory')");
    expect(shell).toContain('copilot_chat');
  });
});
