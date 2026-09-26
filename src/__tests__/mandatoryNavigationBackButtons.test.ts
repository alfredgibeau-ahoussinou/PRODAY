import { resolveClubFallbackNav, type ClubNavItemId } from '../features/club/navigation/clubNavConfig';
import { resolveParentFallbackNav, type ParentTabId } from '../features/parent/navigation/parentNavConfig';

describe('Mandatory In-App Navigation and Fallback Resolver Tests', () => {
  describe('Club Shell Navigation Fallbacks', () => {
    it('redirects match and training sub-views to calendar', () => {
      expect(resolveClubFallbackNav('matches')).toBe('calendar');
      expect(resolveClubFallbackNav('trainings')).toBe('calendar');
    });

    it('redirects roster and coaching sub-views to teams', () => {
      expect(resolveClubFallbackNav('players')).toBe('teams');
      expect(resolveClubFallbackNav('coaches')).toBe('teams');
    });

    it('redirects club tool views to plus tab', () => {
      expect(resolveClubFallbackNav('carpool')).toBe('plus');
      expect(resolveClubFallbackNav('assistant')).toBe('plus');
      expect(resolveClubFallbackNav('licenses')).toBe('plus');
      expect(resolveClubFallbackNav('finances')).toBe('plus');
      expect(resolveClubFallbackNav('sponsoring')).toBe('plus');
      expect(resolveClubFallbackNav('video')).toBe('plus');
    });

    it('falls back to today home for root and primary tabs', () => {
      expect(resolveClubFallbackNav('today')).toBe('today');
      expect(resolveClubFallbackNav('calendar')).toBe('today');
      expect(resolveClubFallbackNav('teams')).toBe('today');
      expect(resolveClubFallbackNav('plus')).toBe('today');
    });
  });

  describe('Parent Shell Navigation Fallbacks', () => {
    it('redirects secondary tabs to plus tab', () => {
      expect(resolveParentFallbackNav('messages')).toBe('plus');
      expect(resolveParentFallbackNav('agenda')).toBe('plus');
      expect(resolveParentFallbackNav('trajet')).toBe('plus');
    });

    it('redirects primary views and root to home tab', () => {
      expect(resolveParentFallbackNav('home')).toBe('home');
      expect(resolveParentFallbackNav('enfant')).toBe('home');
      expect(resolveParentFallbackNav('guide')).toBe('home');
      expect(resolveParentFallbackNav('reglages')).toBe('home');
      expect(resolveParentFallbackNav('plus')).toBe('home');
    });
  });

  describe('Navigation Stack Stability & Boundary Protection', () => {
    it('history stack handles push and pop without underflow', () => {
      const history: ClubNavItemId[] = [];
      const push = (id: ClubNavItemId) => {
        if (history[history.length - 1] !== id) {
          history.push(id);
          if (history.length > 30) history.shift();
        }
      };

      const pop = (current: ClubNavItemId): ClubNavItemId => {
        if (history.length > 0) {
          const prev = history.pop()!;
          if (prev !== current) return prev;
          if (history.length > 0) return history.pop()!;
        }
        return resolveClubFallbackNav(current);
      };

      // Navigate today -> teams -> players
      push('today');
      push('teams');
      push('players');
      expect(history).toEqual(['today', 'teams', 'players']);

      // Pop from players -> should return 'teams' (or top of stack)
      const back1 = pop('players');
      expect(back1).toBe('teams');

      // Pop from teams -> should return 'today'
      const back2 = pop('teams');
      expect(back2).toBe('today');

      // Pop from today with empty history -> should return fallback 'today'
      const back3 = pop('today');
      expect(back3).toBe('today');
    });

    it('deduplicates consecutive identical navigation entries', () => {
      const history: ParentTabId[] = [];
      const push = (id: ParentTabId) => {
        if (history[history.length - 1] !== id) {
          history.push(id);
        }
      };

      push('home');
      push('home');
      push('messages');
      push('messages');
      push('agenda');

      expect(history).toEqual(['home', 'messages', 'agenda']);
    });
  });

  describe('Overlay & Sheet Close Controls', () => {
    it('verifies RosterProfileSheet source code integrates explicit close button', () => {
      const fs = require('fs');
      const path = require('path');
      const rosterSource = fs.readFileSync(
        path.resolve(__dirname, '../features/roster/rosterDirectory.tsx'),
        'utf8'
      );
      expect(rosterSource).toContain('accessibilityLabel="Fermer la fiche joueur"');
      expect(rosterSource).toContain('sheetCloseBtn');
      expect(rosterSource).toContain('width: 44');
      expect(rosterSource).toContain('height: 44');
    });
  });
});
