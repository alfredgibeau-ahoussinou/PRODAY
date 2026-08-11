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
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon } from '../../components/ui/Icon';
import { CLUB_SITE } from '../../content/clubPageIdentity';
import {
  sendClubAssistantMessage,
  type ClubAssistantChatMessage,
} from '../../services/clubAssistant.service';
import { stripDashTypography } from '../../utils/stripDashTypography';
import { radius, spacing } from '../../theme/designTokens';

type Bubble = ClubAssistantChatMessage & { id: string };

const WELCOME =
  'Salut, je suis là pour t’aider sur le club. Dis-moi où tu en es (équipes, adhésions, matchs, formule…) et on avance ensemble.';

type Props = {
  starters?: string[];
};

/**
 * Chat live Club — bulles conversationnelles + réponses Mistral naturelles.
 */
export function ClubLiveChat({ starters }: Props) {
  const [messages, setMessages] = useState<Bubble[]>([
    { id: 'welcome', role: 'assistant', content: WELCOME },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const styles = useMemo(() => createStyles(), []);

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages, sending]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
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
      const history: ClubAssistantChatMessage[] = next
        .filter((m) => m.id !== 'welcome')
        .map(({ role, content: c }) => ({ role, content: c }));
      const payload =
        history.length > 0
          ? history
          : ([{ role: 'user', content }] as ClubAssistantChatMessage[]);
      const res = await sendClubAssistantMessage(payload);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: stripDashTypography(res.reply),
        },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Envoi impossible.';
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: `Désolé, je n’ai pas pu répondre. ${msg} Tu peux réessayer dans un instant.`,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
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
                <View style={styles.avatar}>
                  <Icon name="star-four-points" size={14} color={CLUB_SITE.accent} />
                </View>
              ) : null}
              <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                {!isUser ? (
                  <ProDayText variant="caption" style={styles.botLabel}>
                    Copilote
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
            <View style={styles.avatar}>
              <Icon name="star-four-points" size={14} color={CLUB_SITE.accent} />
            </View>
            <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
              <ActivityIndicator color={CLUB_SITE.accent} size="small" />
              <ProDayText variant="caption" style={styles.typingText}>
                En train d’écrire…
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

      {starters && starters.length > 0 && messages.length <= 1 ? (
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
              style={styles.starterChip}
            >
              <ProDayText variant="caption" style={styles.starterText} numberOfLines={2}>
                {s}
              </ProDayText>
            </PressableSpring>
          ))}
        </ScrollView>
      ) : null}

      <View style={styles.composerWrap}>
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Parle-moi de ton club…"
            placeholderTextColor={CLUB_SITE.muted}
            style={styles.input}
            multiline
            maxLength={1200}
            editable={!sending}
            onSubmitEditing={() => void send(draft)}
            blurOnSubmit={false}
          />
          <PressableSpring
            onPress={() => void send(draft)}
            scaleTo={0.94}
            haptic
            disabled={sending || !draft.trim()}
            style={[styles.send, (!draft.trim() || sending) && styles.sendDisabled]}
            accessibilityLabel="Envoyer"
          >
            <Icon name="chevron-forward" size={18} color="#fff" />
          </PressableSpring>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 280 },
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
      backgroundColor: CLUB_SITE.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0,108,252,0.35)',
      marginBottom: 2,
    },
    bubble: {
      maxWidth: '82%',
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      gap: 4,
    },
    bubbleUser: {
      backgroundColor: CLUB_SITE.accent,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 6,
    },
    bubbleBot: {
      backgroundColor: CLUB_SITE.elevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CLUB_SITE.border,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomRightRadius: 18,
      borderBottomLeftRadius: 6,
    },
    botLabel: {
      color: CLUB_SITE.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    userText: { color: '#fff', lineHeight: 21, fontSize: 15 },
    botText: { color: CLUB_SITE.foreground, lineHeight: 21, fontSize: 15 },
    typingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 14,
    },
    typingText: { color: CLUB_SITE.muted },
    error: { color: '#FF5A5F', paddingHorizontal: spacing.sm },
    startersScroll: { flexGrow: 0, maxHeight: 56 },
    starters: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
      alignItems: 'center',
    },
    starterChip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0,108,252,0.35)',
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      backgroundColor: CLUB_SITE.soft,
      maxWidth: 260,
    },
    starterText: { color: CLUB_SITE.foreground, fontWeight: '600', lineHeight: 16 },
    composerWrap: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: CLUB_SITE.border,
      backgroundColor: 'rgba(2,8,20,0.92)',
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      borderRadius: 22,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CLUB_SITE.border,
      backgroundColor: CLUB_SITE.elevated,
      paddingLeft: spacing.md,
      paddingRight: 6,
      paddingVertical: 6,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 110,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
      color: CLUB_SITE.foreground,
      fontSize: 15,
      lineHeight: 20,
    },
    send: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: CLUB_SITE.accent,
    },
    sendDisabled: { opacity: 0.4 },
  });
}
