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
import { askProdayAi, type ProdayAiMessage } from '../../services/prodayAi.service';

type Msg = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agents?: string[];
};

export const ProDayAiChat: React.FC = () => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = useCallback(async () => {
    const text = input.trim();
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
        content: e instanceof Error ? e.message : 'Erreur. Réessayez.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, loading, messages]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!open) {
    return (
      <PressableSpring
        onPress={() => setOpen(true)}
        style={styles.fab}
        scaleTo={0.92}
        haptic
        accessibilityLabel="ProDay AI"
      >
        <Icon name="star-four-points" size={22} color="#fff" />
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
          <View style={styles.header}>
            <View>
              <ProDayText variant="caption" style={styles.kicker}>ProDay AI</ProDayText>
              <ProDayText variant="section" style={{ color: colors.text }}>
                Assistant intelligent
              </ProDayText>
            </View>
            <PressableSpring
              onPress={() => setOpen(false)}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceMuted }]}
              scaleTo={0.94}
            >
              <Icon name="close" size={16} color={colors.textMuted} />
            </PressableSpring>
          </View>

          <ProDayText variant="caption" muted style={styles.hint}>
            Réponses basées sur tes données réelles. Aucun chiffre inventé.
          </ProDayText>

          <ScrollView
            ref={scrollRef}
            style={styles.thread}
            contentContainerStyle={styles.threadInner}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <ProDayText variant="caption" muted style={styles.empty}>
                Ex. « Pourquoi mon équipe perd ? », « Stats du club », « Prochains matchs »
              </ProDayText>
            ) : (
              messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.bubble,
                    m.role === 'user' ? styles.bubbleUser : styles.bubbleAi,
                  ]}
                >
                  <ProDayText
                    variant="body"
                    style={{
                      color: m.role === 'user' ? '#fff' : colors.text,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {m.content}
                  </ProDayText>
                </View>
              ))
            )}
            {loading ? (
              <View style={[styles.bubble, styles.bubbleAi]}>
                <ActivityIndicator size="small" color={colors.brand} />
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.composer, { borderTopColor: colors.border }]}>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Posez une question..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              returnKeyType="send"
              editable={!loading}
            />
            <PressableSpring
              onPress={send}
              style={[styles.sendBtn, { backgroundColor: colors.brand }]}
              scaleTo={0.92}
              haptic
              accessibilityLabel="Envoyer"
            >
              <Icon name="chevron-forward" size={18} color="#fff" />
            </PressableSpring>
          </View>
        </KeyboardAvoidingView>
    </AnimatedModalShell>
  );
};

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    fab: {
      position: 'absolute',
      right: 18,
      bottom: 90,
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.fab,
      zIndex: 45,
    },
    sheetInner: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    kicker: {
      color: colors.brand,
      fontWeight: '800',
      fontSize: 10,
      letterSpacing: 1.3,
      textTransform: 'uppercase',
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hint: {
      paddingHorizontal: spacing.md,
      paddingTop: 6,
      fontSize: 12,
      lineHeight: 17,
    },
    thread: { flex: 1 },
    threadInner: { padding: spacing.md, gap: spacing.sm, paddingBottom: 24 },
    empty: { fontSize: 13, lineHeight: 20 },
    bubble: { borderRadius: 14, padding: spacing.sm, maxWidth: '92%' },
    bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.brand },
    bubbleAi: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surfaceMuted,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    composer: {
      flexDirection: 'row',
      gap: 8,
      padding: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
    },
    input: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: StyleSheet.hairlineWidth,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
