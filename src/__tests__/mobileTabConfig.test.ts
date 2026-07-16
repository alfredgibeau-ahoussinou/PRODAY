import { getMobileRailLayout } from '../navigation/mobileTabConfig';

describe('mobileTabConfig', () => {
  it('place Accueil + Matchs à gauche et Reels au centre pour coach Homme legacy', () => {
    const rail = getMobileRailLayout('homme', 'coach');
    expect(rail.left).toEqual(['home', 'matchs']);
    expect(rail.center).toBe('reels');
    expect(rail.right).toContain('messages');
    expect(rail.right).toContain('profil');
  });

  it('canonise joueur homme vers shell pro joueur plat', () => {
    const rail = getMobileRailLayout('homme', 'player');
    expect(rail.flat).toEqual(['home', 'recrutement', 'reels', 'matchs', 'shop', 'profil']);
    expect(rail.overflow).toEqual(expect.arrayContaining(['sante', 'messages']));
    expect(rail.center).toBeNull();
  });

  it('affiche une rangée plate pour Supporter (sans Reels central)', () => {
    const rail = getMobileRailLayout('supporter', 'supporter');
    expect(rail.flat).toEqual(['matchs', 'feed', 'messages', 'reels', 'shop', 'profil']);
    expect(rail.center).toBeNull();
    expect(rail.overflow).toEqual([]);
    expect(rail.left).toEqual([]);
    expect(rail.right).toEqual([]);
  });

  it('affiche le menu amateur joueur en rangée plate avec overflow', () => {
    const rail = getMobileRailLayout('amateur', 'player');
    expect(rail.flat).toEqual(['home', 'covoiturage', 'recrutement', 'shop', 'profil']);
    expect(rail.overflow).toEqual(expect.arrayContaining(['messages', 'reels', 'sante']));
    expect(rail.center).toBeNull();
  });

  it('remonte Profil sur le rail à côté de Messages', () => {
    const rail = getMobileRailLayout('pro', 'sponsor');
    expect(rail.left).toEqual(['home', 'matchs']);
    expect(rail.center).toBeNull();
    expect(rail.right).toEqual(['messages', 'profil']);
    expect(rail.overflow).toEqual([]);
  });

  it('garde Profil accessible sur le rail pour coach Homme', () => {
    const rail = getMobileRailLayout('homme', 'coach');
    expect(rail.right).toContain('profil');
    expect(rail.overflow).not.toContain('profil');
  });

  it('affiche le menu santé praticien en rangée plate', () => {
    const rail = getMobileRailLayout('sante', 'physio');
    expect(rail.flat).toEqual(['home', 'matchs', 'feed', 'messages', 'profil']);
    expect(rail.center).toBeNull();
    expect(rail.overflow).toEqual([]);
  });

  it('affiche le menu club pro en rangée plate', () => {
    const rail = getMobileRailLayout('pro', 'club');
    expect(rail.flat).toEqual(['home', 'recrutement', 'matchs', 'messages', 'shop', 'profil']);
    expect(rail.center).toBeNull();
    expect(rail.overflow).toEqual([]);
  });

  it('affiche le menu pro joueur en rangée plate', () => {
    const rail = getMobileRailLayout('pro', 'player');
    expect(rail.flat).toEqual(['home', 'recrutement', 'reels', 'matchs', 'shop', 'profil']);
    expect(rail.overflow).toEqual(expect.arrayContaining(['sante', 'messages']));
    expect(rail.center).toBeNull();
  });
});
