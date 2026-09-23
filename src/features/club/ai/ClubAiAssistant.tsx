/**
 * Copilote IA du pôle Club / Admin — enveloppe du module conversationnel partagé.
 *
 * Ce qui a changé, et pourquoi :
 *   - l'ancien écran ouvrait la conversation par un message écrit localement, étiqueté
 *     « Google Gemini » : il présentait une copie statique comme une sortie de modèle. Le fil
 *     commence maintenant vide, avec des questions proposées explicitement présentées comme
 *     telles ;
 *   - en cas d'échec du service, il fusionnait un guide local dans la réponse de l'assistant.
 *     L'échec est désormais affiché comme un échec, avec son motif et une reprise ;
 *   - l'historique, l'arrêt, la reprise, la copie et la saisie multiligne viennent de
 *     `CopilotChat` / `useCopilot`, communs aux pôles.
 *
 * **Ce qui est conservé intact** : les actions à effet de bord du club. `planClubAiReply` décide
 * qu'une demande correspond à une opération réelle, `Alert` la fait confirmer, et le service
 * n'est appelé qu'après confirmation. Aucun message de succès n'est écrit sans retour du service.
 */
import React, { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CopilotChat } from '../../copilot/CopilotChat';
import { clubCopilotTokens } from '../../copilot/copilotTokens';
import { copilotScopeKey } from '../../copilot/copilotCore';
import { useCopilot } from '../../copilot/useCopilot';
import type { CopilotAsk } from '../../copilot/useCopilot';
import { useClubShellNav } from '../shell/ClubShellNavContext';
import { useClubTheme } from '../shell/ClubThemeContext';
import { useClubWorkspace } from '../hooks/useClubWorkspace';
import { planClubAiReply } from './clubAiExecutor';
import { sendClubAssistantMessage } from '../../../services/clubAssistant.service';
import { teamEventsService } from '../../../services/teamEvents.service';
import { isCoachTrainingEvent } from '../../../models/TeamEvent';
import { useSessionProfile } from '../../../hooks/useSessionProfile';

/** Questions proposées : ce sont des demandes, affichées comme telles, jamais des réponses. */
const CLUB_SUGGESTIONS = [
  'Donne-moi le briefing du club pour aujourd’hui',
  'Quelles adhésions et quels dossiers sont en attente ?',
  'Où en sont les convocations de la semaine ?',
  'Quelles équipes n’ont pas encore d’éducateur affecté ?',
];

export function ClubAiAssistant({ embedded = false }: { embedded?: boolean } = {}) {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();

  const clubName = ws.club?.name?.trim() || 'Club non chargé';
  const uid = profile?.uid ?? '';
  const role = profile?.role ?? 'club';

  const scopeKey = useMemo(
    () => copilotScopeKey({ uid, role, pole: 'club', clubId: ws.clubId ?? '' }),
    [uid, role, ws.clubId],
  );
  const copilotTokens = useMemo(() => clubCopilotTokens(tokens), [tokens]);

  /**
   * Exécute une opération à effet de bord **après** confirmation.
   * Aucun « envoyé » n'est affiché : seul le retour du service est rapporté, et un échec
   * affiche l'erreur réelle.
   */
  const runSensitive = useCallback(
    (id: string) => {
      if (id === 'propose_assign_coach' || id === 'refuse_auto_move') {
        shellNav?.requestNav(id === 'refuse_auto_move' ? 'players' : 'coaches');
        return;
      }
      if (id === 'nav_trainings') {
        shellNav?.requestNav('trainings');
        return;
      }
      if (id === 'propose_send_reminders') {
        const target = ws.todayTrainings[0] ?? ws.events.find((e) => isCoachTrainingEvent(e));
        if (!target) {
          Alert.alert('Rappels', 'Aucune séance trouvée.');
          return;
        }
        void (async () => {
          try {
            const pending = await teamEventsService.sendReminders(target.id);
            Alert.alert(
              'Rappels',
              pending > 0
                ? `Relance transmise pour ${pending} joueur(s) encore en attente.`
                : 'Aucun rappel en attente pour cette séance.',
            );
          } catch (e) {
            Alert.alert(
              'Rappels',
              e instanceof Error
                ? e.message
                : 'Envoi distant indisponible — ouvrez la séance pour relancer manuellement.',
            );
          }
        })();
      }
    },
    [shellNav, ws.events, ws.todayTrainings],
  );

  /** Interception du tour utilisateur : propose puis fait confirmer une action à effet de bord. */
  const onUserTurn = useCallback(
    (text: string) => {
      const plan = planClubAiReply(text, ws);
      if (plan.safeNav && !plan.sensitive) {
        shellNav?.requestNav(plan.safeNav);
      }
      if (plan.sensitive) {
        const s = plan.sensitive;
        Alert.alert(s.title, s.body, [
          { text: 'Annuler', style: 'cancel' },
          { text: s.confirmLabel, onPress: () => runSensitive(s.id) },
        ]);
      }
    },
    [runSensitive, shellNav, ws],
  );

  const ask = useCallback<CopilotAsk>(
    async ({ messages }) => {
      const res = await sendClubAssistantMessage(messages);
      return { reply: res.reply, model: res.model };
    },
    [],
  );

  const controller = useCopilot(scopeKey, ask);

  const contextLabel = [
    clubName,
    ws.teams.length > 0 ? `${ws.teams.length} équipe(s)` : null,
    ws.players.length > 0 ? `${ws.players.length} licencié(s)` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <CopilotChat
      tokens={copilotTokens}
      controller={controller}
      roleLabel="Copilote Club"
      contextLabel={contextLabel}
      serviceNote="Réponses générées côté serveur à partir des données autorisées de votre club. Les opérations réelles (rappels, affectations) demandent une confirmation explicite."
      suggestions={CLUB_SUGGESTIONS}
      placeholder="Posez votre question au copilote (Entrée pour un retour à la ligne)"
      bottomInset={embedded ? insets.bottom + 8 : insets.bottom + 12}
      onUserTurn={onUserTurn}
    />
  );
}
