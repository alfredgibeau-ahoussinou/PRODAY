/**
 * État conversationnel du Copilote — un seul hook partagé par les pôles.
 *
 * Le service de génération est **injecté** (`ask`) : le hook ignore quel pôle parle, et les
 * tests peuvent vérifier l'orchestration (doublons, arrêt, reprise, persistance) sans réseau.
 *
 * Fiabilité tenue ici :
 *   - **un seul appel en vol** : une seconde demande est refusée tant que la première court ;
 *   - **arrêt réel** : l'arrêt invalide le tour (compteur de génération) ; une réponse qui
 *     arrive après l'arrêt est ignorée au lieu d'écraser l'écran ;
 *   - **un échec reste un échec** : le motif du serveur est conservé tel quel, sans réponse
 *     de remplacement pré-écrite présentée comme une réponse du modèle ;
 *   - **persistance non bloquante** : un échec d'écriture est signalé, jamais présenté comme
 *     un enregistrement réussi.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  appendMessage,
  conversationForRetry,
  copilotRetryDelay,
  createConversation,
  isGenerating,
  isPersistable,
  makePendingAssistantMessage,
  makeUserMessage,
  replaceMessage,
  upsertConversation,
  humanizeCopilotError,
} from './copilotCore';
import type { CopilotConversation, CopilotMessage } from './copilotCore';
import { loadConversations, saveConversations } from './copilotStore';

export type CopilotAskInput = {
  messages: { role: 'user' | 'assistant'; content: string }[];
};

export type CopilotAskResult = {
  reply: string;
  model?: string;
  agents?: string[];
};

export type CopilotAsk = (input: CopilotAskInput) => Promise<CopilotAskResult>;

export type CopilotController = {
  conversations: CopilotConversation[];
  active: CopilotConversation | null;
  generating: boolean;
  send: (text: string) => Promise<void>;
  stop: () => void;
  retry: (assistantMessageId: string) => Promise<void>;
  newConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  /** Message à afficher quand l'historique n'a pas pu être lu : rien n'est affirmé à sa place. */
  storageWarning: string | null;
  /** Délai restant avant qu'un « Réessayer » ne soit permis (0 = immédiat). */
  retryDelayMs: number;
};

export function useCopilot(scopeKey: string, ask: CopilotAsk): CopilotController {
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [loadedScope, setLoadedScope] = useState<string | null>(null);
  /** Horloge lente (1 s) — ne sert qu'à rafraîchir le délai d'attente affiché. */
  const [now, setNow] = useState(() => Date.now());

  const coolingDown = useMemo(
    () =>
      (conversations.some((c) =>
        c.messages.some((m) => m.status === 'failed' && copilotRetryDelay(m, now) > 0),
      ) ?? false),
    [conversations, now],
  );

  useEffect(() => {
    if (!coolingDown) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [coolingDown]);

  /** Incrémenté à chaque nouveau tour : invalide toute réponse d'un tour abandonné. */
  const runRef = useRef(0);
  /** Empêche deux envois simultanés même si l'état React n'est pas encore rafraîchi. */
  const inFlightRef = useRef(false);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  // Chargement par portée. Un changement de portée repart d'un historique vide : c'est ce qui
  // empêche de réutiliser un contexte restreint après un changement de rôle ou de club.
  useEffect(() => {
    let cancelled = false;
    setConversations([]);
    setActiveId(null);
    setStorageWarning(null);
    inFlightRef.current = false;
    runRef.current += 1;

    void (async () => {
      const result = await loadConversations(scopeKey);
      if (cancelled) return;
      setConversations(result.conversations);
      setActiveId(result.conversations[0]?.id ?? null);
      setLoadedScope(scopeKey);
      if (result.failed) {
        setStorageWarning("Historique local illisible : les conversations précédentes ne sont pas affichées.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scopeKey]);

  const persist = useCallback(
    (list: CopilotConversation[]) => {
      if (loadedScope !== scopeKey) return;
      void saveConversations(scopeKey, list).then((res) => {
        if (!res.ok) {
          setStorageWarning(
            `Conversation non enregistrée sur cet appareil : ${res.reason ?? 'stockage indisponible'}.`,
          );
        }
      });
    },
    [loadedScope, scopeKey],
  );

  const runTurn = useCallback(
    async (
      conv: CopilotConversation,
      userText: string,
      options?: { reuseLastUser?: boolean },
    ) => {
      const runId = runRef.current + 1;
      runRef.current = runId;

      const userMsg = makeUserMessage(userText);
      const pending = makePendingAssistantMessage(userMsg.createdAt + 1);

      let working = options?.reuseLastUser ? conv : appendMessage(conv, userMsg);
      working = appendMessage(working, pending);
      setConversations((prev) => upsertConversation(prev, working));
      setActiveId(working.id);

      const history = [
        ...working.messages
          .filter((m) => m.status === 'complete' && m.content.trim().length > 0)
          .map((m) => ({ role: m.role, content: m.content })),
      ];

      try {
        const result = await ask({ messages: history });
        if (runRef.current !== runId) return; // tour arrêté ou remplacé : la réponse est ignorée
        const reply = result.reply?.trim();
        if (!reply) {
          const failed = replaceMessage(working, pending.id, {
            status: 'failed',
            error: 'Le modèle n’a renvoyé aucun contenu. Réessayez.',
          });
          setConversations((prev) => {
            const next = upsertConversation(prev, failed);
            persist(next);
            return next;
          });
          return;
        }
        const done = replaceMessage(working, pending.id, {
          status: 'complete',
          content: reply,
          model: result.model,
          agents: result.agents,
        });
        setConversations((prev) => {
          const next = upsertConversation(prev, done);
          persist(next);
          return next;
        });
      } catch (e) {
        if (runRef.current !== runId) return;
        // L'erreur brute du fournisseur n'est jamais affichée telle quelle (429 + JSON constatés
        // en conditions réelles) : elle est traduite en cause et en action.
        const reason = humanizeCopilotError(e instanceof Error ? e.message : '');
        const failed = replaceMessage(working, pending.id, {
          status: 'failed',
          error: reason,
          /** Horodaté pour armer le délai d'attente d'un « Réessayer » sur limite de débit. */
          failedAt: Date.now(),
        });
        setConversations((prev) => {
          const next = upsertConversation(prev, failed);
          persist(next);
          return next;
        });
      }
    },
    [ask, persist],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || inFlightRef.current) return;
      inFlightRef.current = true;

      const base = active ?? createConversation(scopeKey);
      try {
        await runTurn(base, trimmed);
      } finally {
        inFlightRef.current = false;
      }
    },
    [active, runTurn, scopeKey],
  );

  const stop = useCallback(() => {
    runRef.current += 1;
    inFlightRef.current = false;
    setConversations((prev) => {
      const conv = prev.find((c) => c.id === activeId);
      if (!conv) return prev;
      const pendingIdx = conv.messages.findIndex(
        (m) => m.role === 'assistant' && m.status === 'pending',
      );
      if (pendingIdx < 0) return prev;
      const target = conv.messages[pendingIdx];
      if (!target) return prev;
      const next = upsertConversation(prev, replaceMessage(conv, target.id, { status: 'stopped' }));
      persist(next);
      return next;
    });
  }, [activeId, persist]);

  const retry = useCallback(
    async (assistantMessageId: string) => {
      if (inFlightRef.current) return;
      const conv = active;
      if (!conv) return;
      const target = conv.messages.find((m) => m.id === assistantMessageId);
      /**
       * Un échec de limite de débit ne se rejoue pas immédiatement : le limiteur
       * du fournisseur n'a pas rouvert, le refus serait identique. Le délai
       * restant est exposé pour que l'interface l'affiche.
       */
      if (copilotRetryDelay(target, Date.now()) > 0) return;
      const plan = conversationForRetry(conv, assistantMessageId);
      if (!plan) return;
      inFlightRef.current = true;
      try {
        await runTurn(plan.conv, plan.userText, { reuseLastUser: plan.reuseLastUser });
      } finally {
        inFlightRef.current = false;
      }
    },
    [active, runTurn],
  );

  const newConversation = useCallback(() => {
    runRef.current += 1;
    inFlightRef.current = false;
    const conv = createConversation(scopeKey);
    setConversations((prev) => upsertConversation(prev, conv));
    setActiveId(conv.id);
  }, [scopeKey]);

  const selectConversation = useCallback((id: string) => {
    runRef.current += 1;
    inFlightRef.current = false;
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      runRef.current += 1;
      inFlightRef.current = false;
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        persist(next);
        setActiveId((current) => {
          if (current !== id) return current;
          const firstPersistable = next.find((c) => isPersistable(c)) ?? next[0];
          return firstPersistable?.id ?? null;
        });
        return next;
      });
    },
    [persist],
  );

  const generating = isGenerating(active);

  return {
    conversations,
    active,
    generating,
    send,
    stop,
    retry,
    /** Délai restant avant qu'un « Réessayer » ne soit permis (0 = immédiat). */
    retryDelayMs: copilotRetryDelay(
      active?.messages.find((m) => m.status === 'failed') ?? null,
      now,
    ),
    newConversation,
    selectConversation,
    deleteConversation,
    storageWarning,
  };
}

export type { CopilotConversation, CopilotMessage };
