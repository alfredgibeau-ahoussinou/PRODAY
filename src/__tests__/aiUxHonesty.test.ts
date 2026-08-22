import {
  aiComingSoonBody,
  clubRecruitmentAiEmpty,
  clubTournamentPoolsHonesty,
  softAiProviderLabel,
} from '../utils/aiUxHonesty';

describe('aiUxHonesty', () => {
  it('retire jargon stub et fournisseur du libellé UX', () => {
    expect(softAiProviderLabel('Dialogue Mistral · confirmation')).toBe(
      'Dialogue Copilote · confirmation',
    );
    expect(softAiProviderLabel('Poules IA (stub)')).toBe('Poules IA');
  });

  it('rédige des empties recrutement / poules actionnables', () => {
    const recruit = clubRecruitmentAiEmpty();
    expect(recruit.title).not.toMatch(/stub/i);
    expect(recruit.primaryCta).toContain('Copilote');
    const pools = clubTournamentPoolsHonesty();
    expect(pools.title).not.toMatch(/stub/i);
    expect(pools.body).toContain('Organisation');
  });

  it('annonce bientôt sans inventer de résultat', () => {
    expect(aiComingSoonBody('Les rappels push')).toContain('bientôt');
    expect(aiComingSoonBody('Les rappels push')).toContain('faux résultat');
  });
});
