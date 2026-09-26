import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { withAlpha } from '../../utils/coachTeamTheme';
import { Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { CoachText } from './CoachText';
import { CoachAccentColorAssistant } from './CoachAccentColorAssistant';
import { CoachAccentColorBoard } from './CoachAccentColorBoard';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { useTranslation } from '../../context/LocaleContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { radius, spacing } from '../../theme/designTokens';
import { coachChrome } from '../../features/coach/theme/coachDesignSystem';

type ColorPickerTab = 'assistant' | 'grid';

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
  const { width } = useWindowDimensions();
  const sheetMode = coachChrome.modalIsSheet(width);
  const styles = useMemo(() => createStyles(tokens, sheetMode), [tokens, sheetMode]);
  const [draftColor, setDraftColor] = useState(selectedColor);
  const [tab, setTab] = useState<ColorPickerTab>('assistant');

  const gridHeight = useMemo(
    () => Math.round(Dimensions.get('window').height * 0.45),
    [],
  );

  useEffect(() => {
    if (visible) {
      setDraftColor(selectedColor);
      setTab('assistant');
    }
  }, [visible, selectedColor]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, handleClose]);

  const handleApply = useCallback(() => {
    onApply(draftColor);
    handleClose();
  }, [draftColor, handleClose, onApply]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <CoachText variant="section" style={styles.title}>
              {t('coach.portal.theme.pickColor')}
            </CoachText>
            <Pressable
              onPress={handleClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
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
                        : 'coach.portal.theme.colorBoardTab',
                    )}
                  </CoachText>
                </PressableSpring>
              );
            })}
          </View>

          <View style={styles.body}>
            {tab === 'assistant' ? (
              <ScrollView
                style={styles.bodyScroll}
                contentContainerStyle={styles.bodyContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                <CoachAccentColorAssistant selectedColor={draftColor} onSelect={setDraftColor} />
              </ScrollView>
            ) : (
              <CoachAccentColorBoard
                selectedColor={draftColor}
                onSelect={setDraftColor}
                boardHeight={gridHeight}
              />
            )}
          </View>

          <PressableSpring
            onPress={handleApply}
            scaleTo={0.97}
            haptic
            style={styles.applyBtn}
            accessibilityRole="button"
          >
            <CoachText variant="caption" inverse style={styles.applyBtnText}>
              {t('coach.portal.theme.applyColor')}
            </CoachText>
          </PressableSpring>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(tokens: CoachThemeTokens, sheetMode: boolean) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'withAlpha(tokens.bg, 0.65)',
      justifyContent: sheetMode ? 'flex-end' : 'center',
      alignItems: sheetMode ? undefined : 'center',
      paddingHorizontal: sheetMode ? 0 : spacing.xl,
    },
    sheet: {
      backgroundColor: tokens.surface,
      borderTopLeftRadius: sheetMode ? 20 : 16,
      borderTopRightRadius: sheetMode ? 20 : 16,
      borderBottomLeftRadius: sheetMode ? 0 : 16,
      borderBottomRightRadius: sheetMode ? 0 : 16,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      maxHeight: sheetMode ? '88%' : '80%',
      width: '100%',
      maxWidth: sheetMode ? undefined : 520,
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: { flex: 1, fontWeight: '800', color: tokens.foreground },
    closeBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    segment: {
      flex: 1,
      minHeight: 40,
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
    body: {
      flexShrink: 1,
    },
    bodyScroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    bodyContent: {
      paddingBottom: spacing.xs,
    },
    applyBtn: {
      alignSelf: 'stretch',
      minHeight: 44,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accent,
      marginTop: spacing.xs,
    },
    applyBtnText: { fontWeight: '800' },
  });
}
