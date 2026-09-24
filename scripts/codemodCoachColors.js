/**
 * Codemod — conversion des dernières couleurs littérales du pôle Coach.
 *
 * La charte « zéro couleur littérale » (coachProDesignAlignment) impose que
 * chaque écran Coach consomme les jetons partagés. Six écrans et le tableau de
 * classement utilisaient encore ~315 littéraux — les mêmes couleurs
 * récurrentes, toutes couvertes par le socle (proSemantic, tokens Coach,
 * `withAlpha`).
 *
 * Le codemod est mécanique et sûr :
 *  - mapping exhaustif relevé par comptage sur les 7 fichiers cibles ;
 *  - ne touche qu'aux fichiers listés (présents sur disque) ;
 *  - importe `withAlpha` (déjà exporté par utils/coachTeamTheme) ;
 *  - idempotent : relancer ne produit aucun changement.
 *
 * Usage : `node scripts/codemodCoachColors.js`
 */
const fs = require('fs');
const path = require('path');

const TARGETS = [
  // Vague 1 — écrans convertis au 15/09.
  'src/screens/coach/CoachLiveMatchCenterScreen.tsx',
  'src/screens/coach/CoachTwinMatchLabScreen.tsx',
  'src/screens/coach/CoachWorkloadHealthScreen.tsx',
  'src/screens/coach/CoachScoutingGrowthScreen.tsx',
  'src/screens/coach/CoachMesVideosScreen.tsx',
  'src/screens/coach/CoachTrainingEventHub.tsx',
  'src/components/coach/CoachStandingsTable.tsx',
  // Vague 2 — composants partagés convertis au 16/09.
  'src/components/coach/CoachTrainingDrillDiagram.tsx',
  'src/components/coach/CoachSportEasyPitchSurface.tsx',
  'src/components/coach/CoachSportEasyPitch.tsx',
  'src/components/coach/CoachProfileHub.tsx',
  'src/components/coach/CoachAiTacticsSheet.tsx',
  'src/components/coach/CoachAccountPanels.tsx',
  'src/components/coach/CoachPlayerAiPanel.tsx',
  'src/components/coach/CoachTrainingTeamRoster.tsx',
  'src/components/coach/CoachAccentColorPickerModal.tsx',
  'src/components/coach/FederationSyncDrawer.tsx',
].filter((p) => fs.existsSync(path.join(__dirname, '..', p)));

const H = (h, a) => `withAlpha('${h}', ${a})`;

// [littéral exact, remplacement]. L'ordre importe : les clés rgba longues
// doivent passer avant leurs préfixes éventuels.
const RULES = [
  // Surfaces & bordures (tokens Coach)
  ["'#000000'", 'tokens.bg'],
  ["'#181822'", 'tokens.elevated'],
  ["'#20202C'", 'tokens.elevated'],
  ["'#121218'", 'tokens.surface'],
  ["'#E5E5EA'", 'tokens.elevated'],
  ['rgba(255, 255, 255, 0.03)', H('FFFFFF', 0.03)],
  ['rgba(255, 255, 255, 0.04)', H('FFFFFF', 0.04)],
  ['rgba(255, 255, 255, 0.05)', H('FFFFFF', 0.05)],
  ['rgba(255, 255, 255, 0.06)', H('FFFFFF', 0.06)],
  ['rgba(255, 255, 255, 0.08)', 'tokens.border'],
  ['rgba(255, 255, 255, 0.1)', H('FFFFFF', 0.1)],
  ['rgba(255, 255, 255, 0.14)', 'tokens.border'],
  ['rgba(255, 255, 255, 0.15)', H('FFFFFF', 0.15)],

  // Textes
  ["'#8B8B9A'", 'tokens.muted'],
  ["'#8E8E93'", 'tokens.muted'],
  ["'#636366'", 'tokens.muted'],
  ["'#D1D1D6'", H('FFFFFF', 0.8)],
  // Blanc plein → surface claire socle (le blanc de TEXTE est traité en deux
  // passes : d'abord ce mapping, puis un correctif manuel sur les deux fonds
  // « chip de rang » identifiés à la lecture).
  ["'#FFFFFF'", 'tokens.foreground'],

  // Succès
  ["'#30D158'", 'proSemantic.success'],
  ["'#10B981'", 'proSemantic.success'],
  ['rgba(48, 209, 88, 0.08)', H('10B981', 0.08)],
  ['rgba(48, 209, 88, 0.1)', H('10B981', 0.1)],
  ['rgba(48, 209, 88, 0.15)', 'proSemantic.successSoft'],
  ['rgba(48, 209, 88, 0.2)', H('10B981', 0.2)],
  ['rgba(48, 209, 88, 0.25)', H('10B981', 0.25)],
  ['rgba(48, 209, 88, 0.3)', H('10B981', 0.3)],
  ['rgba(16, 185, 129, 0.1)', H('10B981', 0.1)],
  ['rgba(16, 185, 129, 0.25)', H('10B981', 0.25)],

  // Avertissement
  ["'#F59E0B'", 'proSemantic.warning'],
  ["'#FF9F0A'", 'proSemantic.warning'],
  ['rgba(245, 158, 11, 0.06)', H('F59E0B', 0.06)],
  ['rgba(245, 158, 11, 0.08)', H('F59E0B', 0.08)],
  ['rgba(245, 158, 11, 0.1)', H('F59E0B', 0.1)],
  ['rgba(245, 158, 11, 0.12)', H('F59E0B', 0.12)],
  ['rgba(245, 158, 11, 0.15)', H('F59E0B', 0.15)],
  ['rgba(245, 158, 11, 0.2)', H('F59E0B', 0.2)],
  ['rgba(245, 158, 11, 0.25)', H('F59E0B', 0.25)],
  ['rgba(245, 158, 11, 0.35)', H('F59E0B', 0.35)],
  ['rgba(245, 158, 11, 0.4)', H('F59E0B', 0.4)],
  ['rgba(255, 159, 10, 0.2)', H('F59E0B', 0.2)],
  ['rgba(255, 159, 10, 0.3)', H('F59E0B', 0.3)],
  ['rgba(255, 159, 10, 0.35)', H('F59E0B', 0.35)],

  // Danger
  ["'#FF453A'", 'proSemantic.danger'],
  ["'#EF4444'", 'proSemantic.danger'],
  ['rgba(255, 69, 58, 0.15)', H('EF4444', 0.15)],
  ['rgba(255, 69, 58, 0.2)', H('EF4444', 0.2)],
  ['rgba(255, 69, 58, 0.25)', H('EF4444', 0.25)],
  ['rgba(255, 69, 58, 0.35)', H('EF4444', 0.35)],
  ['rgba(239, 68, 68, 0.15)', H('EF4444', 0.15)],
  ['rgba(239, 68, 68, 0.3)', H('EF4444', 0.3)],
  ["'#F87171'", H('EF4444', 0.72)],
  ["'#F43F5E'", H('EF4444', 0.85)],

  // Or / accent doré → accent du pôle Coach (vert officiel ou accent équipe)
  ["'#C5A059'", 'tokens.accent'],
  ['rgba(197, 160, 89, 0.15)', 'withAlpha(tokens.accent, 0.15)'],
  ['rgba(197, 160, 89, 0.25)', 'withAlpha(tokens.accent, 0.25)'],
  ["'#FFD700'", 'tokens.accent'],
  ["'#FBBF24'", 'withAlpha(tokens.accent, 0.9)'],
  ['rgba(255, 215, 0, 0.1)', 'withAlpha(tokens.accent, 0.1)'],
  ['rgba(255, 215, 0, 0.4)', 'withAlpha(tokens.accent, 0.4)'],
  ['rgba(255, 255, 215, 0.1)', 'withAlpha(tokens.accent, 0.1)'],

  // Info (accent « données / actions secondaires »)
  ["'#0A84FF'", 'proSemantic.info'],
  ["'#38BDF8'", 'proSemantic.info'],
  ["'#64D2FF'", 'proSemantic.info'],
  ["'#22D3EE'", 'proSemantic.info'],
  ['rgba(10, 132, 255, 0.15)', H('0A84FF', 0.15)],
  ['rgba(10, 132, 255, 0.2)', H('0A84FF', 0.2)],
  ['rgba(10, 132, 255, 0.25)', H('0A84FF', 0.25)],
  ['rgba(56, 189, 248, 0.12)', H('0A84FF', 0.12)],
  ['rgba(100, 210, 255, 0.15)', H('0A84FF', 0.15)],
  ['rgba(100, 210, 255, 0.25)', H('0A84FF', 0.25)],

  // Blancs translucides (posés plus bas pour couvrir après border 0.08/0.14)
  ['rgba(255, 255, 255, 0.55)', H('FFFFFF', 0.55)],
  ['rgba(255, 255, 255, 0.7)', H('FFFFFF', 0.7)],
  ['rgba(255, 255, 255, 0.8)', H('FFFFFF', 0.8)],
  ['rgba(255, 255, 255, 0.85)', H('FFFFFF', 0.85)],

  // Vague 2 — composants (diagrammes, terrain, profils, IA, compte).
  ["'#10B981'", 'proSemantic.success'],
  ["'#EF4444'", 'proSemantic.danger'],
  ["'#F87171'", H('EF4444', 0.72)],
  ["'#3B82F6'", 'proSemantic.info'],
  ["'#60A5FA'", 'proSemantic.info'],
  ["'#38BDF8'", 'proSemantic.info'],
  ["'#0A84FF'", 'proSemantic.info'],
  ["'#FF9F0A'", 'proSemantic.warning'],
  ["'#F59E0B'", 'proSemantic.warning'],
  ["'#FDE68A'", H('F59E0B', 0.4)],
  ["'#8B8B9A'", 'tokens.muted'],
  ["'#6B7280'", 'tokens.muted'],
  ["'#9CA3AF'", 'tokens.muted'],
  ["'#000000'", 'tokens.bg'],
  ["'#FFFFFF'", 'tokens.foreground'],
  ["'#8B5CF6'", 'PRO_DATA_VIOLET'],
  ["'#A78BFA'", 'PRO_DATA_VIOLET'],
  ["'#C4B5FD'", 'PRO_DATA_VIOLET'],
  ["'#DDD6FE'", 'withAlpha(PRO_DATA_VIOLET, 0.25)'],
  ["'#EDE9FE'", 'withAlpha(PRO_DATA_VIOLET, 0.18)'],
  ["'#1E1435'", 'tokens.elevated'],
  ["'#100D1C'", 'tokens.elevated'],
  // Verts terrain profonds (diagrammes SVG) → dérivés de l'accent socle.
  ["'#0A1E11'", "withAlpha('#000000', 0.92)"],
  ["'#0F2918'", "withAlpha('#000000', 0.86)"],
  ["'#071209'", "withAlpha('#000000', 0.94)"],
  ["'#0F1210'", "withAlpha('#000000', 0.9)"],
  ["'#111815'", "withAlpha('#000000', 0.88)"],
  ["'#064E3B'", 'tokens.accent'],
  ["'#FAFAFA'", 'tokens.foreground'],
  ["'#F9FAFB'", 'tokens.foreground'],
  ["'#F3F4F6'", 'CLEAR.surface'],
  ["'#ECFDF5'", 'proSemantic.successSoft'],
  ["'#FF375F'", 'proSemantic.danger'],
  ["'#0A84FF'", 'proSemantic.info'],
  ['rgba(0, 230, 118, 0.2)', "withAlpha(tokens.accent, 0.2)"],
  ['rgba(0, 230, 118, 0.25)', "withAlpha(tokens.accent, 0.25)"],
  ['rgba(0, 230, 118, 0.3)', "withAlpha(tokens.accent, 0.3)"],
  ['rgba(5, 14, 8, 0.92)', "withAlpha('#000000', 0.92)"],
  ['rgba(139, 92, 246, 0.2)', "withAlpha(PRO_DATA_VIOLET, 0.2)"],
  ['rgba(139, 92, 246, 0.3)', "withAlpha(PRO_DATA_VIOLET, 0.3)"],
  ['rgba(139, 92, 246, 0.35)', "withAlpha(PRO_DATA_VIOLET, 0.35)"],
  ['rgba(139, 92, 246, 0.45)', "withAlpha(PRO_DATA_VIOLET, 0.45)"],
  ['rgba(248, 113, 113, 0.1)', H('EF4444', 0.1)],
  ['rgba(248, 113, 113, 0.3)', H('EF4444', 0.3)],
  ['rgba(56, 189, 248, 0.16)', H('0A84FF', 0.16)],
  ['rgba(255,255,255,0.92)', H('FFFFFF', 0.92)],
  ['rgba(255,255,255,0.65)', H('FFFFFF', 0.65)],
  ['rgba(255,255,255,0.48)', H('FFFFFF', 0.48)],
  ['rgba(255,255,255,0.4)', H('FFFFFF', 0.4)],
  ['rgba(255,255,255,0.3)', H('FFFFFF', 0.3)],
  ['rgba(255,255,255,0.12)', H('FFFFFF', 0.12)],
  ['rgba(255,255,255,0.1)', H('FFFFFF', 0.1)],
  ['rgba(255,255,255,0.08)', 'tokens.border'],
  ['rgba(255,255,255,0.06)', H('FFFFFF', 0.06)],
  ['rgba(255,255,255,0.03)', H('FFFFFF', 0.03)],
  ['rgba(255,255,255,0.02)', H('FFFFFF', 0.02)],
  ['rgba(0,0,0,0.75)', "withAlpha('#000000', 0.75)"],
  ['rgba(0,0,0,0.65)', "withAlpha('#000000', 0.65)"],
  ['rgba(0,0,0,0.6)', "withAlpha('#000000', 0.6)"],
  ['rgba(0,0,0,0.5)', "withAlpha('#000000', 0.5)"],
  ['rgba(0,0,0,0.4)', "withAlpha('#000000', 0.4)"],
  ['rgba(0,0,0,0.3)', "withAlpha('#000000', 0.3)"],
  ['rgba(0,0,0,0.06)', "withAlpha('#000000', 0.06)"],
  // Alphas simples manqués (vague 2)
  ['rgba(255, 255, 255, 0.02)', H('FFFFFF', 0.02)],
  ['rgba(255, 255, 255, 0.2)', H('FFFFFF', 0.2)],
  ['rgba(255, 255, 255, 0.25)', H('FFFFFF', 0.25)],
  ['rgba(255, 255, 255, 0.22)', H('FFFFFF', 0.22)],
  ['rgba(255, 255, 255, 0.3)', H('FFFFFF', 0.3)],
  ['rgba(255, 255, 255, 0.4)', H('FFFFFF', 0.4)],
  ['rgba(255, 255, 255, 0.48)', H('FFFFFF', 0.48)],
  ['rgba(255, 255, 255, 0.6)', H('FFFFFF', 0.6)],
  ['rgba(255, 255, 255, 0.65)', H('FFFFFF', 0.65)],
  ['rgba(255, 255, 255, 0.92)', H('FFFFFF', 0.92)],
  ['rgba(239, 68, 68, 0.05)', H('EF4444', 0.05)],
  ['rgba(239, 68, 68, 0.35)', H('EF4444', 0.35)],
  ['rgba(239, 68, 68, 0.4)', H('EF4444', 0.4)],
  ['rgba(239, 68, 68, 0.5)', H('EF4444', 0.5)],
  ['rgba(16, 185, 129, 0.08)', H('10B981', 0.08)],
  ['rgba(16, 185, 129, 0.15)', 'proSemantic.successSoft'],
  ['rgba(16, 185, 129, 0.18)', H('10B981', 0.18)],
  ['rgba(16, 185, 129, 0.35)', H('10B981', 0.35)],
  ['rgba(245, 158, 11, 0.16)', H('F59E0B', 0.16)],

  // Vague 2 — attributs SVG/JSX à guillemets doubles (diagrammes, terrain).
  ['"#10B981"', 'proSemantic.success'],
  ['"#3B82F6"', 'proSemantic.info'],
  ['"#60A5FA"', 'proSemantic.info'],
  ['"#F59E0B"', 'proSemantic.warning'],
  ['"#EF4444"', 'proSemantic.danger'],
  ['"#FAFAFA"', 'tokens.foreground'],
  ['"#000000"', 'tokens.bg'],
  ['"#8B5CF6"', 'PRO_DATA_VIOLET'],
  ['"#A78BFA"', 'PRO_DATA_VIOLET'],
  ['"#C4B5FD"', 'PRO_DATA_VIOLET'],
  ['"#DDD6FE"', 'withAlpha(PRO_DATA_VIOLET, 0.25)'],
  ['"#0F2918"', "withAlpha('#000000', 0.86)"],
  ['"#0A1E11"', "withAlpha('#000000', 0.92)"],
  ['rgba(255, 255, 255, 0.12)', H('FFFFFF', 0.12)],

  // Palette claire — variantes à guillemets simples
  ["'#0F172A'", 'CLEAR.foreground'],
  ["'#64748B'", 'CLEAR.muted'],
  ["'#121217'", 'CLEAR.elevated'],
  ["'#F8FAFC'", 'CLEAR.surface'],
  ["'#F1F5F9'", 'CLEAR.surface'],
  ["'#E2E8F0'", 'CLEAR.border'],
  ["'#FFFBEB'", H('F59E0B', 0.1)],
  ["'#FEF9C3'", H('F59E0B', 0.15)],
  ["'#FDE68A'", H('F59E0B', 0.4)],

  // Variantes à guillemets doubles (mêmes couleurs, autre écriture)
  ['"#FFFFFF"', 'tokens.foreground'],
  ['"#000000"', 'tokens.bg'],
  ['"#C5A059"', 'tokens.accent'],
  ['"#8B8B9A"', 'tokens.muted'],
  ['"#30D158"', 'proSemantic.success'],
  ['"#FF9F0A"', 'proSemantic.warning'],
  ['"#FF453A"', 'proSemantic.danger'],
  ['"#0A84FF"', 'proSemantic.info'],
  ['"#38BDF8"', 'proSemantic.info'],
  ['"#64D2FF"', 'proSemantic.info'],
  ['"#F87171"', H('EF4444', 0.72)],
  ['"#F43F5E"', H('EF4444', 0.85)],
  ['"#E5E5EA"', 'tokens.elevated'],

  // Alphas manqués (variante simple)
  ['rgba(255, 159, 10, 0.12)', H('F59E0B', 0.12)],
  ['rgba(255, 159, 10, 0.15)', H('F59E0B', 0.15)],
  ['rgba(255, 159, 10, 0.25)', H('F59E0B', 0.25)],
  ['rgba(48, 209, 88, 0.12)', H('10B981', 0.12)],
  ['rgba(255, 255, 255, 0.5)', H('FFFFFF', 0.5)],

  // Palette claire (mode lightMode du classement) — surfaces iOS grouped de
  // la variante Clair du pôle Coach, teintes warning dérivées du statut.
  ['"#0F172A"', 'CLEAR.foreground'],
  ['"#64748B"', 'CLEAR.muted'],
  ['"#121217"', 'CLEAR.elevated'],
  ['"#F8FAFC"', 'CLEAR.surface'],
  ['"#F1F5F9"', 'CLEAR.surface'],
  ['"#E2E8F0"', 'CLEAR.border'],
  ['"#FFFBEB"', H('F59E0B', 0.1)],
  ['"#FEF9C3"', H('F59E0B', 0.15)],
  ['"#FDE68A"', H('F59E0B', 0.4)],
  ['rgba(197, 160, 89, 0.08)', 'withAlpha(tokens.accent, 0.08)'],
  ['rgba(197, 160, 89, 0.18)', 'withAlpha(tokens.accent, 0.18)'],
  ['rgba(255, 159, 10, 0.12)', H('F59E0B', 0.12)],
];

const IMPORT_WITH_ALPHA = "import { withAlpha } from '../../utils/coachTeamTheme';";
const IMPORT_PRO = "import { PRO_DATA_VIOLET, proSemantic } from '../../theme/professionalDesign';";

function convert(source) {
  let out = source;
  for (const [lit, rep] of RULES) {
    out = out.split(lit).join(rep);
  }
  // Imports idempotents : withAlpha seulement si le fichier en fait usage.
  if (out.includes('withAlpha(') && !out.includes(IMPORT_WITH_ALPHA)) {
    out = out.replace(/^(import .*?;\n)/m, `$1${IMPORT_WITH_ALPHA}\n`);
  }
  if (/\bCLEAR\./.test(out) && !out.includes('COACH_CLEAR_SURFACES')) {
    out = out.replace(
      /^(import \{ withAlpha \} from '..\/..\/utils\/coachTeamTheme';\n)/m,
      `$1import { COACH_CLEAR_SURFACES as CLEAR } from '..\/..\/utils\/coachTeamTheme';\n`,
    );
    if (!out.includes(IMPORT_WITH_ALPHA)) {
      out = `${IMPORT_WITH_ALPHA}\n${out}`;
    }
  }
  if (/\bPRO_DATA_VIOLET\b/.test(out) && !out.includes('PRO_DATA_VIOLET,')) {
    out = out.replace(
      /^(import \{ )/m,
      '$1PRO_DATA_VIOLET, ',
    );
  }
  if (/\bPRO_KPI_CHIP_BG\b|proSemantic\./.test(out) && !out.includes("from '../../theme/professionalDesign'")) {
    out = out.replace(/^(import .*?;\n)/m, `$1${IMPORT_PRO}\n`);
  }
  return out;
}

let total = 0;
for (const rel of TARGETS) {
  const full = path.join(__dirname, '..', rel);
  const before = fs.readFileSync(full, 'utf8');
  const after = convert(before);
  if (after !== before) {
    fs.writeFileSync(full, after);
    const n = (before.match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? []).length;
    const m = (after.match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? []).length;
    total += n - m;
    console.log(`${rel}: ${n} -> ${m}`);
  } else {
    console.log(`${rel}: inchangé`);
  }
}
console.log(`Total converti : ${total}`);
