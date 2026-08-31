import {
  CLUB_THEME_AI_FALLBACK_MESSAGE,
  parseClubColorsFromAssistantReply,
  parseClubThemeAiIntent,
  suggestClubColorsFromName,
} from '../utils/clubThemeAiIntent';
import { findTeamColorPreset } from '../content/footballTeamColorPresets';

describe('parseClubThemeAiIntent', () => {
  it('style Barça FR', () => {
    const r = parseClubThemeAiIntent('Je veux un style Barça');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.colors.primary).toBe('#004D98');
      expect(r.colors.secondary).toBe('#A50044');
      expect(r.label).toMatch(/Barça|barça/i);
    }
  });

  it('couleurs PSG', () => {
    const r = parseClubThemeAiIntent('Couleurs PSG');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.colors.primary).toBe('#004170');
      expect(r.colors.secondary).toBe('#DA0024');
    }
  });

  it('mix bleu et or', () => {
    const r = parseClubThemeAiIntent('Mix bleu et or');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.colors.primary).toBe('#1E88E5');
      expect(r.colors.secondary).toBe('#FFD60A');
    }
  });

  it('tout en rouge', () => {
    const r = parseClubThemeAiIntent('Tout en rouge');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.colors.primary).toBe('#E53935');
  });

  it('fallback si incompréhensible', () => {
    const r = parseClubThemeAiIntent('xyz');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toBe(CLUB_THEME_AI_FALLBACK_MESSAGE);
  });
});

describe('parseClubColorsFromAssistantReply', () => {
  it('extrait deux hex depuis une réponse copilote', () => {
    const r = parseClubColorsFromAssistantReply(
      'PRINCIPALE #0A1628 · SECONDAIRE #C4A35A — ambiance nuit élégante.',
    );
    expect(r?.ok).toBe(true);
    if (r?.ok) {
      expect(r.colors.primary).toBe('#0A1628');
      expect(r.colors.secondary).toBe('#C4A35A');
      expect(r.label).toMatch(/Copilote/i);
    }
  });

  it('retourne null sans assez de hex', () => {
    expect(parseClubColorsFromAssistantReply('Pas de palette ici')).toBeNull();
  });
});

describe('suggestClubColorsFromName', () => {
  it('suggère depuis un nom qui matche un preset', () => {
    const r = suggestClubColorsFromName('Olympique de Marseille');
    expect(r?.ok).toBe(true);
    if (r?.ok) {
      expect(r.presetId).toBe(findTeamColorPreset('marseille')?.id);
      expect(r.colors.primary).toBe('#2FAEE0');
    }
  });

  it('retourne null sans match', () => {
    expect(suggestClubColorsFromName('FC Inconnu 999')).toBeNull();
  });
});
