import fs from 'fs';
import path from 'path';
import { CLUB_TOKENS } from '../features/club/theme/clubTokens';
import { buildClubThemeTokens } from '../utils/clubDynamicTheme';
import { CLUB_SITE } from '../content/clubPageIdentity';

/**
 * Chrome Pôle Club — surfaces Dark Premium (DESIGN.md §2.1–§2.3).
 *
 * Lève l'écart CL-05 de la checklist visuelle : le pôle Club portait ses propres
 * gris (`surface #141418`, `elevated #181820`, `raised #22222E`) hors spec.
 * Les tokens Club sont désormais alignés et le chrome doit les consommer.
 */

const OFF_SPEC_GREYS = [
  '#141418', // ancienne surface Club
  '#181820', // ancien elevated Club
  '#22222E', // ancien raised Club (valeur du pôle Club, hors §2.1)
  '#14141A',
  '#121216',
  '#1C1C22',
  '#1C1C24',
  '#16161C',
  '#16161E',
  '#18181B',
  '#1E1E28',
  '#1F1F27',
  '#0F0F14',
  '#101014',
  '#0A0A0A',
  '#141414',
  '#181C26', // surface bleutée des formulaires/modales Club
  '#12151C', // surface des modales/bulles Club
  '#141822', // barre de statut synchro Club
  '#0E0E14', // remplissages internes (KPI, champs)
  '#222230', // bordure hexadécimale hors §2.2
  '#060B14',
  '#070B14',
  '#151C28',
];

/**
 * Le stade 3D d'une carte équipe est une **illustration SVG** : ses arrêts de
 * dégradé (`stopColor=`) peignent le ciel et les tribunes, pas une surface d'UI.
 */
function isIllustrationStop(line: string): boolean {
  return line.includes('stopColor');
}

const CLUB_SOURCE_DIRS = ['features/club', 'screens/club', 'components/club'];

/**
 * Sélecteur de charte graphique du club : ces hex sont des **couleurs de marque
 * choisissables par le club** (contenu), pas des surfaces d'interface.
 */
const BRAND_PRESET_FILE = 'features/club/ui/ClubBrandColorsPanel.tsx';

function listSourceFiles(dir: string): string[] {
  const abs = path.join(__dirname, '..', dir);
  if (!fs.existsSync(abs)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(rel));
    } else if (/\.(t|j)sx?$/.test(entry.name)) {
      out.push(rel);
    }
  }
  return out;
}

describe('Chrome Pôle Club — palette mesurée sur la référence', () => {
  it('expose la palette relevée sur les captures (fond, surfaces, accent, encre sur accent)', () => {
    // Valeurs relevées au pixel sur les quatre captures du 15/09/2026 (D-011).
    expect(CLUB_TOKENS.bg).toBe('#000000');
    expect(CLUB_TOKENS.surface).toBe('#191E23');
    expect(CLUB_TOKENS.elevated).toBe('#262E33');
    expect(CLUB_TOKENS.raised).toBe('#262E33');
    expect(CLUB_TOKENS.accent).toBe('#F8D548');
    // Le contenu posé sur l'or est NOIR dans la référence : du blanc sur cet or
    // serait illisible.
    expect(CLUB_TOKENS.onAccent).toBe('#000000');
  });

  it('garde les bordures alpha et les jetons sémantiques hors palette d’identité', () => {
    expect(CLUB_TOKENS.border).toBe('rgba(255, 255, 255, 0.08)');
    expect(CLUB_TOKENS.borderStrong).toBe('rgba(255, 255, 255, 0.14)');
    expect(CLUB_TOKENS.foreground).toBe('#FFFFFF');
    expect(CLUB_TOKENS.muted).toBe('#8B8B9A');
    expect(CLUB_TOKENS.faint).toBe('rgba(139, 139, 154, 0.72)');
    // Un blanc à 0,08 posé sur #191E23 donne #2B3035, soit exactement le ton de
    // bord mesuré dans la référence (entre #262E33 et #373D42).
    expect(CLUB_TOKENS.success).toBe('#10B981');
    expect(CLUB_TOKENS.warning).toBe('#F59E0B');
    expect(CLUB_TOKENS.danger).toBe('#EF4444');
    expect(CLUB_TOKENS.pitch).toBe('#059669');
  });

  it('ne laisse pas fuiter l’identité dans les jetons sémantiques', () => {
    // « conforme », « en retard », « payé » restent vert/rouge.
    expect(CLUB_TOKENS.success).not.toBe(CLUB_TOKENS.accent);
    expect(CLUB_TOKENS.pitch).not.toBe(CLUB_TOKENS.accent);
    // Le vert « terrain » garde une déclinaison pairée à `pitch`, pas à l'or.
    expect(CLUB_TOKENS.pitchSoft).toBe('rgba(5, 150, 105, 0.28)');
  });

  it('propage ces surfaces via buildClubThemeTokens, quel que soit le branding club', () => {
    for (const brand of [
      null,
      { primary: '#E53935', secondary: '#FFFFFF', onAccent: '#FFFFFF' },
      { primary: '#18181B', secondary: '#F8FAFC', onAccent: '#FFFFFF' },
    ]) {
      const tokens = buildClubThemeTokens(brand);
      expect(tokens.isLight).toBe(false);
      expect(tokens.bg).toBe('#000000');
      expect(tokens.surface).toBe('#191E23');
      expect(tokens.elevated).toBe('#262E33');
      expect(tokens.raised).toBe('#262E33');
      expect(tokens.border).toBe('rgba(255, 255, 255, 0.08)');
    }
  });

  it('expose un chrome CLUB_SITE aligné (identité de page)', () => {
    expect(CLUB_SITE.bg).toBe('#000000');
    expect(CLUB_SITE.surface).toBe('#191E23');
    expect(CLUB_SITE.elevated).toBe('#262E33');
    expect(CLUB_SITE.accent).toBe('#F8D548');
    expect(CLUB_SITE.border).toBe('rgba(255, 255, 255, 0.08)');
    expect(CLUB_SITE.foreground).toBe('#FFFFFF');
    expect(CLUB_SITE.muted).toBe('#8B8B9A');
  });

  it('ne réintroduit aucun gris hors spec dans le chrome Club', () => {
    const offenders: string[] = [];
    for (const dir of CLUB_SOURCE_DIRS) {
      for (const file of listSourceFiles(dir)) {
        if (file === BRAND_PRESET_FILE) continue; // couleurs de marque du club
        const src = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
        for (const [index, line] of src.split('\n').entries()) {
          if (isIllustrationStop(line)) continue; // dégradés d'illustration
          for (const grey of OFF_SPEC_GREYS) {
            if (line.toLowerCase().includes(grey.toLowerCase())) {
              offenders.push(`${file}:${index + 1} → ${grey}`);
            }
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("l'exclusion du sélecteur de charte est bien du contenu de marque", () => {
    const src = fs.readFileSync(path.join(__dirname, '..', BRAND_PRESET_FILE), 'utf8');
    expect(src).toContain('CLUB_PRESET_DUOS');
  });

  it("l'exception du stade 3D ne concerne que des arrêts de dégradé SVG", () => {
    const stadium = fs.readFileSync(
      path.join(__dirname, '../components/club/ClubTeamStadiumPanel.tsx'),
      'utf8',
    );
    const navyLines = stadium
      .split('\n')
      .filter((line) => /#(060B14|151C28)/i.test(line));
    expect(navyLines.length).toBeGreaterThan(0);
    expect(navyLines.every((line) => isIllustrationStop(line))).toBe(true);
  });

  it('route les surfaces Club par les tokens au lieu de littéraux locaux', () => {
    const teams = fs.readFileSync(
      path.join(__dirname, '../screens/club/ClubTeamsScreen.tsx'),
      'utf8',
    );
    // Le thème **actif** est désormais la seule source : plus aucune palette statique locale.
    expect(teams).toContain('backgroundColor: tokens.surface');
    expect(teams).not.toContain('CLUB_TOKENS');
    expect(teams).not.toContain("backgroundColor: '#141418'");

    const hub = fs.readFileSync(
      path.join(__dirname, '../features/club/ui/ClubCommunicationHub.tsx'),
      'utf8',
    );
    expect(hub).toContain('backgroundColor: tokens.elevated');

    const menu = fs.readFileSync(
      path.join(__dirname, '../features/club/shell/ClubMenuPane.tsx'),
      'utf8',
    );
    expect(menu).toContain('surface: tokens.surface');
  });

  it('le dock Club suit §2.1/§2.2 et ne dépend plus des tokens du pôle Joueur', () => {
    const tabBar = fs.readFileSync(
      path.join(__dirname, '../features/club/shell/ClubTabBar.tsx'),
      'utf8',
    );
    // Surface mesurée #191E23 = rgb(25,30,35) translucide + bordure borderStrong.
    expect(tabBar).toContain("'rgba(25, 30, 35, 0.88)'");
    expect(tabBar).toContain('tokens.borderStrong');
    // Plus aucune valeur du chrome Joueur dans le dock Club.
    expect(tabBar).not.toContain('PLAYER_DARK');
    expect(tabBar).not.toContain('rgba(14, 16, 24, 0.72)');
  });

  it('le dock expose exactement 4 destinations avec les labels du brief', () => {
    const config = fs.readFileSync(
      path.join(__dirname, '../features/club/navigation/clubNavConfig.ts'),
      'utf8',
    );
    expect(config).toContain("CLUB_PRIMARY_NAV_IDS: ClubNavItemId[] = [\n  'today',\n  'calendar',\n  'teams',\n  'plus',\n]");
    expect(config).toContain("label: 'Menu'");
    // Matchs et Club ne sont pas perdus : ils restent dans le Menu.
    expect(config).toContain("'matches'");
    expect(config).toContain("ids: ['club', 'pack', 'licenses', 'sponsoring', 'permissions']");
  });
});
