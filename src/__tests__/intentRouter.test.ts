import { resolveIntents } from '../../functions/src/aiAgents/intentRouter';

describe('intentRouter — resolveIntents', () => {
  it('routes match keywords to match + analytics agents', () => {
    const agents = resolveIntents('Pourquoi mon équipe perd les matchs ?', 'coach');
    expect(agents).toContain('match');
    expect(agents).toContain('analytics');
  });

  it('routes club keywords to club agent', () => {
    const agents = resolveIntents('Combien de membres dans le club ?', 'club');
    expect(agents).toContain('club');
  });

  it('routes training keywords', () => {
    const agents = resolveIntents('Montre-moi les séances d\'entraînement récentes', 'coach');
    expect(agents).toContain('training');
  });

  it('routes revenue keywords', () => {
    const agents = resolveIntents('Quel est le total des paiements en attente ?', 'club');
    expect(agents).toContain('revenue');
  });

  it('routes video keywords', () => {
    const agents = resolveIntents('Montre-moi les analyses vidéo', 'coach');
    expect(agents).toContain('video');
  });

  it('routes player keywords', () => {
    const agents = resolveIntents('Stats du joueur et sa progression', 'player');
    expect(agents).toContain('player');
  });

  it('routes coach keywords', () => {
    const agents = resolveIntents('Évaluation tactique de l\'équipe', 'coach');
    expect(agents).toContain('coach');
  });

  it('falls back to role-based agents for unknown query', () => {
    const agents = resolveIntents('Bonjour, comment ça va ?', 'club');
    expect(agents).toContain('club');
    expect(agents).toContain('analytics');
  });

  it('falls back to analytics for unknown role', () => {
    const agents = resolveIntents('Hello', 'unknown');
    expect(agents).toContain('analytics');
  });

  it('handles multiple intents in one query', () => {
    const agents = resolveIntents('Résultats des matchs et revenus du club', 'club');
    expect(agents).toContain('match');
    expect(agents).toContain('revenue');
    expect(agents).toContain('club');
  });

  it('handles accented characters', () => {
    const agents = resolveIntents('entraînement et séance', 'coach');
    expect(agents).toContain('training');
  });
});
