import {
  aiComingSoonBody,
  adminAiLocalFootnote,
  clubRecruitmentAiEmpty,
  clubTournamentPoolsHonesty,
  coachHubHeuristicFootnote,
  formatClubAiCloudFailure,
  labelLocalMatchPrepBriefing,
  localAiGuidePrefix,
  prodayAiChatHonestyHint,
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

  it('n’habille pas un échec cloud comme une réussite IA', () => {
    const withGuide = formatClubAiCloudFailure({
      errorMessage: 'Assistant IA non configuré (clé Mistral manquante côté serveur).',
      localGuide: '3 adhésions en attente.',
    });
    expect(withGuide).toContain('Copilote cloud indisponible');
    expect(withGuide).toContain(localAiGuidePrefix());
    expect(withGuide).toContain('3 adhésions');
    expect(withGuide).not.toMatch(/^3 adhésions/);

    const bare = formatClubAiCloudFailure({
      errorMessage: 'Cloud Function introuvable',
    });
    expect(bare).toContain('Cloud Function introuvable');
    expect(bare).not.toContain(localAiGuidePrefix());
  });

  it('labellise le fallback Smart Tactics local', () => {
    const labeled = labelLocalMatchPrepBriefing('XI 4-3-3 prêt.', 'clé manquante');
    expect(labeled).toContain('Mode local');
    expect(labeled).toContain('clé manquante');
    expect(labeled).toContain('XI 4-3-3');
  });

  it('annonce honnêtement coach hub / admin / FAB ProDay AI', () => {
    expect(coachHubHeuristicFootnote()).toMatch(/locale/i);
    expect(adminAiLocalFootnote()).toMatch(/règles locales/i);
    expect(prodayAiChatHonestyHint()).toMatch(/erreur claire/i);
  });
});
