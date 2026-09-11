import {
  JOUEUR_MATCH_CHAPTER_IDS,
  filterJoueurMatchChapters,
  normalizeJoueurMatchChapter,
  MATCH_CHAPTERS,
} from '../content/matchChapters';
import { getJoueurMatchChapters } from '../i18n/localizedChapters';

const t = (key: string) => key;

describe('joueur match chapters', () => {
  it('expose 4 onglets joueur', () => {
    expect(JOUEUR_MATCH_CHAPTER_IDS).toHaveLength(4);
    expect(JOUEUR_MATCH_CHAPTER_IDS).toEqual([
      'calendrier',
      'centre',
      'convocations',
      'stats',
    ]);
  });

  it('filtre les chapitres staff depuis la liste complète', () => {
    const filtered = filterJoueurMatchChapters(MATCH_CHAPTERS);
    expect(filtered.map((c) => c.id)).toEqual(JOUEUR_MATCH_CHAPTER_IDS);
    expect(filtered.some((c) => c.id === 'tournois')).toBe(false);
    expect(filtered.some((c) => c.id === 'amicaux')).toBe(false);
    expect(filtered.some((c) => c.id === 'centre')).toBe(true);
  });

  it('localise les labels joueur en français', () => {
    const chapters = getJoueurMatchChapters(t);
    expect(chapters).toHaveLength(4);
    expect(chapters.find((c) => c.id === 'stats')?.label).toContain('Stats');
    expect(chapters.find((c) => c.id === 'centre')?.label).toBeDefined();
  });

  it('normalise les deep links legacy vers un onglet joueur', () => {
    expect(normalizeJoueurMatchChapter('centre')).toBe('centre');
    expect(normalizeJoueurMatchChapter('amicaux')).toBe('calendrier');
    expect(normalizeJoueurMatchChapter('tournois')).toBe('calendrier');
    expect(normalizeJoueurMatchChapter('competitions')).toBe('calendrier');
    expect(normalizeJoueurMatchChapter('stats')).toBe('stats');
    expect(normalizeJoueurMatchChapter('convocations')).toBe('convocations');
  });
});
