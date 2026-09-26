import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const COMPONENT = 'components/coach/CoachStandingsTable.tsx';
const SQUAD_SCREEN = 'screens/coach/CoachSquadScreen.tsx';
const HOME_SCREEN = 'screens/coach/CoachHomeScreen.tsx';

describe('CoachStandingsTable — Design & FFF Data Integration', () => {
  it('respecte le budget strict de 0 couleur littérale (hex ou rgba)', () => {
    const source = read(COMPONENT);
    const matches = source.match(/#[0-9A-Fa-f]{6}\b|rgba?\(/g) ?? [];
    expect(matches).toEqual([]);
  });

  it('utilise tokens.surface pour le fond de carte sombre au lieu de CLEAR.elevated (#E5E5EA)', () => {
    const source = read(COMPONENT);
    expect(source).toContain('card: {');
    expect(source).toContain('backgroundColor: tokens.surface');
    expect(source).not.toMatch(/card:\s*\{[^}]*backgroundColor:\s*CLEAR\.elevated/);
  });

  it('gère le mode clair via cardLight avec CLEAR.surface et CLEAR.border', () => {
    const source = read(COMPONENT);
    expect(source).toContain('cardLight: {');
    expect(source).toContain('backgroundColor: CLEAR.surface');
    expect(source).toContain('borderColor: CLEAR.border');
  });

  it('masque les en-têtes de colonnes et la légende quand aucune donnée n’est présente', () => {
    const source = read(COMPONENT);
    // Le bloc emptyContainer remplace le tableau complet quand hasNoData est vrai
    expect(source).toContain('hasNoData ? (');
    expect(source).toContain('emptyContainer');
    expect(source).toContain('Aucun classement disponible');
    // Le ScrollView du tableau et footerLegend ne s'affichent que quand !hasNoData
    expect(source).toContain('footerLegend');
  });

  it('branche le chargement automatique des classements officiels FFF', () => {
    const source = read(COMPONENT);
    expect(source).toContain('frenchFootballStandingsService.getLeagueStandings');
    expect(source).toContain('teamsService.getById');
    expect(source).toContain('isClubStandingRow');
    expect(source).toContain('isCurrentTeam: isCurrent');
  });

  it('signale l’état hors-ligne du flux avec liveSyncDotOffline au lieu d’un point vert', () => {
    const source = read(COMPONENT);
    expect(source).toContain('liveSyncDotOffline');
    expect(source).toContain('hasNoData && styles.liveSyncDotOffline');
  });

  it('CoachSquadScreen transmet teamId et teamName au tableau de classement', () => {
    const source = read(SQUAD_SCREEN);
    expect(source).toContain('<CoachStandingsTable compact={false} teamId={teamId} teamName={teamName} />');
  });

  it('CoachHomeScreen transmet teamId et teamName au tableau de classement', () => {
    const source = read(HOME_SCREEN);
    expect(source).toContain('<CoachStandingsTable compact={false} teamId={teamId} teamName={teamName} />');
  });
});
