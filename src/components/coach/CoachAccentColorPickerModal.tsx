import React, { useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { CoachText } from './coachPortalUi';
import { CoachAccentColorBoard } from './CoachAccentColorBoard';
import { CoachAiMessage } from './CoachAiMessage';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import { useTranslation } from '../../context/LocaleContext';
import { parseCoachColorPhrase } from '../../utils/coachColorPicker';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { radius, spacing } from '../../theme/designTokens';

type TabId = 'assistant' | 'grid';

type AssistantTurn = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  hex?: string;
  label?: string;
};

const EXAMPLE_KEYS = ['rouge', 'bleu marine', '#006CFC', 'vert'] as const;

type Props = {
  visible: boolean;
  selectedColor: string;
  onClose: () => void;
  onApply: (hex: string) => void;
};

export function CoachAccentColorPickerModal({
  visible,
  selectedColor,
  onClose,
  onApply,
}: Props) {
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const [tab, setTab] = useState<TabId>('assistant');
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [pending, setPending] = useState<{ hex: string; label: string } | null>(null);

  const gridHeight = useMemo(
    () => Math.round(Dimensions.get('window').height * 0.52),
    [],
  );

  const resetAssistant = useCallback(() => {
    setInput('');
    setTurns([]);
    setPending(null);
  }, []);

  const handleClose = useCallback(() => {
    resetAssistant();
    setTab('assistant');
    onClose();
  }, [onClose, resetAssistant]);

  const applyColor = useCallback(
    (hex: string) => {
      onApply(hex);
      handleClose();
    },
    [handleClose, onApply],
  );

  const sendPhrase = useCallback(
    (phrase: string) => {
      const trimmed = phrase.trim();
      if (!trimmed) return;

      const parsed = parseCoachColorPhrase(trimmed);
      const userTurn: AssistantTurn = {
        id: `u-${Date.now()}`,
        role: 'user',
        text: trimmed,
      };

      if (!parsed) {
        setTurns((prev) => [
          ...prev,
          userTurn,
          {
            id: `b-${Date.now()}`,
            role: 'bot',
            text: t('coach.portal.theme.colorAssistantUnknown'),
          },
        ]);
        setPending(null);
        setInput('');
        return;
      }

      setTurns((prev) => [
        ...prev,
        userTurn,
        {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: t('coach.portal.theme.colorAssistantFound', { label: parsed.label }),
          hex: parsed.hex,
          label: parsed.label,
        },
      ]);
      setPending(parsed);
      setInput('');
    },
    [t],
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <CoachText variant="section" style={styles.title}>
              {t('coach.portal.theme.chooseColor')}
            </CoachText>
            <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button">
              <Icon name="close" size={22} color={tokens.muted} />
            </Pressable>
          </View>

          <View style={styles.segmentRow}>
            {(['assistant', 'grid'] as const).map((option) => {
              const on = tab === option;
              return (
                <PressableSpring
                  key={option}
                  onPress={() => setTab(option)}
                  scaleTo={0.97}
                  haptic
                  style={[styles.segment, on && styles.segmentOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                >
                  <CoachText variant="caption" style={on ? styles.segmentTextOn : styles.segmentTextOff}>
                    {t(
                      option === 'assistant'
                        ? 'coach.portal.theme.colorAssistant'
                        : 'coach.portal.theme.colorGrid',
                    )}
                  </CoachText>
                </PressableSpring>
              );
            })}
          </View>

          {tab === 'assistant' ? (
            <View style={styles.assistantBody}>
              <ScrollView
                style={styles.chatScroll}
                contentContainerStyle={styles.chatContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <CoachAiMessage message={t('coach.portal.theme.colorAssistantTitle')} />
                {turns.map((turn) =>
                  turn.role === 'user' ? (
                    <View key={turn.id} style={styles.userBubble}>
                      <CoachText variant="body" style={styles.userText}>
                        {turn.text}
                      </CoachText>
                    </View>
                  ) : (
                    <View key={turn.id} style={styles.botBlock}>
                      <CoachAiMessage message={turn.text} />
                      {turn.hex ? (
                        <View style={styles.previewRow}>
                          <View style={[styles.previewSwatch, { backgroundColor: turn.hex }]} />
                          <CoachText variant="caption" style={styles.previewHex}>
                            {turn.hex}
                          </CoachText>
                        </View>
                      ) : null}
                    </View>
                  ),
                )}
              </ScrollView>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.exampleRow}
                keyboardShouldPersistTaps="handled"
              >
                {EXAMPLE_KEYS.map((example) => (
                  <PressableSpring
                    key={example}
                    onPress={() => sendPhrase(example)}
                    scaleTo={0.96}
                    haptic
                    style={styles.exampleChip}
                  >
                    <CoachText variant="caption" style={styles.exampleChipText}>
                      {example}
                    </CoachText>
                  </PressableSpring>
                ))}
              </ScrollView>

              <View style={styles.inputRow}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={t('coach.portal.theme.colorAssistantPrompt')}
                  placeholderTextColor={tokens.muted}
                  style={styles.input}
                  returnKeyType="send"
                  onSubmitEditing={() => sendPhrase(input)}
                />
                <PressableSpring
                  onPress={() => sendPhrase(input)}
                  scaleTo={0.92}
                  haptic
                  style={styles.sendBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t('coach.portal.theme.colorAssistantSend')}
                >
                  <Icon name="chevron-forward" size={18} color="#fff" />
                </PressableSpring>
              </View>

              {pending ? (
                <PressableSpring
                  onPress={() => applyColor(pending.hex)}
                  scaleTo={0.97}
                  haptic
                  style={styles.applyBtn}
                >
                  <CoachText variant="caption" inverse style={styles.applyBtnText}>
                    {t('coach.portal.theme.applyColor')}
                  </CoachText>
                </PressableSpring>
              ) : null}
            </View>
          ) : (
            <View style={styles.gridBody}>
              <CoachAccentColorBoard
                selectedColor={selectedColor}
                onSelect={applyColor}
                boardHeight={gridHeight}
              />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: tokens.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      maxHeight: '78%',
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: { flex: 1, fontWeight: '800', color: tokens.foreground },
    segmentRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    segment: {
      flex: 1,
      minHeight: 36,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    segmentOn: {
      borderColor: tokens.accent,
      backgroundColor: tokens.soft,
    },
    segmentTextOn: { color: tokens.accent, fontWeight: '800' },
    segmentTextOff: { color: tokens.muted, fontWeight: '600' },
    assistantBody: {
      gap: spacing.sm,
      minHeight: 280,
    },
    chatScroll: {
      maxHeight: 220,
    },
    chatContent: {
      gap: spacing.sm,
      paddingBottom: spacing.xs,
    },
    userBubble: {
      alignSelf: 'flex-end',
      maxWidth: '82%',
      backgroundColor: tokens.accent,
      borderRadius: 16,
      borderBottomRightRadius: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    userText: { color: '#fff', lineHeight: 20 },
    botBlock: { gap: spacing.xs },
    previewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingLeft: spacing.xs,
    },
    previewSwatch: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    previewHex: { color: tokens.foreground, fontWeight: '700', fontVariant: ['tabular-nums'] },
    exampleRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    exampleChip: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    exampleChipText: { color: tokens.foreground, fontWeight: '600' },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      minHeight: 44,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      color: tokens.foreground,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accent,
    },
    applyBtn: {
      alignSelf: 'stretch',
      minHeight: 44,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accent,
    },
    applyBtnText: { fontWeight: '800' },
    gridBody: {
      paddingBottom: spacing.xs,
    },
  });
}
