import {
  JOUEUR_MATCH_CHAPTER_IDS,
  filterJoueurMatchChapters,
  normalizeJoueurMatchChapter,
  MATCH_CHAPTERS,
} from '../content/matchChapters';
import { getJoueurMatchChapters } from '../i18n/localizedChapters';

const t = (key: string) => key;

describe('joueur match chapters', () => {
  it('expose 4 onglets joueur max', () => {
    expect(JOUEUR_MATCH_CHAPTER_IDS).toHaveLength(4);
    expect(JOUEUR_MATCH_CHAPTER_IDS).toEqual([
      'calendrier',
      'convocations',
      'amicaux',
      'stats',
    ]);
  });

  it('filtre les chapitres staff depuis la liste complète', () => {
    const filtered = filterJoueurMatchChapters(MATCH_CHAPTERS);
    expect(filtered.map((c) => c.id)).toEqual(JOUEUR_MATCH_CHAPTER_IDS);
    expect(filtered.some((c) => c.id === 'tournois')).toBe(false);
    expect(filtered.some((c) => c.id === 'centre')).toBe(false);
  });

  it('localise les labels joueur en français', () => {
    const chapters = getJoueurMatchChapters(t);
    expect(chapters).toHaveLength(4);
    expect(chapters.find((c) => c.id === 'amicaux')?.label).toContain('Amicaux');
    expect(chapters.find((c) => c.id === 'stats')?.label).toContain('Stats');
  });

  it('normalise les deep links legacy vers un onglet joueur', () => {
    expect(normalizeJoueurMatchChapter('centre')).toBe('calendrier');
    expect(normalizeJoueurMatchChapter('tournois')).toBe('amicaux');
    expect(normalizeJoueurMatchChapter('competitions')).toBe('amicaux');
    expect(normalizeJoueurMatchChapter('stats')).toBe('stats');
    expect(normalizeJoueurMatchChapter('convocations')).toBe('convocations');
  });
});
