import {
  CROSS_CLUB_SEARCH_ROLES,
  resolvePlayerSearchScope,
  scopeAllowsCrossClub,
} from '../utils/playerSearchScope';
import type { UserRole } from '../models/User';

/**
 * CA-12 — la recherche de personnes ne sort jamais du périmètre autorisé.
 * Ces tests couvrent la règle par rôle, indépendamment de l'interface.
 */
describe('resolvePlayerSearchScope', () => {
  it('échoue fermé sans lecteur identifié', () => {
    const scope = resolvePlayerSearchScope({ viewerUid: null, role: 'club', clubId: 'c1' });
    expect(scope.mode).toBe('none');
    expect(scope.reason).toBe('no-viewer');
    expect(scopeAllowsCrossClub(scope)).toBe(false);
  });

  it('échoue fermé quand aucun club n’est résolvable', () => {
    const scope = resolvePlayerSearchScope({ viewerUid: 'me', role: 'player', clubId: null });
    expect(scope.mode).toBe('none');
    expect(scope.reason).toBe('no-club');
    expect(scopeAllowsCrossClub(scope)).toBe(false);
  });

  it.each<UserRole>(['player', 'coach', 'club', 'parent', 'organizer', 'physio', 'sponsor', 'supporter'])(
    'le rôle « %s » reste dans son club',
    (role) => {
      const scope = resolvePlayerSearchScope({ viewerUid: 'me', role, clubId: 'club-1' });
      expect(scope.mode).toBe('club');
      expect(scope.clubId).toBe('club-1');
      expect(scopeAllowsCrossClub(scope)).toBe(false);
    },
  );

  it.each<UserRole>([...CROSS_CLUB_SEARCH_ROLES])(
    'le rôle de découverte « %s » obtient le périmètre global',
    (role) => {
      const scope = resolvePlayerSearchScope({ viewerUid: 'me', role, clubId: 'club-1' });
      expect(scope.mode).toBe('global');
      expect(scope.reason).toBe('cross-club-role');
      expect(scopeAllowsCrossClub(scope)).toBe(true);
    },
  );

  it('l’administration plateforme obtient le périmètre global', () => {
    const byClaim = resolvePlayerSearchScope({
      viewerUid: 'me',
      role: 'player',
      clubId: 'club-1',
      isPlatformAdmin: true,
    });
    expect(byClaim.mode).toBe('global');
    expect(byClaim.reason).toBe('platform-admin');
  });

  it('ne confond pas un rôle élevé avec un droit inter-clubs sans club', () => {
    const scope = resolvePlayerSearchScope({ viewerUid: 'me', role: 'coach', clubId: null });
    expect(scope.mode).toBe('none');
    expect(scopeAllowsCrossClub(scope)).toBe(false);
  });

  it('le périmètre club porte l’identifiant du lecteur, jamais un autre', () => {
    const scope = resolvePlayerSearchScope({ viewerUid: 'me', role: 'club', clubId: 'club-1' });
    expect(scope.viewerUid).toBe('me');
  });
});
