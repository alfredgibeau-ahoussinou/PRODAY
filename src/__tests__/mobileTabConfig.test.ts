import { getMobileRailLayout } from '../navigation/mobileTabConfig';

describe('mobileTabConfig', () => {
  it('place Accueil + Matchs à gauche et Reels au centre pour Homme', () => {
    const rail = getMobileRailLayout('homme', 'player');
    expect(rail.left).toEqual(['home', 'matchs']);
    expect(rail.center).toBe('reels');
    expect(rail.right).toContain('messages');
    expect(rail.right).toContain('profil');
    expect(rail.overflow).toContain('recrutement');
    expect(rail.overflow).not.toContain('matchs');
    expect(rail.overflow).not.toContain('profil');
  });

  it('priorise Matchs pour Supporter', () => {
    const rail = getMobileRailLayout('supporter', 'supporter');
    expect(rail.left).toEqual(['matchs', 'feed']);
    expect(rail.center).toBe('reels');
    expect(rail.overflow).not.toContain('matchs');
    expect(rail.overflow).toContain('shop');
    expect(rail.right).toContain('messages');
  });

  it('remonte Profil sur le rail à côté de Messages', () => {
    const rail = getMobileRailLayout('pro', 'sponsor');
    expect(rail.left).toEqual(['home', 'matchs']);
    expect(rail.center).toBeNull();
    expect(rail.right).toEqual(['messages', 'profil']);
    expect(rail.overflow).toEqual([]);
  });

  it('garde Profil accessible sur le rail pour Homme', () => {
    const rail = getMobileRailLayout('homme', 'player');
    expect(rail.right).toContain('profil');
    expect(rail.overflow).not.toContain('profil');
  });

  it('gère Santé sans Reels', () => {
    const rail = getMobileRailLayout('sante', 'physio');
    expect(rail.left).toEqual(['home', 'matchs']);
    expect(rail.center).toBeNull();
    expect(rail.right).toContain('messages');
  });

  it('priorise Structure et Recrutement pour Club Pro', () => {
    const rail = getMobileRailLayout('pro', 'club');
    expect(rail.left).toEqual(['home', 'recrutement']);
    expect(rail.right).toContain('messages');
    expect(rail.right).toContain('profil');
  });

  it('priorise Carrière et Opportunités pour Pro joueur', () => {
    const rail = getMobileRailLayout('pro', 'player');
    expect(rail.left).toEqual(['home', 'recrutement']);
    expect(rail.center).toBe('reels');
    expect(rail.right).toEqual(['profil']);
    expect(rail.overflow).toContain('matchs');
  });
});
