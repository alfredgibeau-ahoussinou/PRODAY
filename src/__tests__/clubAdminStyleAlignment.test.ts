import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Garde-fou d'alignement du pôle Club/Admin sur le système de design partagé.
 *
 * Ces fichiers ont été convertis : leurs couleurs viennent des jetons du pôle, plus d'une
 * palette locale. Le test empêche une régression silencieuse — une couleur codée en dur
 * réintroduite dans un écran converti ne ferait échouer aucun autre contrôle, elle se verrait
 * seulement à l'écran, sur un pôle qu'on ne peut pas toujours ouvrir.
 *
 * Il ne prétend pas couvrir tout le pôle : la liste s'allonge au fur et à mesure des
 * conversions. Les fichiers encore en attente sont suivis dans `docs/proday-loop-state.md`.
 */

const CONVERTED = [
  'src/screens/club/ClubTeamsScreen.tsx',
  'src/features/club/ui/ClubCommunicationHub.tsx',
  /** Annuaire des joueurs : passé au module partagé avec le pôle Coach. */
  'src/screens/club/ClubPlayersScreen.tsx',
  'src/features/club/ui/ClubRosterChrome.tsx',
  'src/features/club/ui/ClubPlayersChrome.tsx',
  'src/features/club/ui/clubPlayersModel.ts',
  /** Le module partagé lui-même : aucune couleur de pôle n'y entre. */
  'src/features/roster/rosterDirectory.tsx',
];

/** Couleur littérale : hex à six chiffres ou rgba()/rgb() explicite. */
const HARDCODED_COLOR = /#[0-9A-Fa-f]{6}\b|rgba?\(/;

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('alignement visuel du pôle Club/Admin', () => {
  it.each(CONVERTED)('%s n’a plus aucune couleur en dur', (file) => {
    const offenders = read(file)
      .split('\n')
      .map((line, i) => ({ line: line.trim(), n: i + 1 }))
      .filter(({ line }) => HARDCODED_COLOR.test(line));

    expect(offenders).toEqual([]);
  });

  it('les styles reçoivent les jetons du thème actif', () => {
    const src = read('src/screens/club/ClubTeamsScreen.tsx');
    // `_tokens` était le signe du défaut d’origine : le thème reçu puis ignoré.
    expect(src).not.toMatch(/_tokens/);
    expect(src).toMatch(/createStyles = \(tokens: ClubThemeTokens\)/);
  });

  it('le canvas est peint par le shell, pas par l’écran', () => {
    const src = read('src/screens/club/ClubTeamsScreen.tsx');
    expect(src).toMatch(/root: \{ flex: 1, backgroundColor: 'transparent' \}/);
  });

  it('la palette du pôle n’est pas dupliquée localement', () => {
    // Le bleu d’interface et l’ambre en dur contournaient les jetons sémantiques.
    for (const file of CONVERTED) {
      const src = read(file);
      expect(src).not.toMatch(/#3B82F6/i);
      expect(src).not.toMatch(/#F59E0B/i);
      expect(src).not.toMatch(/#09090D/i);
    }
  });
});
