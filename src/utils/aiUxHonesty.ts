/**
 * Libellés UX honnêtes pour surfaces IA — pas de jargon stub / fournisseur.
 * Les vrais assistants restent branchés ; on évite les faux boutons.
 */

export function aiComingSoonBody(feature: string): string {
  return `${feature} arrive bientôt. En attendant, aucun faux résultat n’est inventé.`;
}

/** Remplace les mentions fournisseur visibles utilisateur. */
export function softAiProviderLabel(raw: string): string {
  return raw
    .replace(/\bMistral\b/gi, 'Copilote')
    .replace(/\s*\(stub\)\s*/gi, ' ')
    .replace(/\bstub\b/gi, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export type HonestAiEmpty = {
  title: string;
  body: string;
  primaryCta: string;
  primaryHint: string;
};

export function clubRecruitmentAiEmpty(): HonestAiEmpty {
  return {
    title: 'Suggestions IA',
    body:
      'Les pistes automatiques de recrutement arrivent bientôt. Aucune suggestion inventée pour l’instant — validez toujours un mouvement humainement.',
    primaryCta: 'Ouvrir le Copilote Club',
    primaryHint: 'Assistant réel · confirmation avant action',
  };
}

export function clubTournamentPoolsHonesty(): { title: string; body: string; cta: string; hint: string } {
  return {
    title: 'Poules de tournoi',
    body:
      'Les poules se génèrent dans Organisation (tournoi club), après inscription des équipes. Rien n’est publié sans votre action.',
    cta: 'Comment générer les poules',
    hint: 'Flux Organisation · jamais hors validation',
  };
}
