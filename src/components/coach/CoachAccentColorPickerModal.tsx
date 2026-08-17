import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { CoachText } from './coachPortalUi';
import { CoachAccentColorBoard } from './CoachAccentColorBoard';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import { useTranslation } from '../../context/LocaleContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { radius, spacing } from '../../theme/designTokens';

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

  const gridHeight = useMemo(
    () => Math.round(Dimensions.get('window').height * 0.65),
    [],
  );

  useEffect(() => {
    if (visible) {
      setDraftColor(selectedColor);
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

          <CoachAccentColorBoard
            selectedColor={draftColor}
            onSelect={setDraftColor}
            boardHeight={gridHeight}
          />

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
