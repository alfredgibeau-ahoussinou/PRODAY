import fs from 'fs';
import path from 'path';
import { playerType } from '../theme/playerDesignSystem';
import { APPLE_TYPOGRAPHY } from '../theme/appleTypography';

/**
 * Garde-fou visuel du pôle Joueur (refonte Player).
 *
 * Même mécanique que les plafonds Coach et Club : les écrans convertis au socle
 * partagé `playerDesignSystem` doivent rester à **zéro couleur littérale**, et le
 * dock doit rester à 4 destinations. Un fichier converti ne peut qu'être
 * rouvert pour correction via les jetons — jamais en réintroduisant un hex.
 */

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const ZERO_LITERAL_FILES = [
  'screens/player/PlayerHomeScreen.tsx',
  'screens/player/PlayerStatsScreen.tsx',
  'screens/player/PlayerPortalScreen.tsx',
  'screens/player/PlayerWellnessScreen.tsx',
  'screens/player/PlayerTacticalView.tsx',
  'components/navigation/PlayerDockTabBar.tsx',
  'components/player/PlayerProfileHero.tsx',
  'components/player/PlayerPageGuideBanner.tsx',
  'components/player/PlayerStoryExportModal.tsx',
  'components/player/PlayerCertifiedPassportModal.tsx',
  'components/joueur/PlayerCoachAiChat.tsx',
  'theme/playerDesignSystem.ts',
];

/**
 * Surfaces **partagées entre pôles** (Joueur, Coach, Club, Parent, Supporter) :
 * elles ne peuvent pas porter la direction visuelle Joueur sans l'imposer aux
 * autres pôles. Leur plafond porte donc sur les **jetons neutres** de
 * `designTokens` / `PLAYER_DARK`, jamais sur les recettes `player*`.
 */
const POLE_NEUTRAL_ZERO_LITERAL_FILES = [
  'screens/CarpoolScreen.tsx',
  'screens/ChatScreen.tsx',
  'screens/NotificationsScreen.tsx',
  'screens/EditProfileScreen.tsx',
];

describe('Socle visuel du pôle Joueur', () => {
  it('garde les écrans convertis à zéro couleur littérale', () => {
    for (const file of ZERO_LITERAL_FILES) {
      const found = read(file).match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? [];
      expect({ file, found: found.length }).toEqual({ file, found: 0 });
    }
  });

  it('garde les surfaces inter-pôles à zéro couleur littérale (jetons neutres)', () => {
    for (const file of POLE_NEUTRAL_ZERO_LITERAL_FILES) {
      const found = read(file).match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? [];
      expect({ file, found: found.length }).toEqual({ file, found: 0 });
    }
  });

  it('pose la typographie du dock sur la pile Apple system du socle', () => {
    const dock = read('components/navigation/PlayerDockTabBar.tsx');
    expect(dock).toContain('playerType.nav');
    expect(dock).toContain('playerForm.dockLabelSize');
    /** État actif lu sur la couleur : pas d'encart, pas de soulignement. */
    expect(dock).not.toContain('activeLine');
    expect(dock).not.toContain('backgroundColor: playerColors.accent');
  });

  it('impose les 4 destinations du dock dans l’ordre demandé', () => {
    const dock = read('components/navigation/PlayerDockTabBar.tsx');
    const order = dock.indexOf('home') < dock.indexOf('matchs')
      && dock.indexOf('matchs') < (dock.indexOf("'profil'") >= 0 ? dock.indexOf("'profil'") : dock.indexOf('feed'))
      && dock.indexOf('plus') > dock.indexOf('matchs');
    expect(order).toBe(true);
    expect(dock).toContain("'Accueil'");
    expect(dock).toContain("'Calendrier'");
    expect(dock).toContain("'Ma Carte'");
    expect(dock).toContain("'Menu'");
  });

  it('répond aux mêmes cibles de forme que le socle professionnel', () => {
    const ds = read('theme/playerDesignSystem.ts');
    expect(ds).toContain('chipHeight: 44');
    expect(ds).toContain('rowMinHeight: 62');
    /** Typographie Apple system : chaque variante EST une référence APPLE_TYPOGRAPHY. */
    const appleValues = new Set<Object>(Object.values(APPLE_TYPOGRAPHY));
    for (const [variant, style] of Object.entries(playerType)) {
      expect({ variant, isAppleReference: appleValues.has(style as Object) }).toEqual({
        variant,
        isAppleReference: true,
      });
    }
    /** La sélection de puce reste au contour — seul l'action primaire porte un aplat. */
    const chipFn = ds.split('export function playerChip')[1]?.split('export function')[0] ?? '';
    expect(chipFn).toContain("backgroundColor: 'transparent'");
    expect(chipFn).not.toContain('backgroundColor: tokens.accent');
    expect(chipFn).toContain('borderColor: tokens.accent');

  });
});
