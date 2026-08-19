import { buildJoueurPlusMenuItems } from '../content/joueurPlusMenu';

describe('joueurPlusMenu', () => {
  it('expose les raccourcis principaux pour un joueur amateur', () => {
    const items = buildJoueurPlusMenuItems({
      ageGroup: 'adult',
      visibleTabs: [
        'home',
        'matchs',
        'feed',
        'profil',
        'plus',
        'messages',
        'recrutement',
        'reels',
        'covoiturage',
        'shop',
        'progression',
      ],
      unreadCount: 3,
    });

    const ids = items.map((i) => i.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'messages',
        'recrutement',
        'train',
        'reels',
        'covoiturage',
        'shop',
        'progression',
        'settings',
        'coach_ia',
      ]),
    );
    expect(ids).not.toContain('famille');

    const messages = items.find((i) => i.id === 'messages');
    expect(messages?.badge).toBe(3);
    expect(messages?.action).toEqual({ kind: 'tab', tab: 'messages' });
  });

  it('affiche Famille pour un mineur', () => {
    const items = buildJoueurPlusMenuItems({
      ageGroup: 'youth',
      visibleTabs: ['home', 'profil', 'plus', 'famille', 'messages'],
      isMinor: true,
    });
    expect(items.some((i) => i.id === 'famille')).toBe(true);
  });
});
