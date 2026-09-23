import type { User } from '../models/User';
import {
  canAccessSponsorsModule,
  canPublishRecruitmentPost,
  getDashboardLayoutKind,
  getMercatoTabLabel,
  getSignupRoleGroups,
  getTabShortLabel,
  getVisibleMainTabs,
} from '../content/poleExperience';
import { rolesForProductLine } from '../content/universeRoles';

describe('poleExperience', () => {
  it('limite Man et Woman aux joueurs', () => {
    expect(rolesForProductLine('homme')).toEqual(['player']);
    expect(rolesForProductLine('woman')).toEqual(['player']);
    expect(getSignupRoleGroups('homme')).toEqual([]);
    expect(getSignupRoleGroups('woman')).toEqual([]);
  });

  it('limite Amateur / Joueur aux joueurs (coach → Staff)', () => {
    expect(rolesForProductLine('amateur')).toEqual(['player']);
    const amateurRoles = getSignupRoleGroups('amateur').flatMap((g) => g.roles);
    expect(amateurRoles).toEqual(['player']);
    expect(rolesForProductLine('pro_staff')).toEqual(['coach']);
  });

  it('regroupe les supporters sur Supporter', () => {
    expect(rolesForProductLine('supporter')).toEqual(['supporter']);
    const supporterRoles = getSignupRoleGroups('supporter').flatMap((g) => g.roles);
    expect(supporterRoles).toEqual(['supporter']);
  });

  it('regroupe les métiers foot sur Pro (sans agent / recruteur / santé)', () => {
    const proRoles = getSignupRoleGroups('pro').flatMap((g) => g.roles);
    expect(proRoles).toEqual(
      expect.arrayContaining([
        'player',
        'coach',
        'club',
        'sponsor',
      ])
    );
    expect(proRoles).not.toContain('agent');
    expect(proRoles).not.toContain('recruiter');
    expect(proRoles).not.toContain('physio');
  });

  it('retire le pôle Santé de l’inscription', () => {
    expect(getSignupRoleGroups('sante')).toEqual([]);
    expect(rolesForProductLine('sante')).toEqual([]);
  });

  it('interdit la publication Mercato aux joueurs', () => {
    expect(canPublishRecruitmentPost('player')).toBe(false);
    expect(canPublishRecruitmentPost('club')).toBe(true);
    expect(canPublishRecruitmentPost('coach')).toBe(true);
    expect(canPublishRecruitmentPost('recruiter')).toBe(true);
  });

  it('adapte les onglets selon pôle et rôle', () => {
    const playerProfile = {
      uid: 'player-1',
      email: 'player@test.com',
      display_name: 'Joueur',
      role: 'player',
    } as User;

    expect(getVisibleMainTabs('homme', 'player')).toEqual([
      'home',
      'matchs',
      'profil',
      'plus',
      'feed',
      'progression',
      'recrutement',
      'reels',
      'messages',
      'covoiturage',
      'shop',
    ]);
    expect(getVisibleMainTabs('homme', 'player', playerProfile)).not.toContain('famille');
    expect(getVisibleMainTabs('homme', 'player')).toContain('feed');
    expect(getVisibleMainTabs('pro', 'coach')).not.toContain('feed');
    expect(getVisibleMainTabs('sante', 'physio')).toEqual(['home', 'profil']);
    expect(getVisibleMainTabs('pro', 'sponsor')).toEqual([
      'home',
      'matchs',
      'messages',
      'profil',
    ]);
    expect(getVisibleMainTabs('pro', 'sponsor')).not.toContain('shop');
    expect(getVisibleMainTabs('sante', 'physio')).not.toContain('recrutement');
    expect(getVisibleMainTabs('sante', 'physio')).not.toContain('shop');
    expect(getVisibleMainTabs('sante', 'physio')).not.toContain('feed');
    expect(getVisibleMainTabs('pro', 'club')).toEqual([
      'home',
      'recrutement',
      'matchs',
      'messages',
      'profil',
      'covoiturage',
      'shop',
    ]);
    expect(getVisibleMainTabs('pro', 'player')).toEqual([
      'home',
      'matchs',
      'profil',
      'plus',
      'feed',
      'progression',
      'recrutement',
      'reels',
      'messages',
      'covoiturage',
      'shop',
    ]);
    expect(getVisibleMainTabs('pro', 'player')).not.toContain('sante');
    expect(getVisibleMainTabs('pro', 'player').indexOf('feed')).toBe(4);
    expect(getVisibleMainTabs('pro', 'recruiter')).toEqual(['home', 'profil']);
    expect(getVisibleMainTabs('pro', 'agent')).toEqual(['home', 'profil']);
    expect(getVisibleMainTabs('pro', 'coach')).toContain('covoiturage');
    expect(getVisibleMainTabs('amateur', 'coach')).toEqual([
      'home',
      'matchs',
      'feed',
      'messages',
      'profil',
      'covoiturage',
      'recrutement',
      'shop',
    ]);
    expect(getVisibleMainTabs('amateur', 'club')).toEqual([
      'home',
      'recrutement',
      'matchs',
      'messages',
      'profil',
      'feed',
      'covoiturage',
      'shop',
    ]);
    expect(getVisibleMainTabs('amateur', 'player')).not.toContain('sante');
    expect(getVisibleMainTabs('pro_player', 'player')).not.toContain('sante');
    expect(getVisibleMainTabs('pro', 'player')).not.toContain('sante');
    expect(getVisibleMainTabs('amateur', 'player')).toContain('covoiturage');
    expect(getVisibleMainTabs('amateur', 'player')).toContain('recrutement');
    expect(getVisibleMainTabs('amateur', 'player')).toContain('feed');
    expect(getVisibleMainTabs('amateur', 'player')).toContain('messages');
    expect(getVisibleMainTabs('amateur', 'player')).toContain('shop');
    expect(getVisibleMainTabs('amateur', 'player')).toContain('reels');
    expect(getTabShortLabel('recrutement', 'amateur', 'player')).toBe('Équipe');
    expect(getTabShortLabel('feed', 'amateur', 'coach')).toBe('Perf.');
    expect(getTabShortLabel('home', 'amateur', 'club')).toBe('Accueil');
    expect(getVisibleMainTabs('supporter', 'supporter')).toEqual([
      'home',
      'matchs',
      'feed',
      'plus',
      'reels',
      'profil',
    ]);
    expect(getVisibleMainTabs('supporter', 'supporter')).toContain('profil');
    expect(getVisibleMainTabs('supporter', 'supporter')).toContain('feed');
    expect(getVisibleMainTabs('supporter', 'supporter')).toContain('plus');
    expect(getVisibleMainTabs('supporter', 'supporter')).toContain('reels');
    expect(getVisibleMainTabs('supporter', 'supporter')).not.toContain('messages');
    expect(getVisibleMainTabs('supporter', 'supporter')).not.toContain('shop');
    expect(getVisibleMainTabs('supporter', 'supporter')).not.toContain('recrutement');
    expect(getVisibleMainTabs('supporter', 'supporter')).not.toContain('covoiturage');
    expect(getVisibleMainTabs('supporter', 'supporter')).not.toContain('sante');
    expect(getVisibleMainTabs('sante', 'physio')).not.toContain('covoiturage');
  });

  it('libellé Mercato joueur = Candidater', () => {
    expect(getMercatoTabLabel('homme', 'player')).toBe('Candidater');
    expect(getMercatoTabLabel('amateur', 'coach')).toBe('Mercato Amateur');
    expect(getMercatoTabLabel('pro', 'coach')).toBe('Mercato Pro');
  });

  it('sépare dashboard amateur joueur et coach staff', () => {
    expect(getDashboardLayoutKind('homme', 'player')).toBe('amateur_player');
    expect(getDashboardLayoutKind('amateur', 'player')).toBe('amateur_player');
    expect(getDashboardLayoutKind('amateur', 'coach')).toBe('pro');
    expect(getDashboardLayoutKind('pro', 'coach')).toBe('pro');
  });

  it('limite le module sponsors au partenaire Pro Staff', () => {
    expect(canAccessSponsorsModule('pro_staff', 'sponsor')).toBe(true);
    expect(canAccessSponsorsModule('pro', 'sponsor')).toBe(true);
    expect(canAccessSponsorsModule('pro_player', 'sponsor')).toBe(false);
    expect(canAccessSponsorsModule('homme', 'player')).toBe(false);
    expect(canAccessSponsorsModule('woman', 'player')).toBe(false);
  });
});
