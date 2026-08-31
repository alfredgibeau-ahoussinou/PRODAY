import { FOOTBALL_TEAM_COLOR_PRESETS, findTeamColorPreset } from '../content/footballTeamColorPresets';
import {
  parsePlayerThemeAiIntent,
  isPlayerThemeSettingsIntent,
  THEME_AI_FALLBACK_MESSAGE,
} from '../utils/playerThemeAiIntent';

describe('footballTeamColorPresets', () => {
  it('expose au moins 12 presets', () => {
    expect(FOOTBALL_TEAM_COLOR_PRESETS.length).toBeGreaterThanOrEqual(12);
  });

  it('trouve Barça par alias', () => {
    expect(findTeamColorPreset('style barça')?.id).toBe('barca');
    expect(findTeamColorPreset('blaugrana')?.id).toBe('barca');
  });

  it('trouve Real Madrid', () => {
    expect(findTeamColorPreset('comme le Real Madrid')?.id).toBe('real');
  });

  it('trouve PSG', () => {
    expect(findTeamColorPreset('couleurs PSG')?.id).toBe('psg');
  });
});

describe('parsePlayerThemeAiIntent', () => {
  it('style Barça FR', () => {
    const r = parsePlayerThemeAiIntent('Je veux un style Barça');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.prefs.mode).toBe('custom');
      expect(r.prefs.custom?.accent).toBe('#004D98');
      expect(r.label).toMatch(/Barça|barça/i);
    }
  });

  it('style Real Madrid EN', () => {
    const r = parsePlayerThemeAiIntent('Real Madrid style for my space');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#FEBE10');
  });

  it('comme le PSG', () => {
    const r = parsePlayerThemeAiIntent('Couleurs comme le PSG');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accentSecondary).toBe('#DA0024');
  });

  it('mix bleu et or FR', () => {
    const r = parsePlayerThemeAiIntent('Un mix de bleu et or');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.prefs.custom?.accent).toBe('#1E88E5');
      expect(r.prefs.custom?.accentSecondary).toBe('#FFD60A');
    }
  });

  it('mélange rouge et blanc', () => {
    const r = parsePlayerThemeAiIntent('Mélange rouge et blanc');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.prefs.custom?.accent).toBe('#E53935');
      expect(r.prefs.custom?.accentSecondary).toBe('#F5F5F5');
    }
  });

  it('combine green and orange EN', () => {
    const r = parsePlayerThemeAiIntent('Combine green and orange');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.prefs.custom?.accent).toBe('#00E676');
      expect(r.prefs.custom?.accentSecondary).toBe('#FF6B35');
    }
  });

  it('tout en violet', () => {
    const r = parsePlayerThemeAiIntent('Tout en violet');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#BF5AF2');
  });

  it('espace rouge', () => {
    const r = parsePlayerThemeAiIntent('Espace rouge');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#E53935');
  });

  it('tout en bleu', () => {
    const r = parsePlayerThemeAiIntent('Mon espace tout en bleu');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.prefs.custom?.accent).toBe('#1E88E5');
      expect(r.prefs.custom?.background).toBeDefined();
    }
  });

  it('style Liverpool', () => {
    const r = parsePlayerThemeAiIntent('Style Liverpool');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#C8102E');
  });

  it('style OM', () => {
    const r = parsePlayerThemeAiIntent('Inspiré OM');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#2FAEE0');
  });

  it('style Juventus', () => {
    const r = parsePlayerThemeAiIntent('Comme la Juventus');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#FFFFFF');
  });

  it('style Bayern', () => {
    const r = parsePlayerThemeAiIntent('Style Bayern Munich');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#DC052D');
  });

  it('style Chelsea', () => {
    const r = parsePlayerThemeAiIntent('Chelsea style');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#034694');
  });

  it('style Arsenal', () => {
    const r = parsePlayerThemeAiIntent('Couleurs Arsenal');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#EF0107');
  });

  it('style Milan', () => {
    const r = parsePlayerThemeAiIntent('Style Milan AC');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#FB090B');
  });

  it('style Dortmund', () => {
    const r = parsePlayerThemeAiIntent('Comme Dortmund');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#FDE100');
  });

  it('style Man City', () => {
    const r = parsePlayerThemeAiIntent('Man City colors');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#6CABDD');
  });

  it('hex direct dans mix', () => {
    const r = parsePlayerThemeAiIntent('Mix #FF0000 et #0000FF');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.prefs.custom?.accent).toBe('#FF0000');
      expect(r.prefs.custom?.accentSecondary).toBe('#0000FF');
    }
  });

  it('je veux cette couleur pour mon espace — bleu', () => {
    const r = parsePlayerThemeAiIntent('Je veux cette couleur bleu pour mon espace');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.prefs.custom?.accent).toBe('#1E88E5');
  });

  it('phrase incompréhensible → fallback', () => {
    const r = parsePlayerThemeAiIntent('asdf qwerty random');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe(THEME_AI_FALLBACK_MESSAGE);
  });

  it('entrée trop courte → fallback', () => {
    const r = parsePlayerThemeAiIntent('ok');
    expect(r.ok).toBe(false);
  });

  it('isPlayerThemeSettingsIntent détecte mes couleurs', () => {
    expect(isPlayerThemeSettingsIntent('Mes couleurs')).toBe(true);
    expect(isPlayerThemeSettingsIntent('Couleurs de mon espace')).toBe(true);
    expect(isPlayerThemeSettingsIntent('Mon tir')).toBe(false);
  });
});
