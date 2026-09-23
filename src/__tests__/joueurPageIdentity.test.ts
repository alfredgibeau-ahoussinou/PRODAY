import {
  JOUEUR_AGE_GENDER_ACCENTS,
  JOUEUR_AGE_MOODS,
  JOUEUR_SITE,
  resolveJoueurPageIdentity,
} from '../content/joueurPageIdentity';
import { PLAYER_DARK } from '../theme/playerDarkPremium';
import { getJoueurDailyQuests, getJoueurYouthChallenges } from '../features/joueur/constants';
import { getJoueurGameTabLabel } from '../content/joueurGameMenu';

describe('joueurPageIdentity', () => {
  it('unifie les accents mint dark premium à chaque âge', () => {
    const youthM = resolveJoueurPageIdentity({ ageGroup: 'youth', gender: 'male' });
    const youthF = resolveJoueurPageIdentity({ ageGroup: 'youth', gender: 'female' });
    const teenM = resolveJoueurPageIdentity({ ageGroup: 'teen', gender: 'male' });
    const adultM = resolveJoueurPageIdentity({ ageGroup: 'adult', gender: 'male' });

    expect(youthM.accent).toBe(PLAYER_DARK.accent);
    expect(youthF.accent).toBe(PLAYER_DARK.accent);
    expect(teenM.accent).toBe(PLAYER_DARK.accent);
    expect(adultM.accent).toBe(PLAYER_DARK.accent);
    expect(youthM.accent).toBe(JOUEUR_AGE_GENDER_ACCENTS.youth.male.accent);
  });

  it('switch mood / wash / density par âge', () => {
    const youth = resolveJoueurPageIdentity({ ageGroup: 'youth', gender: 'male' });
    const teen = resolveJoueurPageIdentity({ ageGroup: 'teen', gender: 'male' });
    const adult = resolveJoueurPageIdentity({ ageGroup: 'adult', gender: 'male' });
    const youthF = resolveJoueurPageIdentity({ ageGroup: 'youth', gender: 'female' });

    expect(youth.wash).toEqual(JOUEUR_AGE_MOODS.youth.wash);
    expect(teen.wash).toEqual(JOUEUR_AGE_MOODS.teen.wash);
    expect(adult.wash).toEqual(JOUEUR_AGE_MOODS.adult.wash);
    expect(youthF.wash).toEqual(youth.wash);
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
    expect(youth.shellBg).toBe(PLAYER_DARK.bg);
    expect(youth.worldTag).toMatch(/-13/);
    expect(youthF.worldTag).toMatch(/FILLE/);
  });

  it('exposes coach price and game site tokens', () => {
    expect(JOUEUR_SITE.coachPriceEur).toBe(30);
    expect(JOUEUR_SITE.xp).toBeTruthy();
    expect(JOUEUR_SITE.bg).toBe(PLAYER_DARK.bg);
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
    expect(youth.shellBg).toBe(youthF.shellBg);
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
    expect(getJoueurGameTabLabel('home', 'teen')).toBe('ACCUEIL');
    expect(getJoueurGameTabLabel('home', 'adult')).toBe('Accueil');
    expect(getJoueurGameTabLabel('profil', 'adult')).toBe('Ma Carte');
    expect(getJoueurGameTabLabel('matchs', 'teen')).toBe('Calendrier');
  });
});
