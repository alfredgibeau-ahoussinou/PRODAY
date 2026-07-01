import type { User } from '../models/User';
import {
  canAccessSponsorsModule,
  canPublishRecruitmentPost,
  getDashboardLayoutKind,
  getMercatoTabLabel,
  getSignupRoleGroups,
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

  it('regroupe joueurs et coachs sur Amateur', () => {
    expect(rolesForProductLine('amateur')).toEqual(['player', 'coach']);
    const amateurRoles = getSignupRoleGroups('amateur').flatMap((g) => g.roles);
    expect(amateurRoles).toEqual(expect.arrayContaining(['player', 'coach']));
    expect(amateurRoles).toHaveLength(2);
  });

  it('regroupe les supporters sur Supporter', () => {
    expect(rolesForProductLine('supporter')).toEqual(['supporter']);
    const supporterRoles = getSignupRoleGroups('supporter').flatMap((g) => g.roles);
    expect(supporterRoles).toEqual(['supporter']);
  });

  it('regroupe les métiers foot sur Pro (inclut joueur pro)', () => {
    const proRoles = getSignupRoleGroups('pro').flatMap((g) => g.roles);
    expect(proRoles).toEqual(
      expect.arrayContaining([
        'player',
        'coach',
        'agent',
        'recruiter',
        'club',
        'organizer',
        'sponsor',
      ])
    );
    expect(proRoles).not.toContain('physio');
  });

  it('dédié Santé aux praticiens médicaux', () => {
    const santeRoles = getSignupRoleGroups('sante').flatMap((g) => g.roles);
    expect(santeRoles).toEqual(['physio']);
    expect(rolesForProductLine('sante')).toEqual(['physio']);
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
      'recrutement',
      'matchs',
      'reels',
      'feed',
      'covoiturage',
      'sante',
      'messages',
      'profil',
    ]);
    expect(getVisibleMainTabs('homme', 'player', playerProfile)).not.toContain('famille');
    expect(getVisibleMainTabs('homme', 'player')).toContain('feed');
    expect(getVisibleMainTabs('pro', 'coach')).not.toContain('feed');
    expect(getVisibleMainTabs('sante', 'physio')).toContain('feed');
    expect(getVisibleMainTabs('pro', 'sponsor')).toEqual([
      'home',
      'matchs',
      'messages',
      'profil',
    ]);
    expect(getVisibleMainTabs('pro', 'sponsor')).not.toContain('shop');
    expect(getVisibleMainTabs('sante', 'physio')).toEqual([
      'home',
      'matchs',
      'feed',
      'messages',
      'profil',
    ]);
    expect(getVisibleMainTabs('sante', 'physio')).not.toContain('recrutement');
    expect(getVisibleMainTabs('sante', 'physio')).not.toContain('shop');
    expect(getVisibleMainTabs('pro', 'club')).toEqual([
      'home',
      'recrutement',
      'matchs',
      'messages',
      'profil',
    ]);
    expect(getVisibleMainTabs('pro', 'player')).toEqual([
      'home',
      'recrutement',
      'reels',
      'matchs',
      'profil',
    ]);
    expect(getVisibleMainTabs('pro', 'recruiter')).toContain('recrutement');
    expect(getVisibleMainTabs('pro', 'recruiter')).toContain('feed');
    expect(getVisibleMainTabs('pro', 'agent')).toContain('feed');
    expect(getVisibleMainTabs('pro', 'organizer')).toContain('feed');
    expect(getVisibleMainTabs('pro', 'coach')).toContain('covoiturage');
    expect(getVisibleMainTabs('amateur', 'coach')).toEqual([
      'home',
      'matchs',
      'recrutement',
      'messages',
      'profil',
    ]);
    expect(getVisibleMainTabs('amateur', 'player')).not.toContain('sante');
    expect(getVisibleMainTabs('amateur', 'player')).toContain('covoiturage');
    expect(getVisibleMainTabs('amateur', 'player')).toContain('recrutement');
    expect(getVisibleMainTabs('amateur', 'player')).not.toContain('matchs');
    expect(getVisibleMainTabs('supporter', 'supporter')).toEqual([
      'matchs',
      'feed',
      'messages',
      'reels',
      'shop',
    ]);
    expect(getVisibleMainTabs('supporter', 'supporter')).toContain('shop');
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
