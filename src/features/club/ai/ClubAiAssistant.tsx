import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubShellNav } from '../shell/ClubShellNavContext';
import { useClubTheme } from '../shell/ClubThemeContext';
import { useClubWorkspace } from '../hooks/useClubWorkspace';
import { ClubBrandHeader } from '../ui/ClubBrandHeader';
import { ClubActionRow, ClubText } from '../ui/clubUi';
import { planClubAiReply } from './clubAiExecutor';
import {
  sendClubAssistantMessage,
  type ClubAssistantChatMessage,
} from '../../../services/clubAssistant.service';
import { teamEventsService } from '../../../services/teamEvents.service';
import { isCoachTrainingEvent } from '../../../models/TeamEvent';
import { stripDashTypography } from '../../../utils/stripDashTypography';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

const STARTERS = [
  'Donne-moi le briefing du club aujourd’hui',
  'J’ai des adhésions en attente, tu me guides ?',
  'Aide-moi à affecter un coach',
  'Quels rappels de convocation envoyer ?',
];

const WELCOME =
  'Salut — je suis le copilote Club. Pose ta question sur les équipes, adhésions, matchs ou la formule. Les actions sensibles demanderont toujours ton OK.';

/**
 * Copilote Club — dialogue Mistral (clubAssistantChat) + confirmations locales
 * pour les actions sensibles (jamais d’auto-mouvement de joueurs).
 */
export function ClubAiAssistant() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: '0', role: 'assistant', text: WELCOME },
  ]);
  const scrollRef = useRef<ScrollView>(null);
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

  const maybeConfirmSensitive = (text: string) => {
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
    return plan;
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', text: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    const localPlan = maybeConfirmSensitive(trimmed);

    try {
      const history: ClubAssistantChatMessage[] = next
        .filter((m) => m.id !== '0')
        .map((m) => ({ role: m.role, content: m.text }));
      const res = await sendClubAssistantMessage(
        history.length > 0 ? history : [{ role: 'user', content: trimmed }],
      );
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: stripDashTypography(res.reply),
        },
      ]);
    } catch (e) {
      const fallback = stripDashTypography(localPlan.reply);
      const errHint =
        e instanceof Error && e.message
          ? ` (${e.message})`
          : '';
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text:
            fallback ||
            `Copilote indisponible pour le moment${errHint}. Réessaie dans un instant, ou utilise les actions proposées ci-dessous.`,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <ClubBrandHeader
            title="Copilote Club"
            subtitle="Dialogue réel · confirmation avant action"
          />

          <View style={styles.thread}>
            {messages.map((m) => (
              <View
                key={m.id}
                style={[styles.bubble, m.role === 'user' ? styles.user : styles.bot]}
              >
                {m.role === 'assistant' ? (
                  <ClubText variant="label" style={{ color: tokens.accent, marginBottom: 4 }}>
                    Copilote
                  </ClubText>
                ) : null}
                <ClubText
                  variant="body"
                  style={m.role === 'user' ? { color: tokens.onAccent } : undefined}
                >
                  {m.text}
                </ClubText>
              </View>
            ))}
            {loading ? (
              <View style={[styles.bubble, styles.bot, styles.typing]}>
                <ActivityIndicator color={tokens.accent} size="small" />
                <ClubText variant="caption" muted>
                  En train d’écrire…
                </ClubText>
              </View>
            ) : null}
          </View>

          {messages.length <= 1 ? (
            <View style={styles.starters}>
              {STARTERS.map((s) => (
                <PressableSpring
                  key={s}
                  onPress={() => void send(s)}
                  scaleTo={0.97}
                  haptic
                  style={styles.starter}
                >
                  <ClubText variant="caption" numberOfLines={2} style={{ fontWeight: '600' }}>
                    {s}
                  </ClubText>
                </PressableSpring>
              ))}
            </View>
          ) : null}

          <View style={styles.actions}>
            <ClubText variant="label" muted>
              Actions proposées
            </ClubText>
            <ClubActionRow
              icon="chat"
              label="Briefing du jour"
              onPress={() => void send('Donne-moi le briefing aujourd’hui')}
            />
            <ClubActionRow
              icon="notifications"
              label="Ouvrir les notifications"
              onPress={() => void send('Montre les notifications')}
            />
            <ClubActionRow
              icon="warning"
              label="Rappels de convocation"
              hint="Demande toujours confirmation"
              onPress={() => void send('Envoie les rappels de convocation')}
            />
            <ClubActionRow
              icon="school"
              label="Affectation coach"
              hint="Confirmation avant ouverture"
              onPress={() => void send('Aide-moi à affecter un coach')}
            />
          </View>
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Parle-moi de ton club…"
            placeholderTextColor={tokens.muted}
            style={styles.input}
            editable={!loading}
            multiline
            maxLength={1200}
            onSubmitEditing={() => void send(input)}
            blurOnSubmit={false}
          />
          <PressableSpring
            onPress={() => void send(input)}
            scaleTo={0.94}
            haptic
            disabled={loading || !input.trim()}
            style={[styles.send, (!input.trim() || loading) && styles.sendDisabled]}
            accessibilityLabel="Envoyer"
          >
            <Icon name="chevron-forward" size={18} color={tokens.onAccent} />
          </PressableSpring>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    flex: { flex: 1, minHeight: 0 },
    scroll: {
      paddingHorizontal: clubSpace.lg,
      paddingBottom: clubSpace.xl,
      gap: clubSpace.md,
    },
    thread: { gap: clubSpace.sm },
    bubble: {
      padding: clubSpace.md,
      borderRadius: clubRadius.lg,
      maxWidth: '94%',
    },
    user: {
      backgroundColor: tokens.accent,
      alignSelf: 'flex-end',
      borderBottomRightRadius: clubRadius.xs,
    },
    bot: {
      backgroundColor: tokens.elevated,
      alignSelf: 'flex-start',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      borderBottomLeftRadius: clubRadius.xs,
      ...clubShadow.soft,
    },
    typing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
    },
    starters: { flexDirection: 'row', flexWrap: 'wrap', gap: clubSpace.sm },
    starter: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.borderStrong,
      borderRadius: clubRadius.md,
      paddingHorizontal: clubSpace.md,
      paddingVertical: 10,
      backgroundColor: tokens.surface,
      maxWidth: '100%',
    },
    actions: { gap: clubSpace.sm },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: clubSpace.sm,
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.sm,
      paddingBottom: clubSpace.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 110,
      backgroundColor: tokens.surface,
      borderRadius: clubRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      paddingHorizontal: clubSpace.md,
      paddingVertical: 12,
      color: tokens.foreground,
      fontSize: 15,
    },
    send: {
      width: 44,
      height: 44,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accent,
    },
    sendDisabled: { opacity: 0.4 },
  });
