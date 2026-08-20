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
        'coach_humain',
      ]),
    );
    expect(ids).not.toContain('famille');

    const coachHumain = items.find((i) => i.id === 'coach_humain');
    expect(coachHumain?.label).toBe('Coach humain');
    expect(coachHumain?.action).toEqual({ kind: 'dashboard', view: 'train_coach' });

    const messages = items.find((i) => i.id === 'messages');
    expect(messages?.badge).toBe(3);
    expect(messages?.action).toEqual({ kind: 'tab', tab: 'messages' });

    const reels = items.find((i) => i.id === 'reels');
    expect(reels?.unavailable).toBe(true);
    const shop = items.find((i) => i.id === 'shop');
    expect(shop?.unavailable).toBe(true);
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
