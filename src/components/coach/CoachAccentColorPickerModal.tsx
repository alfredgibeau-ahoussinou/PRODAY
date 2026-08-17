import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { CoachText } from './coachPortalUi';
import { CoachAccentColorAssistant } from './CoachAccentColorAssistant';
import { CoachAccentColorBoard } from './CoachAccentColorBoard';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import { useTranslation } from '../../context/LocaleContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { radius, spacing } from '../../theme/designTokens';

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
  const styles = useCoachThemedStyles(createStyles);
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
                        : 'coach.portal.theme.colorBoardTab',
                    )}
                  </CoachText>
                </PressableSpring>
              );
            })}
          </View>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {tab === 'assistant' ? (
              <CoachAccentColorAssistant selectedColor={draftColor} onSelect={setDraftColor} />
            ) : (
              <CoachAccentColorBoard
                selectedColor={draftColor}
                onSelect={setDraftColor}
                boardHeight={gridHeight}
              />
            )}
          </ScrollView>

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
      maxHeight: '88%',
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
