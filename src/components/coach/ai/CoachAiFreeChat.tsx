import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CoachText } from '../coachPortalUi';
import { Icon, type IconName } from '../../ui/Icon';
import { PressableSpring } from '../../motion';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../../theme/designTokens';
import { CoachPane } from '../CoachScreenHeader';
import { askProdayAi, buildLocalProdayAiReply } from '../../../services/prodayAi.service';

const QUICK_PROMPTS: { label: string; icon: IconName }[] = [
  { label: 'Causerie avant-match décisif', icon: 'mic' },
  { label: 'Comment contrer un 4-3-3 pressing ?', icon: 'shield' },
  { label: 'Exercice de transition rapide 3v2', icon: 'football' },
  { label: 'Remettre en confiance un attaquant', icon: 'fitness' },
  { label: 'Discours mi-temps si mené au score', icon: 'time' },
];

export function CoachAiFreeChat({ onBack }: { onBack: () => void }) {
  const { tokens } = useCoachTheme();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    {
      role: 'assistant',
      content:
        "Bonjour Coach ! Je suis votre **Copilote IA Entraîneur ProDay**.\n\nPosez-moi vos questions sur la tactique, les séances, la causerie de match ou le management des joueurs.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async (customText?: string) => {
    const textToSend = (customText ?? input).trim();
    if (!textToSend || isThinking) return;

    if (!customText) setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: textToSend }];
    setMessages(newMessages);
    setIsThinking(true);

    try {
      const res = await askProdayAi(newMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
    } catch {
      const localRes = buildLocalProdayAiReply(textToSend);
      setMessages((prev) => [...prev, { role: 'assistant', content: localRes.reply }]);
    } finally {
      setIsThinking(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isThinking]);

  return (
    <CoachPane
      title="Chat Copilote IA"
      actions={[{ icon: 'chevron-down', onPress: onBack, accessibilityLabel: 'Retour' }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <View style={styles.contentContainer}>
          {/* Quick suggestions row */}
          <View style={styles.suggestionsRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionsContent}>
              {QUICK_PROMPTS.map((prompt) => (
                <PressableSpring
                  key={prompt.label}
                  style={[styles.suggestionChip, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                  onPress={() => handleSend(prompt.label)}
                  scaleTo={0.96}
                  haptic
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Icon name={prompt.icon} size={14} color={tokens.accent} />
                    <CoachText style={[styles.suggestionText, { color: tokens.foreground }]}>
                      {prompt.label}
                    </CoachText>
                  </View>
                </PressableSpring>
              ))}
            </ScrollView>
          </View>

          {/* Messages list */}
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  m.role === 'user'
                    ? [styles.bubbleUser, { backgroundColor: tokens.accent }]
                    : [styles.bubbleAssistant, { backgroundColor: tokens.surface, borderColor: tokens.border }],
                ]}
              >
                <CoachText
                  style={[
                    styles.messageText,
                    {
                      color: m.role === 'user' ? tokens.onAccent : tokens.foreground,
                    },
                  ]}
                >
                  {m.content.replace(/(^|\n)\s*[-*]\s/g, '$1• ')}
                </CoachText>
              </View>
            ))}

            {isThinking && (
              <View style={[styles.bubble, styles.bubbleAssistant, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <View style={styles.thinkingRow}>
                  <ActivityIndicator size="small" color={tokens.accent} />
                  <CoachText style={{ color: tokens.muted, fontSize: 12 }}>
                    Le Copilote IA analyse votre demande...
                  </CoachText>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input field */}
          <View
            style={[
              styles.inputRow,
              { borderColor: tokens.border, backgroundColor: tokens.surface },
            ]}
          >
            <TextInput
              style={[styles.input, { color: tokens.foreground }]}
              placeholder="Posez votre question tactique ou managériale..."
              placeholderTextColor={tokens.muted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <PressableSpring
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() ? tokens.accent : tokens.border },
              ]}
              onPress={() => handleSend()}
              disabled={!input.trim() || isThinking}
              scaleTo={0.92}
              haptic
            >
              <Icon name="chevron-forward" size={16} color={tokens.onAccent} />
            </PressableSpring>
          </View>
        </View>
      </KeyboardAvoidingView>
    </CoachPane>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
  },
  suggestionsRow: {
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  suggestionsContent: {
    gap: spacing.xs,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  bubble: {
    padding: spacing.md,
    borderRadius: radius.lg,
    maxWidth: '88%',
    marginBottom: spacing.xs,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 48,
    marginTop: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 13,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});

