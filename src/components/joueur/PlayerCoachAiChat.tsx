import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import {
  sendPlayerCoachMessage,
  type PlayerCoachAiMessage,
} from '../../services/playerCoachAi.service';
import { PLAYER_COACH_STARTERS } from '../../content/playerCoachAiCopy';
import { stripDashTypography } from '../../utils/stripDashTypography';
import { joueurGamePress } from '../../features/joueur/joueurSfx';
import { radius, spacing } from '../../theme/designTokens';

type Bubble = PlayerCoachAiMessage & { id: string };

const WELCOME =
  'Salut ! Je suis ton Coach IA ProDay. Je m’appuie sur ton profil, tes matchs et ta forme pour te guider. Pas de diagnostic médical : si une donnée manque, je te le dis.';

export { PLAYER_COACH_STARTERS } from '../../content/playerCoachAiCopy';

type Props = {
  starters?: string[];
  compact?: boolean;
};

/** Chat Coach IA joueur — contexte réel via playerCoachAiChat. */
export function PlayerCoachAiChat({
  starters = PLAYER_COACH_STARTERS,
  compact = false,
}: Props) {
  const session = useJoueurSession();
  const accent = session?.identity?.accent ?? '#4C8BFF';
  const accentBright = session?.identity?.accentBright ?? '#93C5FD';

  const [messages, setMessages] = useState<Bubble[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const styles = useMemo(() => createStyles(accent, accentBright), [accent, accentBright]);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages, sending]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    joueurGamePress();
    setError(null);
    setDraft('');
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Coach IA indisponible.');
      setMessages((prev) => prev.slice(0, -1));
      setDraft(content);
    } finally {
      setSending(false);
    }
  };

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
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.starters}
      >
        {starters.map((s) => (
          <PressableSpring key={s} style={styles.chip} onPress={() => send(s)} scaleTo={0.97}>
            <ProDayText variant="caption" style={styles.chipText}>
              {s}
            </ProDayText>
          </PressableSpring>
        ))}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Demande à ton Coach IA…"
          placeholderTextColor="rgba(243,248,255,0.4)"
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
    userText: { color: '#F3F8FF' },
    aiText: { color: 'rgba(243,248,255,0.9)' },
    error: { color: '#F87171', marginTop: spacing.xs },
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
      color: '#F3F8FF',
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
