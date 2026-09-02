import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring, AnimatedModalShell } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, shadows } from '../../theme/designTokens';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../theme/playerDarkPremium';
import { askProdayAi, type ProdayAiMessage } from '../../services/prodayAi.service';
import { prodayAiChatHonestyHint } from '../../utils/aiUxHonesty';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agents?: string[];
};

const SUGGESTED_PROMPTS = [
  '💡 Comment améliorer ma VMA et mon explosivité ?',
  '📋 Conseils tactiques pour jouer contre un bloc bas',
  '🥗 Quelle routine de récupération après match ?',
  '⚽ Exercices pour progresser sur mon pied faible',
];

export const ProDayAiChat: React.FC = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendWithText = useCallback(async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMsg: Msg = { id: `${Date.now()}-u`, role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history: ProdayAiMessage[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text },
      ];
      const result = await askProdayAi(history);
      const aiMsg: Msg = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: result.reply,
        agents: result.agents_used,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errMsg: Msg = {
        id: `${Date.now()}-e`,
        role: 'assistant',
        content: e instanceof Error ? e.message : 'Erreur réseau. Réessayez.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [loading, messages]);

  const send = useCallback(() => {
    void sendWithText(input);
  }, [input, sendWithText]);

  const styles = useMemo(() => createStyles(), []);

  if (!open) {
    return (
      <PressableSpring
        onPress={() => setOpen(true)}
        style={styles.fab}
        scaleTo={0.92}
        haptic
        accessibilityLabel="ProDay AI"
      >
        <Icon name="star-four-points" size={24} color={PLAYER_DARK.bg} />
      </PressableSpring>
    );
  }

  return (
    <AnimatedModalShell
      visible={open}
      onClose={() => setOpen(false)}
      variant="tall"
      handleOnly
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.sheetInner, { paddingBottom: insets.bottom + 8 }]}
      >
        {/* Header Ultra Dark Glassmorphism */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.glowAiCircle}>
              <Icon name="star-four-points" size={18} color={PLAYER_DARK.accent} />
            </View>
            <View>
              <View style={styles.kickerRow}>
                <ProDayText variant="caption" style={styles.kicker}>
                  PRODAY AI COPILOT
                </ProDayText>
                <View style={styles.liveDot} />
              </View>
              <ProDayText variant="section" style={styles.headerTitle}>
                Coach & Stratégie
              </ProDayText>
            </View>
          </View>
          <PressableSpring
            onPress={() => setOpen(false)}
            style={styles.closeBtn}
            scaleTo={0.94}
            haptic
          >
            <Icon name="close" size={16} color={PLAYER_DARK.textMuted} />
          </PressableSpring>
        </View>

        <ProDayText variant="caption" style={styles.hint}>
          {prodayAiChatHonestyHint()}
        </ProDayText>

        <ScrollView
          ref={scrollRef}
          style={styles.thread}
          contentContainerStyle={styles.threadInner}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Icon name="chat" size={32} color={PLAYER_DARK.accent} />
              </View>
              <ProDayText variant="section" style={styles.emptyTitle}>
                Comment puis-je t'aider aujourd'hui ?
              </ProDayText>
              <ProDayText variant="caption" style={styles.emptySub}>
                Pose une question sur ton entraînement, ta tactique, ton équipe ou ta nutrition.
              </ProDayText>

              <View style={styles.promptList}>
                {SUGGESTED_PROMPTS.map((prompt, pIdx) => (
                  <PressableSpring
                    key={`prompt-${pIdx}`}
                    onPress={() => void sendWithText(prompt.replace(/^[^\s]+\s/, ''))}
                    scaleTo={0.97}
                    haptic
                    style={styles.promptChip}
                  >
                    <ProDayText variant="caption" style={styles.promptText}>
                      {prompt}
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  m.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
                ]}
              >
                {m.role === 'assistant' ? (
                  <View style={styles.aiBadgeRow}>
                    <Icon name="star-four-points" size={12} color={PLAYER_DARK.accent} />
                    <ProDayText variant="caption" style={styles.aiBadgeLabel}>
                      Coach IA
                    </ProDayText>
                  </View>
                ) : null}
                <ProDayText
                  variant="body"
                  style={{
                    color: m.role === 'user' ? PLAYER_DARK.bg : PLAYER_DARK.text,
                    fontSize: 14,
                    lineHeight: 21,
                    fontWeight: m.role === 'user' ? '700' : '400',
                  }}
                >
                  {m.content}
                </ProDayText>
              </View>
            ))
          )}
          {loading ? (
            <View style={[styles.bubble, styles.bubbleAi, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <ActivityIndicator size="small" color={PLAYER_DARK.accent} />
              <ProDayText variant="caption" style={{ color: PLAYER_DARK.textMuted }}>
                Analyse tactique en cours...
              </ProDayText>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Pose ta question au coach IA..."
            placeholderTextColor={PLAYER_DARK.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            returnKeyType="send"
            editable={!loading}
          />
          <PressableSpring
            onPress={send}
            style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]}
            disabled={!input.trim() || loading}
            scaleTo={0.92}
            haptic
            accessibilityLabel="Envoyer"
          >
            <Icon name="chevron-forward" size={18} color={PLAYER_DARK.bg} />
          </PressableSpring>
        </View>
      </KeyboardAvoidingView>
    </AnimatedModalShell>
  );
};

function createStyles() {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      right: 18,
      bottom: 90,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: PLAYER_DARK.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: PLAYER_DARK.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
      zIndex: 45,
    },
    sheetInner: {
      flex: 1,
      backgroundColor: PLAYER_DARK.bg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: PLAYER_DARK.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    glowAiCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: PLAYER_DARK.accentSoft,
      borderWidth: 1,
      borderColor: PLAYER_DARK.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    kicker: {
      color: PLAYER_DARK.accent,
      fontWeight: '900',
      fontSize: 10,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: PLAYER_DARK.accent,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: PLAYER_DARK.text,
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: PLAYER_DARK.surface,
      borderWidth: 1,
      borderColor: PLAYER_DARK.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hint: {
      paddingHorizontal: spacing.md,
      paddingTop: 8,
      fontSize: 11,
      lineHeight: 16,
      color: PLAYER_DARK.textMuted,
    },
    thread: {
      flex: 1,
    },
    threadInner: {
      padding: spacing.md,
      gap: spacing.sm,
      paddingBottom: 24,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    emptyIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: PLAYER_DARK.surface,
      borderWidth: 1,
      borderColor: PLAYER_DARK.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: PLAYER_DARK.text,
      textAlign: 'center',
    },
    emptySub: {
      fontSize: 12,
      color: PLAYER_DARK.textMuted,
      textAlign: 'center',
      maxWidth: '85%',
      lineHeight: 18,
    },
    promptList: {
      width: '100%',
      gap: spacing.xs,
      marginTop: spacing.md,
    },
    promptChip: {
      backgroundColor: PLAYER_DARK.surface,
      borderWidth: 1,
      borderColor: PLAYER_DARK.border,
      borderRadius: PLAYER_DARK_RADIUS.card,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    promptText: {
      fontSize: 12,
      color: PLAYER_DARK.text,
      fontWeight: '600',
    },
    bubble: {
      borderRadius: 16,
      padding: spacing.md,
      maxWidth: '88%',
    },
    bubbleUser: {
      alignSelf: 'flex-end',
      backgroundColor: PLAYER_DARK.accent,
      borderBottomRightRadius: 4,
    },
    bubbleAi: {
      alignSelf: 'flex-start',
      backgroundColor: PLAYER_DARK.surface,
      borderWidth: 1,
      borderColor: PLAYER_DARK.border,
      borderBottomLeftRadius: 4,
      gap: 4,
    },
    aiBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    aiBadgeLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: PLAYER_DARK.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    composer: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: PLAYER_DARK.border,
      backgroundColor: PLAYER_DARK.bgElevated,
      alignItems: 'center',
    },
    input: {
      flex: 1,
      minHeight: 46,
      borderRadius: PLAYER_DARK_RADIUS.pill,
      paddingHorizontal: spacing.md,
      backgroundColor: PLAYER_DARK.surface,
      borderWidth: 1,
      borderColor: PLAYER_DARK.border,
      color: PLAYER_DARK.text,
      fontSize: 13,
    },
    sendBtn: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: PLAYER_DARK.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
