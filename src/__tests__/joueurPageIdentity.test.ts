import {
  JOUEUR_AGE_GENDER_ACCENTS,
  JOUEUR_AGE_MOODS,
  JOUEUR_SITE,
  resolveJoueurPageIdentity,
} from '../content/joueurPageIdentity';
import { getJoueurDailyQuests, getJoueurYouthChallenges } from '../features/joueur/constants';
import { getJoueurGameTabLabel } from '../content/joueurGameMenu';

describe('joueurPageIdentity', () => {
  it('différence les accents fille / garçon à chaque âge', () => {
    const youthM = resolveJoueurPageIdentity({ ageGroup: 'youth', gender: 'male' });
    const youthF = resolveJoueurPageIdentity({ ageGroup: 'youth', gender: 'female' });
    const teenM = resolveJoueurPageIdentity({ ageGroup: 'teen', gender: 'male' });
    const teenF = resolveJoueurPageIdentity({ ageGroup: 'teen', gender: 'female' });
    const adultM = resolveJoueurPageIdentity({ ageGroup: 'adult', gender: 'male' });
    const adultF = resolveJoueurPageIdentity({ ageGroup: 'adult', gender: 'female' });

    expect(youthM.accent).toBe(JOUEUR_AGE_GENDER_ACCENTS.youth.male.accent);
    expect(youthF.accent).toBe(JOUEUR_AGE_GENDER_ACCENTS.youth.female.accent);
    expect(youthM.accent).not.toBe(youthF.accent);

    expect(teenM.accent).toBe(JOUEUR_AGE_GENDER_ACCENTS.teen.male.accent);
    expect(teenF.accent).toBe(JOUEUR_AGE_GENDER_ACCENTS.teen.female.accent);
    expect(teenM.accent).not.toBe(teenF.accent);

    expect(adultM.accent).toBe(JOUEUR_AGE_GENDER_ACCENTS.adult.male.accent);
    expect(adultF.accent).toBe(JOUEUR_AGE_GENDER_ACCENTS.adult.female.accent);
    expect(adultM.accent).not.toBe(adultF.accent);

    // Les modes âge ne partagent pas la même palette garçon
    expect(youthM.accent).not.toBe(teenM.accent);
    expect(teenM.accent).not.toBe(adultM.accent);
  });

  it('switch mood / wash / density par âge', () => {
    const youth = resolveJoueurPageIdentity({ ageGroup: 'youth', gender: 'male' });
    const teen = resolveJoueurPageIdentity({ ageGroup: 'teen', gender: 'male' });
    const adult = resolveJoueurPageIdentity({ ageGroup: 'adult', gender: 'male' });
    const youthF = resolveJoueurPageIdentity({ ageGroup: 'youth', gender: 'female' });

    expect(youth.wash).toEqual(JOUEUR_AGE_MOODS.youth.wash);
    expect(teen.wash).toEqual(JOUEUR_AGE_MOODS.teen.wash);
    expect(adult.wash).toEqual(JOUEUR_AGE_MOODS.adult.wash);
    expect(youthF.wash).not.toEqual(youth.wash);
    expect(youth.density).toBe('playful');
    expect(teen.density).toBe('hud');
    expect(adult.density).toBe('pro');
    expect(youth.motif).toBe('dots');
    expect(teen.motif).toBe('grid');
    expect(adult.motif).toBe('stripes');
    expect(youth.hudLabel).toBe('JEUX GARÇON');
    expect(youthF.hudLabel).toBe('JEUX FILLE');
    expect(teen.hudLabel).toBe('MODE CALME');
    expect(adult.hudLabel).toBe('ÉQUIPE PRO');
    expect(youth.shellBg).not.toBe(teen.shellBg);
    expect(youth.worldTag).toMatch(/-13/);
    expect(youthF.worldTag).toMatch(/FILLE/);
  });

  it('exposes coach price and game site tokens', () => {
    expect(JOUEUR_SITE.coachPriceEur).toBe(30);
    expect(JOUEUR_SITE.xp).toBeTruthy();
    expect(JOUEUR_SITE.bg.startsWith('#')).toBe(true);
  });

  it('personalizes youth / teen titles', () => {
    const youth = resolveJoueurPageIdentity({
      ageGroup: 'youth',
      gender: 'male',
      displayName: 'Léo Martin',
    });
    expect(youth.title.toUpperCase()).toContain('LÉO');
    const youthF = resolveJoueurPageIdentity({
      ageGroup: 'youth',
      gender: 'female',
      displayName: 'Mia',
    });
    expect(youthF.title.toUpperCase()).toContain('MIA');
    expect(youth.shellBg).not.toBe(youthF.shellBg);
    const teen = resolveJoueurPageIdentity({
      ageGroup: 'teen',
      gender: 'female',
      displayName: 'Léa Dupont',
    });
    expect(teen.title.toUpperCase()).toContain('LÉA');
    expect(teen.genderLabel).toBe('JOUEUSE');
    expect(teen.worldTag).toMatch(/FILLE/);
  });

  it('sépare les quêtes daily par âge', () => {
    const youth = getJoueurDailyQuests('youth');
    const teen = getJoueurDailyQuests('teen');
    const adult = getJoueurDailyQuests('adult');
    expect(youth.some((q) => q.id === 'daily-coach')).toBe(false);
    expect(teen.some((q) => q.id === 'daily-coach')).toBe(true);
    expect(adult.length).toBeGreaterThan(youth.length);
    expect(youth[0]?.title).toMatch(/aventure|Bonjour/i);
  });

  it('adapte les défis youth au genre', () => {
    const boy = getJoueurYouthChallenges('male');
    const girl = getJoueurYouthChallenges('female');
    expect(boy.find((c) => c.id === 'passes')?.body).toMatch(/frère|parent/i);
    expect(girl.find((c) => c.id === 'passes')?.body).toMatch(/amie|parent/i);
    expect(girl.find((c) => c.id === 'pied-faible')?.title).toMatch(/magique/i);
  });

  it('change les labels de dock par âge', () => {
    expect(getJoueurGameTabLabel('home', 'youth')).toBe('JOUER');
    expect(getJoueurGameTabLabel('home', 'teen')).toBe('QG');
    expect(getJoueurGameTabLabel('home', 'adult')).toBe('ACCUEIL');
    expect(getJoueurGameTabLabel('profil', 'adult')).toBe('CARTE');
    expect(getJoueurGameTabLabel('matchs', 'teen')).toBe('MATCHS');
  });
});
