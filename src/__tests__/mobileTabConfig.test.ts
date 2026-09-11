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

  it('canonise joueur homme vers dock 5 onglets (ACCUEIL / MATCHS / SAISON / PROFIL / PLUS)', () => {
    const rail = getMobileRailLayout('homme', 'player');
    expect(rail.flat).toEqual(['home', 'matchs', 'feed', 'profil', 'plus']);
    expect(rail.overflow).toEqual(
      expect.arrayContaining(['progression', 'recrutement', 'covoiturage', 'reels', 'messages', 'shop']),
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

  it('affiche le menu amateur joueur en dock 5 onglets', () => {
    const rail = getMobileRailLayout('amateur', 'player');
    expect(rail.flat).toEqual(['home', 'matchs', 'feed', 'profil', 'plus']);
    expect(rail.overflow).toEqual(
      expect.arrayContaining(['progression', 'recrutement', 'covoiturage', 'reels', 'messages', 'shop']),
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

  it('affiche le menu pro joueur en dock 5 onglets', () => {
    const rail = getMobileRailLayout('pro', 'player');
    expect(rail.flat).toEqual(['home', 'matchs', 'feed', 'profil', 'plus']);
    expect(rail.overflow).toEqual(
      expect.arrayContaining(['progression', 'recrutement', 'covoiturage', 'reels', 'messages', 'shop']),
    );
    expect(rail.overflow).not.toContain('sante');
    expect(rail.center).toBeNull();
  });
});

describe('joueurGameMenu labels', () => {
  it('exposes arcade short labels', () => {
    expect(getJoueurGameTabLabel('home', 'youth')).toBe('JOUER');
    expect(getJoueurGameTabLabel('recrutement', 'adult')).toBe('ÉQUIPE');
    expect(getJoueurGameTabLabel('matchs', 'adult')).toBe('MATCHS');
    expect(getJoueurGameTabLabel('feed', 'adult')).toBe('SAISON');
    expect(getJoueurGameTabLabel('progression', 'teen')).toBe('PROGRESS');
    expect(getJoueurGameTabLabel('profil', 'adult')).toBe('PROFIL');
    expect(getJoueurGameTabLabel('plus', 'adult')).toBe('PLUS');
  });
});
