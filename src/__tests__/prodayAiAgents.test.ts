import { resolveIntents } from '../../functions/src/aiAgents/intentRouter';

describe('ProDay AI Agents — integration', () => {
  describe('intent resolution coverage', () => {
    const cases: [string, string, string[]][] = [
      ['match query', 'score du dernier match', ['match']],
      ['classement', 'classement de notre équipe', ['match']],
      ['victoire/défaite', 'combien de victoires cette saison', ['match']],
      ['adhérent club', 'nombre d\'adhérents', ['club']],
      ['inscription', 'inscriptions en attente', ['club']],
      ['exercice', 'exercice de passe', ['training']],
      ['blessure joueur', 'joueurs blessés', ['player']],
      ['forme joueur', 'forme physique', ['player']],
      ['clip vidéo', 'dernier clip', ['video']],
      ['abonnement', 'quel abonnement actif', ['revenue']],
      ['cotisation', 'cotisations impayées', ['revenue']],
      ['analyse pourquoi', 'pourquoi on perd', ['analytics']],
      ['tendance', 'tendance de performance', ['analytics']],
      ['tactique coach', 'tactique du coach', ['coach']],
    ];

    it.each(cases)('%s → includes %s agents', (_label, query, expected) => {
      const agents = resolveIntents(query, 'coach');
      for (const exp of expected) {
        expect(agents).toContain(exp);
      }
    });
  });

  describe('role-based fallback', () => {
    it('club role falls back to club + analytics', () => {
      const agents = resolveIntents('aide-moi', 'club');
      expect(agents).toEqual(expect.arrayContaining(['club', 'analytics']));
    });

    it('player role falls back to player + analytics', () => {
      const agents = resolveIntents('aide-moi', 'player');
      expect(agents).toEqual(expect.arrayContaining(['player', 'analytics']));
    });

    it('sponsor role falls back to revenue + analytics', () => {
      const agents = resolveIntents('aide-moi', 'sponsor');
      expect(agents).toEqual(expect.arrayContaining(['revenue', 'analytics']));
    });
  });
});
