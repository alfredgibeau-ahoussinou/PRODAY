import { UNIVERSE_CHOICE_ORDER } from '../components/branding/intro/universeChoiceShared';
import { getAppSpaceGroups } from '../screens/signup/signupFlowConfig';
import { getPlayerStepMeta } from '../screens/signup/signupPlayerStepMeta';
import { getSignupRoleGroups, getVisibleMainTabs } from '../content/poleExperience';
import { carouselPoleSignupPresetRole, carouselPoleToProductLine } from '../models/CarouselPole';

describe('migration carousel Pôle Joueur (écosystème)', () => {
  it('retire homme et woman du carousel pré-connexion', () => {
    expect(UNIVERSE_CHOICE_ORDER).not.toContain('homme');
    expect(UNIVERSE_CHOICE_ORDER).not.toContain('woman');
  });

  it('expose Joueur unifié + Événements (plus Amateur/Pro Joueur séparés)', () => {
    expect(UNIVERSE_CHOICE_ORDER).toEqual([
      'joueur',
      'supporter',
      'pro_club',
      'pro_staff',
      'evenements',
      'sponsor',
      'sante',
    ]);
    expect(UNIVERSE_CHOICE_ORDER).not.toContain('amateur');
    expect(UNIVERSE_CHOICE_ORDER).not.toContain('pro_player');
  });

  it('mappe le pôle sponsor vers product_line sponsor dédié', () => {
    expect(carouselPoleToProductLine('sponsor')).toBe('sponsor');
    expect(carouselPoleSignupPresetRole('sponsor')).toBe('sponsor');
  });

  it('mappe les pôles carousel vers product_line stocké', () => {
    expect(carouselPoleToProductLine('joueur')).toBe('amateur');
    expect(carouselPoleToProductLine('pro_player')).toBe('amateur');
    expect(carouselPoleToProductLine('pro_club')).toBe('pro_club');
    expect(carouselPoleToProductLine('pro_staff')).toBe('pro_staff');
    expect(carouselPoleToProductLine('evenements')).toBe('pro_staff');
    expect(carouselPoleToProductLine('sponsor')).toBe('sponsor');
  });

  it('filtre l’inscription pro selon le preset carousel', () => {
    const playerOnly = getSignupRoleGroups('pro_player', 'player').flatMap((g) => g.roles);
    expect(playerOnly).toEqual(['player']);
    const clubOnly = getSignupRoleGroups('pro_club', 'club').flatMap((g) => g.roles);
    expect(clubOnly).toEqual(['club']);
  });

  it('le genre pilote les groupes d’espace foot proposés (plus le pôle)', () => {
    const menGroups = getAppSpaceGroups(false);
    const womenGroups = getAppSpaceGroups(true);
    expect(menGroups.map((g) => g.id)).toEqual(['masculine', 'school']);
    expect(womenGroups.map((g) => g.id)).toEqual(['feminine', 'school']);
  });

  it('le parcours Amateur a sa propre copy par étape (plus de fallback Man)', () => {
    const spaceMeta = getPlayerStepMeta('amateur', 'space');
    expect(spaceMeta.title).toMatch(/genre/i);
    const sportMeta = getPlayerStepMeta('amateur', 'sport');
    expect(sportMeta.subtitle).toMatch(/Mercato Amateur/i);
    const locationMeta = getPlayerStepMeta('amateur', 'location');
    expect(locationMeta.heroIcon).toBe('location');
  });

  it('Woman legacy garde sa propre copy (deep link existant, non régressé)', () => {
    const womanMeta = getPlayerStepMeta('woman', 'space');
    expect(womanMeta.title).not.toMatch(/genre/i);
  });

  it('shell amateur joueur inclut l’onglet Club', () => {
    expect(getVisibleMainTabs('amateur', 'player')).toEqual(
      expect.arrayContaining(['recrutement']),
    );
  });
});
