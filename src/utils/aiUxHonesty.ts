/**
 * Libellés UX honnêtes pour surfaces IA — pas de jargon stub / fournisseur.
 * Les vrais assistants restent branchés ; on évite les faux boutons et les mocks silencieux.
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

/** Préfixe clair quand on montre une aide locale faute de cloud. */
export function localAiGuidePrefix(): string {
  return 'Guide local (sans copilote cloud)';
}

/**
 * Message d’erreur cloud + éventuel guide local, sans faire passer le local pour de l’IA.
 */
export function formatClubAiCloudFailure(opts: {
  errorMessage: string;
  localGuide?: string | null;
}): string {
  const err = opts.errorMessage.trim() || 'Copilote cloud indisponible.';
  const guide = opts.localGuide?.trim();
  if (guide) {
    return `Copilote cloud indisponible : ${err}\n\n${localAiGuidePrefix()} : ${guide}`;
  }
  return `Copilote cloud indisponible : ${err} Réessaie dans un instant, ou utilise les actions proposées ci-dessous.`;
}

/** Briefing Smart Tactics quand on est tombé en moteur local. */
export function labelLocalMatchPrepBriefing(
  localBriefing: string | undefined,
  reason?: string,
): string {
  const body = (localBriefing ?? '').trim() || 'Composition proposée par le moteur local (données effectif / forme).';
  const why = reason?.trim();
  if (why) {
    return `Mode local (pas de cloud) · ${why}\n\n${body}`;
  }
  return `Mode local (pas de cloud)\n\n${body}`;
}

export function coachHubHeuristicFootnote(): string {
  return 'Synthèse locale à partir de ton calendrier, effectif et wellness — pas un modèle conversationnel.';
}

export function adminAiLocalFootnote(): string {
  return 'Insights et actions basés sur les données admin chargées (règles locales). Pas de modèle cloud.';
}

export function prodayAiChatHonestyHint(): string {
  return 'Assistant cloud branché sur tes données ProDay. Si le serveur IA n’est pas configuré, une erreur claire s’affiche — aucun faux résultat.';
}
