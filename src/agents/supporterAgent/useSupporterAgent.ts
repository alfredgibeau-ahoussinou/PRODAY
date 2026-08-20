import { useCallback, useState } from 'react';
import type { MatchCenterData } from '../../services/footballData';
import {
  buildSupporterAgentContext,
  type SupporterAgentReply,
} from './supporterAgent.types';
import { SUPPORTER_AGENT_DISCLAIMER } from './supporterAgent.prompt';

/** Stub local — brancher cloud function IA quand disponible. */
export function useSupporterAgent() {
  const [loading, setLoading] = useState(false);
  const [lastReply, setLastReply] = useState<SupporterAgentReply | null>(null);

  const ask = useCallback(async (question: string, data: MatchCenterData) => {
    setLoading(true);
    try {
      const ctx = buildSupporterAgentContext(data);
      const q = question.trim().toLowerCase();
      let text: string;

      if (q.includes('résume') || q.includes('resume')) {
        text = ctx.score
          ? `${ctx.homeLabel} ${ctx.score} ${ctx.awayLabel}. ${ctx.eventsCount} événement(s) enregistré(s).`
          : `${ctx.homeLabel} vs ${ctx.awayLabel} — match ${ctx.status}.`;
      } else if (q.includes('pourquoi') && q.includes('gagn')) {
        text = ctx.hasStatistics
          ? 'Consulte l’onglet Stats pour les chiffres du match. Analyse détaillée IA à venir.'
          : 'Statistiques non disponibles pour ce match — impossible d’expliquer la victoire avec certitude.';
      } else {
        text = `${ctx.homeLabel} vs ${ctx.awayLabel}${ctx.competition ? ` (${ctx.competition})` : ''}. Pose une question sur le score, les événements ou le contexte.`;
      }

      const reply: SupporterAgentReply = { text, disclaimer: SUPPORTER_AGENT_DISCLAIMER };
      setLastReply(reply);
      return reply;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => setLastReply(null), []);

  return { ask, loading, lastReply, reset };
}
