import {
  parseCoachColorPhrase,
  normalizeCoachHexColor,
  COACH_COLOR_FAMILIES,
} from '../utils/coachColorPicker';

describe('parseCoachColorPhrase', () => {
  it('accepte un hex avec #', () => {
    expect(parseCoachColorPhrase('#006CFC')).toEqual({ hex: '#006CFC', label: '#006CFC' });
  });

  it('accepte un hex sans #', () => {
    expect(parseCoachColorPhrase('E91E63')).toEqual({ hex: '#E91E63', label: '#E91E63' });
  });

  it('reconnaît les noms de couleur FR', () => {
    expect(parseCoachColorPhrase('Rouge')).toEqual({ hex: '#E53935', label: 'Rouge' });
    expect(parseCoachColorPhrase('bleu marine')).toEqual({ hex: '#0D47A1', label: 'Bleu marine' });
    expect(parseCoachColorPhrase('Vert')).toEqual({ hex: '#43A047', label: 'Vert' });
    expect(parseCoachColorPhrase('bordeaux')).toEqual({ hex: '#880E4F', label: 'Bordeaux' });
    expect(parseCoachColorPhrase('turquoise')).toEqual({ hex: '#26A69A', label: 'Turquoise' });
  });

  it('reconnaît les alias ProDay', () => {
    expect(parseCoachColorPhrase('proday')).toEqual({ hex: '#006CFC', label: 'Bleu ProDay' });
    expect(parseCoachColorPhrase('bleu proday')).toEqual({ hex: '#006CFC', label: 'Bleu ProDay' });
  });

  it('retourne null pour une entrée invalide', () => {
    expect(parseCoachColorPhrase('')).toBeNull();
    expect(parseCoachColorPhrase('   ')).toBeNull();
    expect(parseCoachColorPhrase('couleur inconnue')).toBeNull();
    expect(parseCoachColorPhrase('#NOTHEX')).toBeNull();
  });

  it('normalise via normalizeCoachHexColor', () => {
    expect(normalizeCoachHexColor('#abc123')).toBe('#ABC123');
  });
});

describe('COACH_COLOR_FAMILIES', () => {
  it('contient des familles non vides avec des hex valides', () => {
    expect(COACH_COLOR_FAMILIES.length).toBeGreaterThan(0);
    for (const family of COACH_COLOR_FAMILIES) {
      expect(family.colors.length).toBeGreaterThanOrEqual(18);
      for (const color of family.colors) {
        expect(normalizeCoachHexColor(color)).toBe(color);
      }
    }
  });

  it('inclut le bleu ProDay dans la famille proday', () => {
    const proday = COACH_COLOR_FAMILIES.find((f) => f.id === 'proday');
    expect(proday?.colors).toContain('#006CFC');
  });
});
