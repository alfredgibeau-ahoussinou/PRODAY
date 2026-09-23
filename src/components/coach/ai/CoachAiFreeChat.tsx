/**
 * Copilote du pôle Coach — enveloppe du module conversationnel partagé.
 *
 * L'ancienne version affichait, en cas d'échec du service, une réponse pré-écrite issue de
 * `buildLocalProdayAiReply` **sans le dire** : l'utilisateur croyait lire le modèle. Elle
 * n'avait par ailleurs ni historique, ni arrêt, ni reprise, ni saisie multiligne. Tout cela
 * est désormais assuré par `CopilotChat` / `useCopilot`, et l'échec affiche son motif réel.
 */
import React, { useCallback, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CopilotChat } from '../../../features/copilot/CopilotChat';
import { coachCopilotTokens } from '../../../features/copilot/copilotTokens';
import { copilotScopeKey } from '../../../features/copilot/copilotCore';
import { useCopilot } from '../../../features/copilot/useCopilot';
import type { CopilotAsk } from '../../../features/copilot/useCopilot';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { askProdayAi } from '../../../services/prodayAi.service';

const COACH_SUGGESTIONS = [
  'Prépare une séance de pressing haut pour 18 joueurs',
  'Comment contrer une équipe qui défend en bloc bas ?',
  'Fais le point sur les convocations en attente de la semaine',
  'Propose une causerie de mi-temps si nous sommes menés',
];

export function CoachAiFreeChat({ onBack }: { onBack: () => void }) {
  const { tokens, teamId, teamName } = useCoachTheme();
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();

  const uid = profile?.uid ?? '';
  const clubId = profile?.profile.club_id ?? '';
  const role = profile?.role ?? 'coach';

  const scopeKey = useMemo(
    () => copilotScopeKey({ uid, role, pole: 'coach', clubId, teamId }),
    [uid, role, clubId, teamId],
  );
  const copilotTokens = useMemo(() => coachCopilotTokens(tokens), [tokens]);

  const ask = useCallback<CopilotAsk>(
    async ({ messages }) => {
      const res = await askProdayAi(messages, teamId);
      return { reply: res.reply, model: res.model, agents: res.agents_used };
    },
    [teamId],
  );

  const controller = useCopilot(scopeKey, ask);

  const contextLabel = [teamName?.trim() || 'Équipe non définie', clubId ? `club ${clubId.slice(0, 6)}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <CopilotChat
      tokens={copilotTokens}
      controller={controller}
      roleLabel="Copilote Coach"
      contextLabel={contextLabel}
      serviceNote="Réponses générées côté serveur à partir des données autorisées de votre équipe. Rien n’est enregistré ou envoyé sans votre confirmation."
      suggestions={COACH_SUGGESTIONS}
      placeholder="Posez votre question (Entrée pour un retour à la ligne)"
      bottomInset={insets.bottom + 8}
      onClose={onBack}
    />
  );
}
