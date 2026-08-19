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
import { useJoueurProgress } from '../../context/JoueurProgressContext';
import {
  sendPlayerTacticsMessage,
  type PlayerTacticsChatMessage,
} from '../../services/playerTacticsChat.service';
import { stripDashTypography } from '../../utils/stripDashTypography';
import { joueurGamePress, joueurGameReward } from '../../features/joueur/joueurSfx';
import { radius, spacing } from '../../theme/designTokens';

type Bubble = PlayerTacticsChatMessage & { id: string };

const WELCOME =
  'Salut, je suis ton Coach IA. On parle football et tactique : ton poste, le pressing, les transitions, les drills pour progresser. Dis-moi où tu veux monter de niveau.';

export const JOUEUR_TACTICS_STARTERS = [
  'Comment m’améliorer à mon poste ?',
  'Explique-moi le pressing haut simplement',
  'Drill 10 min pour mon 1v1',
  'Que faire si je suis ailier et on joue bas ?',
  'Comment lire un 4-3-3 quand je suis milieu ?',
];

type Props = {
  starters?: string[];
  compact?: boolean;
};

/**
 * Chat Coach IA joueur — football + tactique (Mistral).
 */
export function JoueurTacticsCoachChat({
  starters = JOUEUR_TACTICS_STARTERS,
  compact = false,
}: Props) {
  const session = useJoueurSession();
  const progress = useJoueurProgress();
  const accent = session?.identity.accent ?? '#4C8BFF';
  const accentBright = session?.identity.accentBright ?? '#93C5FD';

  const [messages, setMessages] = useState<Bubble[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const rewardedRef = useRef(false);

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
    const userMsg: Bubble = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
    };
    const next = [...messages, userMsg];
    setMessages(next);
    setSending(true);
    try {
      const history: PlayerTacticsChatMessage[] = next
        .filter((m) => m.id !== 'welcome')
        .map(({ role, content: c }) => ({ role, content: c }));
      const payload =
        history.length > 0
          ? history
          : ([{ role: 'user', content }] as PlayerTacticsChatMessage[]);
      const res = await sendPlayerTacticsMessage(payload);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: stripDashTypography(res.reply),
        },
      ]);
      if (!rewardedRef.current) {
        rewardedRef.current = true;
        void progress?.claimDaily('daily-coach', 30, 1);
        joueurGameReward('mission');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Envoi impossible.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: `Désolé, je n’ai pas pu répondre. ${msg} Réessaie dans un instant.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, compact && styles.rootCompact]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        contentContainerStyle={styles.threadContent}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <View
              key={m.id}
              style={[styles.row, isUser ? styles.rowUser : styles.rowBot]}
            >
              {!isUser ? (
                <View style={[styles.avatar, { borderColor: `${accent}55` }]}>
                  <Icon name="school" size={14} color={accentBright} />
                </View>
              ) : null}
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                {!isUser ? (
                  <ProDayText variant="caption" style={[styles.botLabel, { color: accentBright }]}>
                    Coach IA
                  </ProDayText>
                ) : null}
                <ProDayText
                  variant="body"
                  style={isUser ? styles.userText : styles.botText}
                >
                  {m.content}
                </ProDayText>
              </View>
            </View>
          );
        })}
        {sending ? (
          <View style={styles.row}>
            <View style={[styles.avatar, { borderColor: `${accent}55` }]}>
              <Icon name="school" size={14} color={accentBright} />
            </View>
            <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
              <ActivityIndicator color={accent} size="small" />
              <ProDayText variant="caption" style={styles.typingText}>
                Analyse tactique…
              </ProDayText>
            </View>
          </View>
        ) : null}
        {error ? (
          <ProDayText variant="caption" style={styles.error}>
            {error}
          </ProDayText>
        ) : null}
      </ScrollView>

      {starters.length > 0 && messages.length <= 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.starters}
          style={styles.startersScroll}
        >
          {starters.map((s) => (
            <PressableSpring
              key={s}
              onPress={() => void send(s)}
              scaleTo={0.97}
              haptic
              style={[styles.starterChip, { borderColor: `${accent}55` }]}
            >
              <ProDayText variant="caption" style={styles.starterText} numberOfLines={2}>
                {s}
              </ProDayText>
            </PressableSpring>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.composerWrap}>
        <View style={[styles.composer, { borderColor: JOUEUR_SITE.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Pose ta question tactique…"
            placeholderTextColor={JOUEUR_SITE.muted}
            style={styles.input}
            multiline
            maxLength={1200}
            editable={!sending}
            onSubmitEditing={() => void send(draft)}
            blurOnSubmit={false}
          />
          <PressableSpring
            onPress={() => void send(draft)}
            scaleTo={0.97}
            haptic
            disabled={sending || !draft.trim()}
            style={[
              styles.send,
              { backgroundColor: accent },
              (!draft.trim() || sending) && styles.sendDisabled,
            ]}
            accessibilityLabel="Envoyer"
          >
            <Icon name="chevron-forward" size={18} color="#07101c" />
          </PressableSpring>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(accent: string, accentBright: string) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 320 },
    rootCompact: { minHeight: 280 },
    thread: { flex: 1, minHeight: 0 },
    threadContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      maxWidth: '100%',
    },
    rowUser: { justifyContent: 'flex-end' },
    rowBot: { justifyContent: 'flex-start' },
    avatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: StyleSheet.hairlineWidth,
      marginBottom: 2,
    },
    bubble: {
      maxWidth: '82%',
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      gap: 4,
    },
    bubbleUser: {
      backgroundColor: accent,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 6,
    },
    bubbleBot: {
      backgroundColor: JOUEUR_SITE.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: JOUEUR_SITE.border,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomRightRadius: 18,
      borderBottomLeftRadius: 6,
    },
    botLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 2,
      color: accentBright,
    },
    userText: { color: '#07101c', lineHeight: 21, fontSize: 15, fontWeight: '600' },
    botText: { color: JOUEUR_SITE.foreground, lineHeight: 21, fontSize: 15 },
    typingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 14,
    },
    typingText: { color: JOUEUR_SITE.muted },
    error: { color: '#FF5A5F', paddingHorizontal: spacing.sm },
    startersScroll: { flexGrow: 0, maxHeight: 64 },
    starters: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
      alignItems: 'center',
    },
    starterChip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      backgroundColor: 'rgba(255,255,255,0.05)',
      maxWidth: 280,
    },
    starterText: { color: JOUEUR_SITE.foreground, fontWeight: '600', lineHeight: 16 },
    composerWrap: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: JOUEUR_SITE.border,
      backgroundColor: 'rgba(7,11,20,0.94)',
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      backgroundColor: JOUEUR_SITE.surface,
      paddingLeft: spacing.md,
      paddingRight: 6,
      paddingVertical: 6,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 110,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
      color: JOUEUR_SITE.foreground,
      fontSize: 15,
      lineHeight: 20,
    },
    send: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendDisabled: { opacity: 0.4 },
  });
}
