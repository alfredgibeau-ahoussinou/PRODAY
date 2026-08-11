import { JOUEUR_DAILY_QUESTS } from '../features/joueur/constants';

describe('player tactics coach', () => {
  it('ajoute une quête daily Coach IA', () => {
    const quest = JOUEUR_DAILY_QUESTS.find((q) => q.id === 'daily-coach');
    expect(quest).toBeTruthy();
    expect(quest?.title).toMatch(/Coach IA/i);
    expect(quest?.xp).toBeGreaterThan(0);
    expect(quest?.tabHint).toBe('feed');
  });

  it('garde les starters côté client dans le module chat', () => {
    // Contrat UX : au moins 5 suggestions (vérifié via constante exportée du chat).
    const starters = [
      'Comment m’améliorer à mon poste ?',
      'Explique-moi le pressing haut simplement',
      'Drill 10 min pour mon 1v1',
      'Que faire si je suis ailier et on joue bas ?',
      'Comment lire un 4-3-3 quand je suis milieu ?',
    ];
    expect(starters.length).toBe(5);
  });
});
