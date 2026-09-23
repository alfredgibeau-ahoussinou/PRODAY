import { getMobileRailLayout } from '../navigation/mobileTabConfig';
import { getJoueurGameTabLabel } from '../content/joueurGameMenu';

describe('mobileTabConfig', () => {
  it('place Accueil + Matchs à gauche et Reels au centre pour coach Homme legacy', () => {
    const rail = getMobileRailLayout('homme', 'coach');
    expect(rail.left).toEqual(['home', 'matchs']);
    expect(rail.center).toBe('reels');
    expect(rail.right).toContain('messages');
    expect(rail.right).toContain('profil');
  });

  it('canonise joueur homme vers dock 4 onglets (Accueil / Calendrier / Ma Carte / Menu)', () => {
    const rail = getMobileRailLayout('homme', 'player');
    expect(rail.flat).toEqual(['home', 'matchs', 'profil', 'plus']);
    expect(rail.overflow).toEqual(
      expect.arrayContaining(['feed', 'progression', 'recrutement', 'covoiturage', 'reels', 'messages', 'shop']),
    );
    expect(rail.overflow).not.toContain('sante');
    expect(rail.center).toBeNull();
  });

  it('affiche une rangée plate scaffold supporter (Accueil · Matchs · Compétitions · Clubs · Vidéos · Profil)', () => {
    const rail = getMobileRailLayout('supporter', 'supporter');
    expect(rail.flat).toEqual(['home', 'matchs', 'feed', 'plus', 'reels', 'profil']);
    expect(rail.center).toBeNull();
    expect(rail.overflow).toEqual([]);
    expect(rail.left).toEqual([]);
    expect(rail.right).toEqual([]);
  });

  it('utilise le même dock flat pour parent guest (line supporter, role parent)', () => {
    const rail = getMobileRailLayout('supporter', 'parent');
    expect(rail.flat).toEqual(['home', 'matchs', 'feed', 'plus', 'reels', 'profil']);
    expect(rail.overflow).toEqual([]);
  });

  it('affiche le menu amateur joueur en dock 4 onglets', () => {
    const rail = getMobileRailLayout('amateur', 'player');
    expect(rail.flat).toEqual(['home', 'matchs', 'profil', 'plus']);
    expect(rail.overflow).toEqual(
      expect.arrayContaining(['feed', 'progression', 'recrutement', 'covoiturage', 'reels', 'messages', 'shop']),
    );
    expect(rail.overflow).not.toContain('sante');
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

  it('réduit le menu santé / physio aux onglets de repli (rôle retiré)', () => {
    const rail = getMobileRailLayout('sante', 'physio');
    expect(rail.flat).toEqual(['home', 'profil']);
    expect(rail.center).toBeNull();
    expect(rail.overflow).toEqual([]);
  });

  it('affiche le menu club pro en rangée plate', () => {
    const rail = getMobileRailLayout('pro', 'club');
    expect(rail.flat).toEqual(['home', 'recrutement', 'matchs', 'messages', 'profil']);
    expect(rail.overflow).toEqual(expect.arrayContaining(['covoiturage', 'shop']));
    expect(rail.center).toBeNull();
  });



  it('place covoiturage en 2e pour coach pro', () => {
    const rail = getMobileRailLayout('pro', 'coach');
    expect(rail.flat).toEqual([
      'home',
      'covoiturage',
      'matchs',
      'recrutement',
      'messages',
      'shop',
      'profil',
    ]);
  });

  it('affiche le menu pro joueur en dock 4 onglets', () => {
    const rail = getMobileRailLayout('pro', 'player');
    expect(rail.flat).toEqual(['home', 'matchs', 'profil', 'plus']);
    expect(rail.overflow).toEqual(
      expect.arrayContaining(['feed', 'progression', 'recrutement', 'covoiturage', 'reels', 'messages', 'shop']),
    );
    expect(rail.overflow).not.toContain('sante');
    expect(rail.center).toBeNull();
  });
});

describe('joueurGameMenu labels', () => {
  it('exposes dock labels — Accueil · Calendrier · Ma Carte · Menu (refonte Player §4)', () => {
    expect(getJoueurGameTabLabel('home', 'youth')).toBe('JOUER');
    expect(getJoueurGameTabLabel('home', 'teen')).toBe('ACCUEIL');
    expect(getJoueurGameTabLabel('home', 'adult')).toBe('Accueil');
    expect(getJoueurGameTabLabel('matchs', 'adult')).toBe('Calendrier');
    expect(getJoueurGameTabLabel('feed', 'adult')).toBe('Ma Carte');
    expect(getJoueurGameTabLabel('profil', 'adult')).toBe('Ma Carte');
    expect(getJoueurGameTabLabel('plus', 'adult')).toBe('Menu');
    expect(getJoueurGameTabLabel('progression', 'adult')).toBe('Ma Saison');
  });
});
