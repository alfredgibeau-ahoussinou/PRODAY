import {
  resolveJoueurAgeGroup,
  resolveJoueurExperienceTheme,
} from '../utils/joueurExperienceTheme';
import {
  JOUEUR_PASS_PRICE,
  JOUEUR_COACH_PRICE,
  JOUEUR_YOUTH_CHALLENGES,
} from '../features/joueur/constants';

describe('joueur adaptive experience (app = site)', () => {
  it('routes age groups like the website', () => {
    expect(resolveJoueurAgeGroup({ age: 11 })).toBe('youth');
    expect(resolveJoueurAgeGroup({ age: 15 })).toBe('teen');
    expect(resolveJoueurAgeGroup({ age: 22 })).toBe('adult');
  });

  it('builds distinct themes per age with week beats + pricing copy', () => {
    const youth = resolveJoueurExperienceTheme({ age: 11, gender: 'men' });
    const teen = resolveJoueurExperienceTheme({ age: 15, gender: 'women' });
    const adult = resolveJoueurExperienceTheme({ age: 22, gender: 'men' });

    expect(youth.ageGroup).toBe('youth');
    expect(youth.scene.kind).toBe('pitch_playful');
    expect(youth.weekBeats).toHaveLength(7);
    expect(youth.copy.heroHeadline.toLowerCase()).toContain('prêt');

    expect(teen.ageGroup).toBe('teen');
    expect(teen.scene.kind).toBe('pitch_dynamic');
    expect(teen.gender).toBe('female');

    expect(adult.ageGroup).toBe('adult');
    expect(adult.scene.kind).toBe('pitch_data');
    expect(adult.copy.freePassSubtitle).toMatch(/3[,.]99/);
    expect(adult.copy.freePassTitle.toLowerCase()).toMatch(/gratuit|pass|performance/);
  });

  it('exposes youth challenges and public pricing constants', () => {
    expect(JOUEUR_YOUTH_CHALLENGES).toHaveLength(4);
    expect(JOUEUR_YOUTH_CHALLENGES.map((c) => c.id)).toEqual([
      'pied-faible',
      'dribbles',
      'passes',
      'vitesse',
    ]);
    expect(JOUEUR_PASS_PRICE).toBe('3,99 €');
    expect(JOUEUR_COACH_PRICE).toBe('~30 €');
  });
});
