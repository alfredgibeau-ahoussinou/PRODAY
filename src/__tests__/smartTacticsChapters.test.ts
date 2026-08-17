import {
  SMART_TACTICS_MORE_CHAPTERS,
  SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS,
  SMART_TACTICS_PRIMARY_CHAPTERS,
  isSmartTacticsPrimaryChapter,
  resolveSmartTacticsDefaultChapter,
} from '../content/smartTacticsChapters';
import type { TeamEvent } from '../models/TeamEvent';

describe('smartTacticsChapters coach flow', () => {
  it('expose 3 étapes principales Terrain / Effectif / Match', () => {
    expect(SMART_TACTICS_PRIMARY_CHAPTERS.map((c) => c.id)).toEqual([
      'board',
      'cards',
      'dashboard',
    ]);
    expect(SMART_TACTICS_PRIMARY_CHAPTERS.map((c) => c.label)).toEqual([
      'Terrain',
      'Effectif',
      'Match',
    ]);
    expect(SMART_TACTICS_PRIMARY_CHAPTERS.every((c) => c.step >= 1 && c.icon)).toBe(true);
    expect(SMART_TACTICS_MORE_CHAPTERS[0].id).toBe('prep');
    expect(SMART_TACTICS_MORE_CHAPTERS[0].label).toBe('IA adversaire');
    expect(SMART_TACTICS_MORE_CHAPTERS.length).toBeGreaterThanOrEqual(4);
  });

  it('expose un parcours joueur sans composition', () => {
    expect(SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS.map((c) => c.id)).toEqual([
      'inbox',
      'board',
      'me',
      'dashboard',
    ]);
    expect(SMART_TACTICS_PLAYER_PRIMARY_CHAPTERS.map((c) => c.gameLabel)).toEqual([
      'QUÊTE',
      'TERRAIN',
      'HÉROS',
      'MATCH',
    ]);
  });

  it('distingue primary vs more', () => {
    expect(isSmartTacticsPrimaryChapter('board')).toBe(true);
    expect(isSmartTacticsPrimaryChapter('dashboard')).toBe(true);
    expect(isSmartTacticsPrimaryChapter('history')).toBe(false);
  });

  it('ouvre Terrain si le prochain match n’a pas de XI', () => {
    const events = [
      {
        event_type: 'friendly',
        starts_at: new Date(Date.now() + 86400000),
        lineup: undefined,
      },
    ] as TeamEvent[];
    expect(resolveSmartTacticsDefaultChapter(events)).toBe('board');
  });

  it('reste sur Match si une composition existe déjà', () => {
    const events = [
      {
        event_type: 'competition',
        starts_at: new Date(Date.now() + 86400000),
        lineup: { formation: '4-3-3', slots: [{ uid: 'a', role: 'starter' }] },
      },
    ] as TeamEvent[];
    expect(resolveSmartTacticsDefaultChapter(events)).toBe('dashboard');
  });

  it('ouvre Consignes pour le mode joueur', () => {
    expect(resolveSmartTacticsDefaultChapter([], 'player')).toBe('inbox');
  });
});
