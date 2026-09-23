import fs from 'fs';
import path from 'path';
import { amateurColorOverrides } from '../theme/prodayAmateurTheme';
import { parentColorOverrides } from '../theme/prodayParentTheme';
import { santeColorOverrides } from '../theme/prodaySanteTheme';
import { supporterColorOverrides } from '../theme/prodaySupporterTheme';
import { womanColorOverrides } from '../theme/prodayWomanTheme';
import {
  amateurMinorOverrides,
  proPlayerFemaleOverrides,
  proPlayerMaleOverrides,
} from '../theme/playerSegmentTheme';
import { PRODAY_MASTER } from '../theme/prodayBrand';
import { CARPOOL_SITE } from '../content/carpoolSite';
import { SPONSOR_THEME } from '../content/sponsorExperience';
import { colors } from '../theme/designTokens';
import { PLAYER_DARK } from '../theme/playerDarkPremium';
import { hommeGradients, flashAmbient } from '../theme/universeGradients';
import { CLUB_TOKENS } from '../features/club/theme/clubTokens';

/**
 * Socle Dark Premium partagé — DESIGN.md §8 : « les six pôles partagent le même
 * socle Dark Premium, avec leur propre accent ». Les identités de marque (rose
 * Woman, émeraude Club, magenta Sponsor…) sont des accents ; les surfaces, elles,
 * viennent de §2.1–§2.2 et ne doivent pas être redéfinies en gris neutres locaux.
 *
 * Ce test couvre les pôles alignés (covoiturage, joueur, admin, messages,
 * entraînement, inscription, vidéo, matchs, proPlayer, écrans racine) après
 * Coach (`COACH-T01`) et Club (`CLUB-T03`), plus les dégradés de thème.
 */

const SPEC = {
  backgroundAlt: '#0A0A0F',
  surface: '#121218',
  surfaceMuted: '#1A1A24',
  border: 'rgba(255, 255, 255, 0.08)',
};

const normalize = (value: string): string => value.replace(/\s+/g, '');

/** Pôles qui redéfinissent la palette complète — surfaces obligatoires. */
const FULL_POLE_OVERRIDES: Array<[string, Record<string, string>]> = [
  ['amateur', amateurColorOverrides as Record<string, string>],
  ['parent', parentColorOverrides as Record<string, string>],
  ['santé', santeColorOverrides as Record<string, string>],
  ['supporter', supporterColorOverrides as Record<string, string>],
  ['woman', womanColorOverrides as Record<string, string>],
];

/**
 * Pôles qui n'override que l'accent (le socle reste `designTokens`) :
 * les surfaces ne doivent pas être redéfinies à contresens.
 */
const ACCENT_ONLY_OVERRIDES: Array<[string, Record<string, string>]> = [
  ['proPlayer (H)', proPlayerMaleOverrides as Record<string, string>],
  ['proPlayer (F)', proPlayerFemaleOverrides as Record<string, string>],
];

/** Gris neutres hors spec §2.1 (anciennes surfaces Club et variantes). */
const OFF_SPEC_GREYS = [
  '#141418', '#14141A', '#181820', '#1C1C22', '#1E1E28', '#181C26',
  '#22222E', '#0E0E14', '#0A0A0A', '#141414', '#1A1A1A', '#121212', '#161616',
  '#222230', '#1C1C24', '#151C28', '#141822', '#060B14', '#12151C', '#1A1A20',
];

const TARGET_DIRS = [
  'components/carpool',
  'components/matchs',
  'components/video',
  'screens/player',
  'components/player',
  'screens/admin',
  'components/messages',
  'screens/joueur',
  'screens/training',
  'screens/proPlayer',
];

/** Écrans racine (styles statiques) alignés à l'étape 2. */
const TARGET_FILES = [
  'screens/AmateurClubScreen.tsx',
  'screens/TeamManagementScreen.tsx',
  'screens/MaintenanceBlockedScreen.tsx',
];

/**
 * Inscription : `accent: '#0A0A0A'` est une **encre sombre posée sur une puce
 * claire** (`accentSoft: '#E8F5E9'`), pas une surface d'interface.
 */
const INK_ON_LIGHT_CHIP = 'screens/signup/signupRoleExperience.ts';

/**
 * Feuille auth claire : `text: '#0A0A0A'` est une **encre sombre sur feuille
 * blanche** (`background: '#FFFFFF'`), pas un fond sombre hors spec.
 */
const INK_ON_LIGHT_SHEET = 'components/auth/authSheetPalette.ts';

function listSourceFiles(dir: string): string[] {
  const abs = path.join(__dirname, '..', dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listSourceFiles(rel));
    else if (/\.(t|j)sx?$/.test(entry.name)) out.push(rel);
  }
  return out;
}

describe('Socle surfaces par pôle — DESIGN.md §2.1/§2.2', () => {
  it.each(FULL_POLE_OVERRIDES)('le pôle %s expose les surfaces spec', (_pole, overrides) => {
    expect(overrides.surface).toBe(SPEC.surface);
    expect(overrides.surfaceMuted).toBe(SPEC.surfaceMuted);
    expect(overrides.backgroundAlt).toBe(SPEC.backgroundAlt);
    expect(normalize(overrides.border)).toBe(normalize(SPEC.border));
  });

  it.each(ACCENT_ONLY_OVERRIDES)(
    'le pôle %s ne redéfinit pas les surfaces à contresens',
    (_pole, overrides) => {
      for (const key of ['surface', 'surfaceMuted', 'backgroundAlt'] as const) {
        if (overrides[key] !== undefined) expect(overrides[key]).toBe(SPEC[key]);
      }
      if (overrides.border !== undefined) {
        expect(normalize(overrides.border)).toBe(normalize(SPEC.border));
      }
      // Ces pôles portent bien un accent propre (identité conservée).
      expect(overrides.accent).toBeTruthy();
    },
  );

  it('la planche de marque expose les surfaces spec', () => {
    expect(PRODAY_MASTER.surface).toBe(SPEC.surface);
    expect(PRODAY_MASTER.surfaceAlt).toBe(SPEC.backgroundAlt);
    expect(PRODAY_MASTER.black).toBe('#000000');
    expect(PRODAY_MASTER.white).toBe('#FFFFFF');
  });

  it('la planche de marque porte aussi les accents officiels (non modifiés)', () => {
    expect(PRODAY_MASTER.gold).toBe('#C5A059');
    expect(PRODAY_MASTER.goldBright).toBe('#E8B923');
  });

  it('les tokens covoiturage suivent §2.1 (plus de gris bleuté)', () => {
    expect(CARPOOL_SITE.surface).toBe(SPEC.surface);
    expect(CARPOOL_SITE.surfaceMuted).toBe(SPEC.surfaceMuted);
    expect(CARPOOL_SITE.asphaltRaised).toBe(SPEC.surface);
    expect(CARPOOL_SITE.lane).toBe('rgba(255, 255, 255, 0.14)');
    expect(CARPOOL_SITE.asphaltLane).toBe('rgba(255, 255, 255, 0.14)');
    expect(CARPOOL_SITE.wash[0]).toBe(SPEC.surface);
  });

  it('les tokens sponsor suivent §2.1', () => {
    expect(SPONSOR_THEME.surface).toBe(SPEC.surface);
    expect(SPONSOR_THEME.surfaceMuted).toBe(SPEC.surfaceMuted);
    expect(SPONSOR_THEME.surfaceElevated).toBe(SPEC.surfaceMuted);
    expect(normalize(SPONSOR_THEME.borderSubtle)).toBe(normalize(SPEC.border));
  });

  it('le socle partagé (designTokens) reste la référence', () => {
    expect(colors.surface).toBe(SPEC.surface);
    expect(colors.surfaceMuted).toBe(SPEC.surfaceMuted);
    expect(colors.backgroundAlt).toBe(SPEC.backgroundAlt);
    expect(colors.border).toBe(SPEC.border);
  });

  it('les dégradés de thème partent des surfaces spec', () => {
    expect(hommeGradients.card).toEqual(['#1A1A24', '#0A0A0F']);
    expect(hommeGradients.ambient[1]).toBe(SPEC.backgroundAlt);
    expect(flashAmbient[1]).toBe(SPEC.backgroundAlt);
    expect(amateurMinorOverrides.gradientEnd).toBe(SPEC.backgroundAlt);
    expect(PLAYER_DARK.cardGradient).toEqual(['#1A1A24', '#0A0A0F']);
    expect(PLAYER_DARK.shieldGradient[0]).toBe(SPEC.surfaceMuted);
    expect(PLAYER_DARK.shieldGradient[2]).toBe(SPEC.backgroundAlt);
  });

  it('les tokens Club portent la palette mesurée sur la charte de référence (D-011)', () => {
    // Le pôle Club a désormais une identité propre **mesurée au pixel** sur les
    // captures fournies : surfaces gris bleuté froid et accent or. C'est une
    // divergence assumée et documentée de DESIGN.md §2.1, pas une fuite.
    expect(CLUB_TOKENS.surface).toBe('#191E23');
    expect(CLUB_TOKENS.elevated).toBe('#262E33');
    expect(CLUB_TOKENS.accent).toBe('#F8D548');
    expect(CLUB_TOKENS.onAccent).toBe('#000000');
    // Le niveau 1 reste la valeur §2.1 du socle : la référence n'en montre pas
    // d'autre entre le canvas noir et les cartes.
    expect(CLUB_TOKENS.bgElevated).toBe(SPEC.backgroundAlt);
  });

  it('la palette mesurée du Club n’est pas confondue avec le socle neutre', () => {
    // Garde-fou : si quelqu'un « réaligne » le Club sur §2.1 par réflexe, ce
    // test rappelle que l'écart est volontaire et sourcé sur une mesure.
    expect(CLUB_TOKENS.surface).not.toBe(SPEC.surface);
    expect(CLUB_TOKENS.elevated).not.toBe(SPEC.surfaceMuted);
  });

  it('aucun gris hors spec ne subsiste dans les pôles alignés', () => {
    const offenders: string[] = [];
    const targets = [
      ...TARGET_DIRS.flatMap((dir) => listSourceFiles(dir)),
      ...TARGET_FILES.filter((file) => fs.existsSync(path.join(__dirname, '..', file))),
    ];
    for (const file of targets) {
      {
        const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
        src.split('\n').forEach((line, index) => {
          if (line.includes('stopColor')) return; // dégradés d'illustration SVG
          for (const grey of OFF_SPEC_GREYS) {
            const find = grey.slice(1).toLowerCase();
            if (line.toLowerCase().includes(find)) {
              // Un hex de 7-8 caractères ne compte que comme littéral complet.
              const re = new RegExp(find + '(?![0-9a-f])');
              if (re.test(line.toLowerCase())) offenders.push(`${file}:${index + 1} → ${grey}`);
            }
          }
        });
      }
    }
    expect(offenders).toEqual([]);
  });

  it("l'exception inscription reste une encre sur puce claire", () => {
    const src = fs.readFileSync(path.join(__dirname, '..', INK_ON_LIGHT_CHIP), 'utf8');
    expect(src).toContain("accentSoft: '#E8F5E9'");
    expect(src).toContain("accent: '#0A0A0A'");
  });

  it("l'exception feuille auth reste une encre sur fond blanc", () => {
    const src = fs.readFileSync(path.join(__dirname, '..', INK_ON_LIGHT_SHEET), 'utf8');
    expect(src).toContain("background: '#FFFFFF'");
    expect(src).toContain("text: '#0A0A0A'");
  });
});
