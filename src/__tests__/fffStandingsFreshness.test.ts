/**
 * Fraîcheur des classements FFF — invariant : une donnée ancienne n'est jamais
 * présentée comme fraîchement synchronisée.
 */
import {
  FFF_STALE_AFTER_MS,
  buildCertifiedSeedLeague,
  describeStandingsFreshness,
  type FrenchLeagueData,
} from '../services/frenchFootballStandings.service';

const NOW = new Date('2026-09-15T12:00:00.000Z');

function league(overrides: Partial<FrenchLeagueData> = {}): FrenchLeagueData {
  return {
    id: 'r1_idf_b',
    name: 'Régional 1 IDF · Poule B',
    category: 'regional',
    divisionLabel: '2026-2027 · Régional 1',
    season: '2026-2027',
    standings: [],
    scorers: [],
    syncStatus: 'live',
    lastSyncAt: new Date(NOW.getTime() - 5 * 60 * 1000).toISOString(),
    syncHealth: 'ok',
    ...overrides,
  };
}

describe('describeStandingsFreshness', () => {
  it('affiche « aucune donnée » quand le classement est vide (jamais un faux frais)', () => {
    const fresh = describeStandingsFreshness(
      buildCertifiedSeedLeague('r1_idf_b', '2026-2027'),
      NOW,
    );
    expect(fresh.health).toBe('unavailable');
    expect(fresh.isStale).toBe(true);
    expect(fresh.ageLabel).toBeNull();
    expect(fresh.label).toMatch(/Aucune donnée/);
  });

  it('signale un classement synchronisé et son ancienneté réelle', () => {
    const fresh = describeStandingsFreshness(league(), NOW);
    expect(fresh.health).toBe('ok');
    expect(fresh.isStale).toBe(false);
    expect(fresh.ageLabel).toBe('il y a 5 min');
    expect(fresh.detail).toContain('il y a 5 min');
  });

  it('bascule en obsolète au-delà de deux cadences de 3 h', () => {
    const old = league({
      lastSyncAt: new Date(NOW.getTime() - FFF_STALE_AFTER_MS - 60_000).toISOString(),
    });
    const freshness = describeStandingsFreshness(old, NOW);
    expect(freshness.health).toBe('stale');
    expect(freshness.isStale).toBe(true);
    expect(freshness.label).toMatch(/obsolète/);
    // L'ancienneté réelle est affichée, pas un « à jour ».
    expect(freshness.detail).toMatch(/il y a \d+ h/);
  });

  it('conserve le message d’erreur serveur sur un snapshot obsolète', () => {
    const freshness = describeStandingsFreshness(
      league({
        syncHealth: 'stale',
        lastError: 'API-Football 429 (quota dépassé)',
        lastSyncAt: new Date(NOW.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        lastAttemptAt: NOW.toISOString(),
      }),
      NOW,
    );
    expect(freshness.health).toBe('stale');
    expect(freshness.detail).toContain('API-Football 429');
    expect(freshness.detail).toContain('il y a 4 h');
  });

  it('expose une couleur d’alerte en erreur', () => {
    const freshness = describeStandingsFreshness(league({ syncHealth: 'error' }), NOW);
    expect(freshness.isStale).toBe(true);
    expect(freshness.color).toBe('#EF4444');
  });

  it('reste prudent si la date de synchronisation est inconnue', () => {
    const freshness = describeStandingsFreshness(league({ lastSyncAt: undefined }), NOW);
    expect(freshness.health).toBe('unavailable');
    expect(freshness.ageLabel).toBeNull();
  });
});
