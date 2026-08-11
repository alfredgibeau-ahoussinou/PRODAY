import {
  JOUEUR_THEME_SMOKE_PROFILES,
  resolveJoueurAgeGroup,
  resolveJoueurExperienceTheme,
  resolveJoueurGenderVisual,
  resolveJoueurPositionGroup,
  joueurHintsFromSearchParams,
} from '../utils/joueurExperienceTheme';

describe('joueurExperienceTheme', () => {
  it('maps ages to youth / teen / adult', () => {
    expect(resolveJoueurAgeGroup({ age: 12 })).toBe('youth');
    expect(resolveJoueurAgeGroup({ age: 13 })).toBe('teen');
    expect(resolveJoueurAgeGroup({ age: 17 })).toBe('teen');
    expect(resolveJoueurAgeGroup({ age: 18 })).toBe('adult');
    expect(resolveJoueurAgeGroup({})).toBe('adult');
  });

  it('prefers birthDate over age when resolving group', () => {
    const birth = new Date();
    birth.setFullYear(birth.getFullYear() - 10);
    expect(resolveJoueurAgeGroup({ age: 30, birthDate: birth })).toBe('youth');
  });

  it('resolves gender without pink/blue coupling (visual key only)', () => {
    expect(resolveJoueurGenderVisual('women')).toBe('female');
    expect(resolveJoueurGenderVisual('men')).toBe('male');
    expect(resolveJoueurGenderVisual('minor')).toBe('neutral');
    expect(resolveJoueurGenderVisual(null)).toBe('neutral');
  });

  it('resolves positions including accents', () => {
    expect(resolveJoueurPositionGroup('Gardien')).toBe('goalkeeper');
    expect(resolveJoueurPositionGroup('défenseur')).toBe('defender');
    expect(resolveJoueurPositionGroup('Milieu')).toBe('midfielder');
    expect(resolveJoueurPositionGroup('attaquant')).toBe('forward');
    expect(resolveJoueurPositionGroup(undefined)).toBe('unknown');
  });

  it('builds a complete theme for every smoke profile', () => {
    for (const { id, hints } of JOUEUR_THEME_SMOKE_PROFILES) {
      const theme = resolveJoueurExperienceTheme(hints);
      expect(theme.copy.brand).toContain('Pro Day');
      expect(theme.copy.heroHeadline.length).toBeGreaterThan(0);
      expect(theme.copy.dashboardLabels.length).toBeGreaterThan(0);
      expect(theme.weekBeats).toHaveLength(7);
      expect(theme.imagery.hero).toMatch(/^\//);
      expect(theme.imagery.scene).toMatch(/^\//);
      expect(theme.imagery.training).toMatch(/^\//);
      expect(theme.imagery.accent).toMatch(/^\//);
      expect(theme.scene.motifs.length).toBeGreaterThan(0);
      expect(theme.positionMotif.length).toBeGreaterThan(0);
      expect(['youth', 'teen', 'adult']).toContain(theme.ageGroup);
      expect(['male', 'female', 'neutral']).toContain(theme.gender);
      // no player-card mention in immersive copy packs
      const blob = JSON.stringify(theme.copy).toLowerCase();
      expect(blob).not.toMatch(/carte joueur|fut card|prodayfut/);
      expect(id.length).toBeGreaterThan(0);
    }
  });

  it('uses woman imagery for female profiles and man imagery for male', () => {
    const girl = resolveJoueurExperienceTheme({ age: 11, gender: 'women' });
    const boy = resolveJoueurExperienceTheme({ age: 11, gender: 'men' });
    expect(girl.imagery.hero).toMatch(/woman|women/i);
    expect(boy.imagery.hero).not.toMatch(/woman|women/i);
  });

  it('switches scene kind and visual style by age', () => {
    expect(resolveJoueurExperienceTheme({ age: 10 }).scene.kind).toBe('pitch_playful');
    expect(resolveJoueurExperienceTheme({ age: 15 }).scene.kind).toBe('pitch_dynamic');
    expect(resolveJoueurExperienceTheme({ age: 22 }).scene.kind).toBe('pitch_data');
    expect(resolveJoueurExperienceTheme({ age: 10 }).visualStyle).toBe('warm_playful');
    expect(resolveJoueurExperienceTheme({ age: 15 }).visualStyle).toBe('dynamic_competitive');
    expect(resolveJoueurExperienceTheme({ age: 22 }).visualStyle).toBe('precise_performance');
  });

  it('marks minors and exposes parent note under 18', () => {
    const teen = resolveJoueurExperienceTheme({ age: 16 });
    expect(teen.isMinor).toBe(true);
    expect(teen.copy.parentNote).toBeTruthy();
    const adult = resolveJoueurExperienceTheme({ age: 20 });
    expect(adult.isMinor).toBe(false);
    expect(adult.copy.parentNote).toBeUndefined();
  });

  it('parses QA search params without requiring a style picker', () => {
    const hints = joueurHintsFromSearchParams(
      new URLSearchParams('age=14&gender=women&position=gardien'),
    );
    const theme = resolveJoueurExperienceTheme(hints);
    expect(theme.ageGroup).toBe('teen');
    expect(theme.gender).toBe('female');
    expect(theme.position).toBe('goalkeeper');
  });

  it('never infantilizes adult copy', () => {
    const adult = resolveJoueurExperienceTheme({ age: 28, gender: 'men' });
    expect(adult.copy.heroHeadline.toLowerCase()).not.toMatch(/défi|amuse-toi|prêt à progresser/);
    expect(adult.copy.heroHeadline.toLowerCase()).toMatch(/performance|optimise|analyse|potentiel/);
  });
});

describe('website joueur profile URL hints', () => {
  it('builds /joueur/experience links for the immersive page', () => {
    const q = (hints: { age?: number; gender?: string; position?: string }) => {
      const p = new URLSearchParams();
      if (hints.age != null) p.set('age', String(hints.age));
      if (hints.gender) p.set('gender', hints.gender);
      if (hints.position) p.set('position', hints.position);
      const qs = p.toString();
      return qs ? `/joueur/experience?${qs}` : '/joueur/experience';
    };
    expect(q({ gender: 'women', age: 11 })).toBe(
      '/joueur/experience?age=11&gender=women',
    );
    expect(q({ gender: 'men', age: 15 })).toBe(
      '/joueur/experience?age=15&gender=men',
    );
    expect(
      resolveJoueurExperienceTheme(
        joueurHintsFromSearchParams(
          new URLSearchParams('gender=women&age=11'),
        ),
      ).ageGroup,
    ).toBe('youth');
  });
});
