import {
  accessiblePreferredLeagues,
  buildLeagueCoverageMessage,
  looksLikeFreePlanCoverage,
  missingPreferredLeagues,
  parsePreferredLeagueIds,
  SPORTMONKS_FREE_PLAN_LEAGUE_IDS,
} from '../services/supporterFootball/sportmonksLeagues';

describe('sportmonksLeagues coverage', () => {
  it('détecte Ligue 1 (301) manquante sur Free Plan', () => {
    const missing = missingPreferredLeagues(SPORTMONKS_FREE_PLAN_LEAGUE_IDS, [301, 8, 271]);
    expect(missing).toEqual([301, 8]);
    expect(accessiblePreferredLeagues(SPORTMONKS_FREE_PLAN_LEAGUE_IDS, [301, 8, 271])).toEqual([
      271,
    ]);
    expect(looksLikeFreePlanCoverage([...SPORTMONKS_FREE_PLAN_LEAGUE_IDS, 513])).toBe(true);
  });

  it('message FR honnête sans inventer de Ligue 1', () => {
    const msg = buildLeagueCoverageMessage({
      availableNames: ['Superliga', 'Premiership'],
      missingPreferred: [301],
    });
    expect(msg).toMatch(/Ligue 1/);
    expect(msg).toMatch(/Superliga|Premiership/);
    expect(msg).toMatch(/FOOTBALL_DATA|football-data/i);
    expect(msg).not.toMatch(/PSG|faux|démo/i);
  });

  it('mentionne football-data quand le token FD est actif', () => {
    const msg = buildLeagueCoverageMessage({
      availableNames: ['Superliga'],
      missingPreferred: [301],
      footballDataEnabled: true,
    });
    expect(msg).toMatch(/football-data\.org/i);
  });

  it('parse EXPO_PUBLIC_SPORTMONKS_PREFERRED_LEAGUES', () => {
    expect(parsePreferredLeagueIds('301, 8 ;564')).toEqual([301, 8, 564]);
    expect(parsePreferredLeagueIds('')).toContain(301);
  });
});
