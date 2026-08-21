import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { sendPresidentAssistantMessage } from '../../../services/presidentAssistant.service';
import { usePresidentTheme } from '../shell/PresidentThemeContext';
import {
  PresidentConfirmModal,
  PresidentText,
} from '../ui/presidentUi';
import {
  presidentRadius,
  presidentSpace,
} from '../theme/presidentDesignSystem';
import type { PresidentThemeTokens } from '../theme/presidentTokens';
import type { ClubWorkspace } from '../../club/hooks/useClubWorkspace';

type Msg = { role: 'user' | 'assistant'; content: string };

type Props = {
  workspace: ClubWorkspace;
  /** Insights heuristiques affichés en amont. */
  insights?: string[];
};

/**
 * Assistant exécutif — CF `presidentAssistantChat` (Mistral).
 * Actions sensibles : confirmation avant « préparer message / rapport ».
 */
export function PresidentAiPanel({ workspace, insights = [] }: Props) {
  const { tokens } = usePresidentTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<'message' | 'report' | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy) return;
      const next: Msg[] = [...messages, { role: 'user', content }];
      setMessages(next);
      setDraft('');
      setBusy(true);
      try {
        const result = await sendPresidentAssistantMessage(next, {
          clubName: workspace.club?.name,
          teamsCount: workspace.teams.length,
          playersCount: workspace.players.length,
          coachesCount: workspace.coaches.length,
          pendingMemberships: workspace.pendingMemberships,
          teamsWithoutCoach: workspace.teamsWithoutCoach,
        });
        setMessages([...next, { role: 'assistant', content: result.reply }]);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : 'Assistant indisponible pour le moment.';
        Alert.alert('Assistant Président', msg);
        setMessages(next);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, workspace],
  );

  const runStubAction = (kind: 'message' | 'report') => {
    setConfirm(null);
    const prompt =
      kind === 'message'
        ? 'Prépare un message court aux adhérents sur l’état du club cette semaine (brouillon uniquement).'
        : 'Prépare une trame de rapport de direction (points sportifs, humains, admin) sans inventer de chiffres hors contexte.';
    void send(prompt);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {insights.length > 0 && messages.length === 0 ? (
        <View style={styles.insights}>
          <PresidentText variant="label" champagne>
            Centre de décision
          </PresidentText>
          {insights.slice(0, 3).map((line, i) => (
            <PresidentText key={i} variant="body" muted>
              {i + 1}. {line}
            </PresidentText>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <PressableSpring
          onPress={() => setConfirm('message')}
          scaleTo={0.97}
          haptic
          style={styles.chip}
        >
          <Icon name="mail" size={14} color={tokens.accent} />
          <PresidentText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Préparer un message
          </PresidentText>
        </PressableSpring>
        <PressableSpring
          onPress={() => setConfirm('report')}
          scaleTo={0.97}
          haptic
          style={styles.chip}
        >
          <Icon name="document" size={14} color={tokens.accent} />
          <PresidentText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
            Préparer un rapport
          </PresidentText>
        </PressableSpring>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ gap: presidentSpace.sm, paddingBottom: presidentSpace.md }}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
            ]}
          >
            <PresidentText variant="body">{item.content}</PresidentText>
          </View>
        )}
        ListEmptyComponent={
          <PresidentText variant="body" muted style={{ paddingVertical: presidentSpace.lg }}>
            Posez une question de direction. L’IA s’appuie sur le contexte réel de votre club.
            Clé serveur : MISTRAL_API_KEY (CF presidentAssistantChat).
          </PresidentText>
        }
      />

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Conseil exécutif…"
          placeholderTextColor={tokens.faint}
          style={styles.input}
          editable={!busy}
          onSubmitEditing={() => void send(draft)}
        />
        <PressableSpring
          onPress={() => void send(draft)}
          disabled={busy || !draft.trim()}
          scaleTo={0.94}
          haptic
          style={[styles.send, (busy || !draft.trim()) && { opacity: 0.5 }]}
        >
          {busy ? (
            <ActivityIndicator color={tokens.accentText} size="small" />
          ) : (
            <Icon name="chevron-forward" size={18} color={tokens.accentText} />
          )}
        </PressableSpring>
      </View>

      <PresidentConfirmModal
        visible={confirm !== null}
        title={confirm === 'report' ? 'Préparer un rapport ?' : 'Préparer un message ?'}
        body="Brouillon uniquement. Aucun envoi automatique aux adhérents ni publication."
        confirmLabel="Confirmer"
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && runStubAction(confirm)}
      />
    </KeyboardAvoidingView>
  );
}

function createStyles(tokens: PresidentThemeTokens) {
  return StyleSheet.create({
    root: { flex: 1, gap: presidentSpace.md },
    insights: {
      gap: 6,
      padding: presidentSpace.md,
      borderRadius: presidentRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
    },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: presidentSpace.sm },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: presidentSpace.md,
      paddingVertical: presidentSpace.sm,
      borderRadius: presidentRadius.pill,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      backgroundColor: tokens.accentSoft,
    },
    bubble: {
      padding: presidentSpace.md,
      borderRadius: presidentRadius.md,
      maxWidth: '92%',
    },
    bubbleUser: {
      alignSelf: 'flex-end',
      backgroundColor: tokens.accentSoft,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
    },
    bubbleAi: {
      alignSelf: 'flex-start',
      backgroundColor: tokens.surfaceRaised,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: presidentSpace.sm,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: presidentRadius.lg,
      paddingLeft: presidentSpace.md,
      paddingRight: 6,
      paddingVertical: 6,
      backgroundColor: tokens.surfaceRaised,
    },
    input: {
      flex: 1,
      color: tokens.foreground,
      fontSize: 15,
      paddingVertical: 10,
    },
    send: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
