import { coachChipContainerStyle, coachChipTextProps } from '../utils/coachChipUi';
import { buildCoachThemeTokens } from '../utils/coachTeamTheme';
import { proForm, proRadius } from '../theme/professionalDesign';
import { clubForm, clubRadius } from '../features/club/theme/clubDesignSystem';

describe('coachChipUi', () => {
  const dark = buildCoachThemeTokens({ variant: 'solid' });
  const light = buildCoachThemeTokens({ variant: 'clear' });

  it('n’utilise jamais l’aplat accent pour la sélection', () => {
    for (const tokens of [dark, light]) {
      const active = coachChipContainerStyle(true, tokens);
      expect(active.borderColor).toBe(tokens.accent);
      expect(active.backgroundColor).not.toBe(tokens.accent);
      expect(active.backgroundColor).toBe('transparent');
    }
  });

  it('colore le libellé actif en accent et laisse le libellé inactif discret', () => {
    expect(coachChipTextProps(true, dark)).toEqual({
      inverse: false,
      accent: true,
      muted: false,
    });
    expect(coachChipTextProps(false, dark)).toEqual({
      inverse: false,
      accent: false,
      muted: true,
    });
  });

  it('garde la puce inactive sur une surface élevée bordée', () => {
    const idle = coachChipContainerStyle(false, dark);
    expect(idle.borderColor).toBe(dark.border);
    expect(idle.backgroundColor).toBe(dark.elevated);
  });

  it('porte la géométrie partagée : hauteur 44, rayon pilule', () => {
    for (const tokens of [dark, light]) {
      for (const active of [true, false]) {
        const style = coachChipContainerStyle(active, tokens);
        /** Régression mesurée en aperçu : puces du calendrier à 16 px de haut, rayon 0. */
        expect(style.minHeight).toBe(proForm.chipHeight);
        expect(style.minHeight).toBe(44);
        expect(style.borderRadius).toBe(proForm.chipRadius);
        expect(style.borderRadius).toBe(999);
      }
    }
  });

  it('reste alignée sur la forme de puce du registre professionnel partagé', () => {
    // Une seule variante professionnelle : mêmes jetons pour Coach et Club/Admin.
    expect(proForm).toBe(clubForm);
    expect(proForm.chipRadius).toBe(clubRadius.pill);
    expect(proForm.chipHeight).toBeGreaterThanOrEqual(44);
    expect(proRadius.pill).toBe(999);
  });
});
