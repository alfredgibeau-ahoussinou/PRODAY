import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { useClubShellNav } from '../shell/ClubShellNavContext';
import { useClubTheme } from '../shell/ClubThemeContext';
import { useClubWorkspace } from '../hooks/useClubWorkspace';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubSectionCard,
  ClubText,
} from '../ui/clubUi';
import { ClubBrandHeader } from '../ui/ClubBrandHeader';
import { planClubAiReply } from './clubAiExecutor';
import { teamEventsService } from '../../../services/teamEvents.service';
import { isCoachTrainingEvent } from '../../../models/TeamEvent';
import { spacing } from '../../../theme/designTokens';
import type { ClubThemeTokens } from '../theme/clubTokens';

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

/**
 * Assistant IA Club — planificateur local + confirmation avant actions sensibles.
 * Stub LLM distant : exécute seulement des actions locales autorisées après OK.
 */
export function ClubAiAssistant() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: '0',
      role: 'assistant',
      text: 'Je recommande, je ne décide pas. Demandez-moi un briefing, une checklist ou une suggestion d’affectation — toute action sensible demandera votre OK.',
    },
  ]);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const runSensitive = (id: string) => {
    if (id === 'propose_assign_coach' || id === 'refuse_auto_move') {
      shellNav?.requestNav(id === 'refuse_auto_move' ? 'recruitment' : 'coaches');
      return;
    }
    if (id === 'nav_trainings') {
      shellNav?.requestNav('trainings');
      return;
    }
    if (id === 'propose_send_reminders') {
      const target =
        ws.todayTrainings[0] ??
        ws.events.find((e) => isCoachTrainingEvent(e));
      if (!target) {
        Alert.alert('Rappels', 'Aucune séance trouvée.');
        return;
      }
      void (async () => {
        try {
          const pending = await teamEventsService.sendReminders(target.id);
          Alert.alert(
            'Rappels envoyés',
            pending > 0
              ? `${pending} joueur(s) encore en attente ont été relancés.`
              : 'Aucun rappel en attente pour cette séance.',
          );
        } catch (e) {
          Alert.alert(
            'Rappels',
            e instanceof Error
              ? e.message
              : 'Envoi distant indisponible — ouvrez la séance pour relancer manuellement.',
          );
          shellNav?.requestNav('trainings');
        }
      })();
    }
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    const plan = planClubAiReply(trimmed, ws);
    const assistantMsg: Msg = { id: `a-${Date.now()}`, role: 'assistant', text: plan.reply };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');

    if (plan.safeNav) {
      shellNav?.requestNav(plan.safeNav);
    }
    if (plan.sensitive) {
      const s = plan.sensitive;
      Alert.alert(s.title, s.body, [
        { text: 'Annuler', style: 'cancel' },
        { text: s.confirmLabel, onPress: () => runSensitive(s.id) },
      ]);
    }
  };

  return (
    <View style={styles.root}>
      <ClubChapterScroll>
        <ClubBrandHeader
          title="Assistant IA"
          subtitle="Recommandations · confirmation obligatoire"
        />

        <ClubSectionCard title="Conversation">
          {messages.map((m) => (
            <View
              key={m.id}
              style={[styles.bubble, m.role === 'user' ? styles.user : styles.bot]}
            >
              <ClubText variant="body" style={m.role === 'user' ? { color: '#fff' } : undefined}>
                {m.text}
              </ClubText>
            </View>
          ))}
        </ClubSectionCard>

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Posez une question…"
            placeholderTextColor={tokens.muted}
            style={styles.input}
            onSubmitEditing={() => send(input)}
          />
          <PressableSpring onPress={() => send(input)} scaleTo={0.96} haptic style={styles.send}>
            <ClubText variant="caption" style={{ color: '#fff', fontWeight: '700' }}>
              Envoyer
            </ClubText>
          </PressableSpring>
        </View>

        <ClubSectionCard title="Actions proposées">
          <ClubActionRow
            icon="star-four-points"
            label="Briefing du jour"
            onPress={() => send('Donne-moi le briefing aujourd’hui')}
          />
          <ClubActionRow
            icon="notifications"
            label="Ouvrir les notifications"
            onPress={() => send('Montre les notifications')}
          />
          <ClubActionRow
            icon="warning"
            label="Rappels de convocation"
            hint="Demande toujours confirmation"
            onPress={() => send('Envoie les rappels de convocation')}
          />
          <ClubActionRow
            icon="school"
            label="Affectation coach"
            hint="Confirmation avant ouverture"
            onPress={() => send('Aide-moi à affecter un coach')}
          />
        </ClubSectionCard>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    bubble: {
      padding: spacing.md,
      borderRadius: 14,
      marginBottom: spacing.sm,
    },
    user: { backgroundColor: tokens.accent, alignSelf: 'flex-end', maxWidth: '92%' },
    bot: {
      backgroundColor: tokens.elevated,
      alignSelf: 'flex-start',
      maxWidth: '92%',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    composer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    input: {
      flex: 1,
      backgroundColor: tokens.surface,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: tokens.foreground,
    },
    send: {
      backgroundColor: tokens.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderRadius: 12,
    },
  });
