import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { useAuth } from '../../context/AuthContext';
import {
  sendPlayerCoachMessage,
  type PlayerAiAction,
  type PlayerCoachAiMessage,
} from '../../services/playerCoachAi.service';
import { PLAYER_COACH_STARTERS } from '../../content/playerCoachAiCopy';
import { stripDashTypography } from '../../utils/stripDashTypography';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { radius, spacing } from '../../theme/designTokens';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import {
  isHomeTrainingIntent,
  isWeeklySummaryIntent,
  parseTrainingParams,
  parseWeeklyGoalIntent,
  resolveNavigationIntent,
  type PlayerNavigateTab,
} from '../../utils/playerCoachIntent';
import { teamEventsService } from '../../services/teamEvents.service';
import { careerPreferencesService } from '../../services/careerPreferences.service';

type Bubble = PlayerCoachAiMessage & { id: string };

const WELCOME =
  'Salut ! Je suis ton Coach IA ProDay. Je m’appuie sur ton profil, tes matchs et ta forme pour te guider. Pas de diagnostic médical : si une donnée manque, je te le dis.';

export { PLAYER_COACH_STARTERS } from '../../content/playerCoachAiCopy';

type Props = {
  starters?: string[];
  compact?: boolean;
};

function navigateTab(nav: ReturnType<typeof useTabNavigationActions>, tab: PlayerNavigateTab) {
  switch (tab) {
    case 'home':
      nav.setActiveTab('home');
      break;
    case 'matchs':
      nav.setActiveTab('matchs');
      break;
    case 'feed':
      nav.setActiveTab('feed');
      break;
    case 'profil':
      nav.setActiveTab('profil');
      break;
    case 'plus':
      nav.setActiveTab('plus');
      break;
    case 'messages':
      nav.setActiveTab('messages');
      break;
    case 'train_ai':
      nav.openDashboard('train_ai');
      break;
    default:
      break;
  }
}

/** Chat Coach IA joueur — Command Center avec actions structurées. */
export function PlayerCoachAiChat({
  starters = PLAYER_COACH_STARTERS,
  compact = false,
}: Props) {
  const session = useJoueurSession();
  const { profile } = useAuth();
  const nav = useTabNavigationActions();
  const accent = session?.identity?.accent ?? PLAYER_DARK.accent;
  const accentBright = session?.identity?.accentBright ?? PLAYER_DARK.accentAlt;

  const [messages, setMessages] = useState<Bubble[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingCta, setTrainingCta] = useState(false);
  const [followUpChips, setFollowUpChips] = useState<string[]>([]);
  const [pendingActions, setPendingActions] = useState<PlayerAiAction[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const styles = useMemo(() => createStyles(accent, accentBright), [accent, accentBright]);
  const showStarters = messages.length <= 1;

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages, sending, pendingActions]);

  const executeAction = useCallback(
    async (action: PlayerAiAction, confirmed = false) => {
      joueurGamePress();
      switch (action.type) {
        case 'navigate':
          navigateTab(nav, action.tab as PlayerNavigateTab);
          break;
        case 'open_training':
          nav.openDashboard('train_ai');
          break;
        case 'generate_training':
          nav.openDashboard('train_ai');
          break;
        case 'save_weekly_goal':
          if (profile?.uid) {
            await careerPreferencesService.setWeeklyFocus(profile.uid, action.goal);
          }
          break;
        case 'report_late':
          if (!confirmed) {
            Alert.alert(
              'Confirmer le retard',
              'Signaler ton retard au staff pour le prochain événement ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Confirmer',
                  onPress: () => void executeAction(action, true),
                },
              ],
            );
            return;
          }
          if (profile?.uid) {
            await teamEventsService.reportLate(action.eventId, profile.uid, action.delay);
          }
          break;
        default:
          break;
      }
    },
    [nav, profile?.uid],
  );

  const runClientIntents = useCallback(
    (content: string) => {
      const navTab = resolveNavigationIntent(content);
      if (navTab) {
        navigateTab(nav, navTab);
        return true;
      }
      if (isWeeklySummaryIntent(content)) {
        return false;
      }
      const goal = parseWeeklyGoalIntent(content);
      if (goal && profile?.uid) {
        void careerPreferencesService.setWeeklyFocus(profile.uid, goal);
      }
      return false;
    },
    [profile?.uid],
  );

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    joueurGamePress();
    setError(null);
    setTrainingCta(false);
    setFollowUpChips([]);
    setPendingActions([]);
    setDraft('');

    runClientIntents(content);

    const trainingIntent = isHomeTrainingIntent(content);
    const userMsg: Bubble = { id: `u-${Date.now()}`, role: 'user', content };
    const next = [...messages.filter((m) => m.id !== 'welcome'), userMsg];
    setMessages([...next]);
    setSending(true);

    try {
      const history: PlayerCoachAiMessage[] = next.map(({ role, content: c }) => ({
        role,
        content: c,
      }));
      const result = await sendPlayerCoachMessage(history);
      const reply = stripDashTypography(result.reply);
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: reply },
      ]);

      if (result.suggestions?.length) {
        setFollowUpChips(result.suggestions);
      }

      const actions = result.actions ?? [];
      const autoActions = actions.filter((a) => a.type === 'save_weekly_goal');
      const confirmActions = actions.filter((a) => a.type !== 'save_weekly_goal');

      for (const action of autoActions) {
        await executeAction(action, true);
      }

      if (confirmActions.length > 0) {
        setPendingActions(confirmActions);
      }

      if (
        trainingIntent ||
        isHomeTrainingIntent(reply) ||
        actions.some((a) => a.type === 'generate_training' || a.type === 'open_training')
      ) {
        setTrainingCta(true);
      }

      const trainingParams = parseTrainingParams(content);
      if (trainingParams && trainingIntent) {
        setTrainingCta(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Coach IA indisponible.');
      setMessages((prev) => prev.slice(0, -1));
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

  const actionLabel = (action: PlayerAiAction): string => {
    switch (action.type) {
      case 'navigate':
        return `Ouvrir ${action.tab}`;
      case 'open_training':
      case 'generate_training':
        return 'Créer ma séance';
      case 'report_late':
        return 'Signaler mon retard';
      case 'save_weekly_goal':
        return 'Objectif enregistré';
      default:
        return 'Action';
    }
  };

  const chips = showStarters ? starters : followUpChips;

  return (
    <KeyboardAvoidingView
      style={[styles.root, compact && styles.compactRoot]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={compact ? 8 : 64}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadPad}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[styles.bubble, m.role === 'user' ? styles.userBubble : styles.aiBubble]}
          >
            <ProDayText
              variant="body"
              style={m.role === 'user' ? styles.userText : styles.aiText}
            >
              {m.content}
            </ProDayText>
          </View>
        ))}
        {sending ? (
          <View style={styles.aiBubble}>
            <ActivityIndicator color={accent} />
          </View>
        ) : null}
        {error ? (
          <ProDayText variant="caption" style={styles.error}>
            {error}
          </ProDayText>
        ) : null}
        {pendingActions.map((action, idx) => (
          <PressableSpring
            key={`action-${idx}`}
            style={[styles.actionCta, { borderColor: accent, backgroundColor: `${accent}22` }]}
            onPress={() => void executeAction(action)}
            scaleTo={0.97}
            haptic
          >
            <Icon name="star-four-points" size={16} color={accentBright} />
            <ProDayText variant="caption" style={[styles.actionCtaText, { color: accentBright }]}>
              {actionLabel(action)}
            </ProDayText>
          </PressableSpring>
        ))}
        {trainingCta ? (
          <PressableSpring
            style={[styles.trainingCta, { borderColor: accent, backgroundColor: `${accent}22` }]}
            onPress={() => {
              joueurGamePress();
              nav.openDashboard('train_ai');
            }}
            scaleTo={0.97}
            haptic
          >
            <Icon name="star-four-points" size={18} color={accentBright} />
            <ProDayText variant="caption" style={[styles.trainingCtaText, { color: accentBright }]}>
              Créer mon entraînement
            </ProDayText>
          </PressableSpring>
        ) : null}
      </ScrollView>

      {chips.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.starters}
        >
          {chips.map((s) => (
            <PressableSpring key={s} style={styles.chip} onPress={() => send(s)} scaleTo={0.97}>
              <ProDayText variant="caption" style={styles.chipText}>
                {s}
              </ProDayText>
            </PressableSpring>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Demande à ton Coach IA…"
          placeholderTextColor={PLAYER_DARK.textDim}
          style={styles.input}
          multiline
          maxLength={1200}
          editable={!sending}
        />
        <PressableSpring
          onPress={() => send(draft)}
          disabled={sending || !draft.trim()}
          scaleTo={0.97}
          style={[styles.send, { backgroundColor: accent }]}
        >
          <Icon name="chat" size={20} color="#fff" />
        </PressableSpring>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(accent: string, accentBright: string) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: JOUEUR_SITE.bg },
    compactRoot: { minHeight: 320 },
    thread: { flex: 1 },
    threadPad: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.lg },
    bubble: {
      maxWidth: '92%',
      padding: spacing.md,
      borderRadius: radius.lg,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: `${accent}33`,
      borderWidth: 1,
      borderColor: `${accent}55`,
    },
    aiBubble: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: JOUEUR_SITE.border,
    },
    userText: { color: PLAYER_DARK.text },
    aiText: { color: PLAYER_DARK.text },
    error: { color: '#F87171', marginTop: spacing.xs },
    actionCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      marginTop: spacing.xs,
    },
    actionCtaText: { fontWeight: '800' },
    trainingCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      marginTop: spacing.xs,
    },
    trainingCtaText: { fontWeight: '800' },
    starters: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: `${accentBright}44`,
    },
    chipText: { color: accentBright },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: JOUEUR_SITE.border,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.06)',
      color: PLAYER_DARK.text,
      fontSize: 15,
    },
    send: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
