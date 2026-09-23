import { buildClubTeamCardMeta, summarizeClubTeamsStructure } from '../features/club/ui/clubTeamsModel';
import { resolveClubCommSubtitle } from '../features/club/ui/clubCommunicationModel';
import { getMessagesThreadFilters } from '../i18n/localizedChapters';

describe('Master Release Redesign Unit Tests', () => {
  describe('Screen 1: Club Teams & Card Structure', () => {
    it('generates clean licensing badge text for singular and plural counts without emojis', () => {
      const single = buildClubTeamCardMeta({
        teamId: 't1',
        name: 'U17',
        category: 'U17',
        genderLabel: 'Garçons',
        licensedCount: 0,
        coachNames: [],
        isDefault: false,
      });
      expect(single.metaSecondary).toBe('0 licencié');
      expect(single.hasCoach).toBe(false);
      expect(single.coachesLabel).toBe('Sans coach');

      const plural = buildClubTeamCardMeta({
        teamId: 't2',
        name: 'Vétérans Filles',
        category: 'Vétérans',
        genderLabel: 'Filles',
        licensedCount: 9,
        coachNames: ['Lucas'],
        isDefault: false,
      });
      expect(plural.metaSecondary).toBe('9 licenciés');
      expect(plural.hasCoach).toBe(true);
      expect(plural.coachesLabel).toBe('Lucas');
    });

    it('summarizes club structure KPIs accurately for the Obsidian audit card', () => {
      const summary = summarizeClubTeamsStructure([
        {
          teamId: 't1',
          name: 'U17',
          category: 'U17',
          genderLabel: 'Garçons',
          licensedCount: 0,
          coachNames: [],
          isDefault: false,
        },
        {
          teamId: 't2',
          name: 'Vétérans Filles',
          category: 'Vétérans',
          genderLabel: 'Filles',
          licensedCount: 9,
          coachNames: ['Lucas'],
          isDefault: false,
        },
      ]);
      expect(summary.teamCount).toBe(2);
      expect(summary.licensedTotal).toBe(9);
      expect(summary.withoutCoach).toBe(1);
    });
  });

  describe('Screen 2: Communication Hub Subtitle and Channels', () => {
    it('computes elegant, non-redundant subtitle for communication header', () => {
      const sub = resolveClubCommSubtitle({
        pendingMemberships: 1,
        unreadNotifications: 2,
        unreadMessages: 0,
      });
      expect(sub).toContain('2 alertes');
      expect(sub).toContain('1 adhésion');
    });
  });

  describe('Screen 3: Messages Inbox Filters', () => {
    it('expose les catégories par rôle demandées, sans surcharger le rail', () => {
      const t = ((_key: string, _params?: any, def?: string) => def || _key) as any;
      const filters = getMessagesThreadFilters(t);
      const ids = filters.map((f) => f.id);

      // Catégories demandées : Tous, Joueurs, Parents, Coachs, Club / Staff.
      expect(ids).toContain('all');
      expect(ids).toContain('players');
      expect(ids).toContain('parents');
      expect(ids).toContain('coaches');
      expect(ids).toContain('club_staff');

      // La nature (direct / groupe / annonce) n'est plus un filtre : elle est portée par la
      // ligne elle-même, ce qui évite le rail à neuf entrées constaté auparavant.
      expect(ids).not.toContain('direct');
      expect(ids).not.toContain('groups');
      expect(ids).not.toContain('announcements');

      // Rail compact : au plus six entrées.
      expect(filters.length).toBeLessThanOrEqual(6);
    });
  });
});
