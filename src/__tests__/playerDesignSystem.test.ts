import fs from 'fs';
import path from 'path';
import {
  playerForm,
  playerType,
  playerResponseTone,
  playerColors,
} from '../theme/playerDesignSystem';
import { clubForm } from '../features/club/theme/clubDesignSystem';
import { APPLE_TYPOGRAPHY } from '../theme/appleTypography';
import { buildJoueurPlusMenuItems } from '../content/joueurPlusMenu';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

describe('playerDesignSystem', () => {
  it('ne contient aucune couleur littérale (surfaces via PLAYER_DARK, statuts via CLUB_TOKENS)', () => {
    const source = read('theme/playerDesignSystem.ts');
    const literals = source.match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? [];
    expect(literals).toEqual([]);
  });

  it('réexporte les surfaces du socle sombre joueur sans les redéfinir', () => {
    expect(playerColors).toBe(
      require('../theme/playerDarkPremium').PLAYER_DARK,
    );
  });

  it('impose la pile Apple system à toute la typographie du pôle', () => {
    expect(playerType.title).toBe(APPLE_TYPOGRAPHY.title1);
    expect(playerType.section).toBe(APPLE_TYPOGRAPHY.title2);
    expect(playerType.stat).toBe(APPLE_TYPOGRAPHY.title1);
    expect(playerType.nav).toBe(APPLE_TYPOGRAPHY.footnote);
  });

  it('reprend la forme Apple Fitness avec la parité de mesure du socle professionnel', () => {
    /** Mêmes cibles que Club/Coach : puces, actions, lignes, champs, dock. */
    expect(playerForm.chipHeight).toBe(clubForm.chipHeight);
    expect(playerForm.chipRadius).toBe(clubForm.chipRadius);
    expect(playerForm.actionMinHeight).toBe(clubForm.actionMinHeight);
    expect(playerForm.actionRadius).toBe(clubForm.actionRadius);
    expect(playerForm.rowMinHeight).toBe(clubForm.rowMinHeight);
    expect(playerForm.dockLabelSize).toBe(clubForm.dockLabelSize);
    /** Signature Apple Fitness propre au pôle : grandes cartes groupées. */
    expect(playerForm.cardRadius).toBeGreaterThan(clubForm.groupRadius - 1);
    expect(playerForm.cardRadius).toBeGreaterThanOrEqual(20);
  });

  it('dérive les tons de réponse convocation du registre sémantique partagé', () => {
    const tokens = require('../features/club/theme/clubTokens').CLUB_TOKENS;
    expect(playerResponseTone.present.color).toBe(tokens.success);
    expect(playerResponseTone.pending.color).toBe(tokens.warning);
    expect(playerResponseTone.absent.color).toBe(tokens.danger);
  });

  it('sélectionne la puce au contour, jamais en aplat', () => {
    const tokens = {
      surface: '#121218',
      surfaceRaised: '#1A1A24',
      border: 'rgba(255,255,255,0.08)',
      accent: '#00E676',
      text: '#FFFFFF',
      textMuted: '#8B8B9A',
    };
    const active = require('../theme/playerDesignSystem').playerChip(tokens, true);
    expect(active.backgroundColor).toBe('transparent');
    expect(active.borderColor).toBe(tokens.accent);
    const idle = require('../theme/playerDesignSystem').playerChip(tokens, false);
    expect(idle.backgroundColor).toBe(tokens.surfaceRaised);
  });
});

describe('dock et menu du pôle Joueur (refonte Player §4)', () => {
  const VISIBLE_TABS = [
    'home',
    'matchs',
    'feed',
    'profil',
    'plus',
    'messages',
    'covoiturage',
    'progression',
  ] as const;

  it('garde la Saison ouverte depuis le Menu après sa sortie du dock', () => {
    const items = buildJoueurPlusMenuItems({
      ageGroup: 'adult',
      visibleTabs: [...VISIBLE_TABS],
    });
    const progression = items.find((i) => i.id === 'progression');
    expect(progression).toBeDefined();
    expect(progression?.action).toEqual({ kind: 'tab', tab: 'progression' });
    expect(progression?.label).toBe('Ma Saison');
  });
});
