import React, { useEffect, useMemo } from 'react';
import { Modal, View, StyleSheet, Pressable, Text, type ModalProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { motion, useReducedMotion } from '../../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type AnimatedModalShellVariant = 'full' | 'compact' | 'tall';

interface AnimatedModalShellProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeLabel?: string;
  presentationStyle?: ModalProps['presentationStyle'];
  /** `full` = sheet plein écran ; `tall` ≈ 92 % ; `compact` ≈ 58 %. */
  variant?: AnimatedModalShellVariant;
  /** Poignée centrée seule, sans bouton « Fermer » (header custom dans le contenu). */
  handleOnly?: boolean;
  /** Override palette (ex. admin clair + teal, hors thème produit). */
  themeColors?: AppColors;
  /** Fond de la sheet (ex. PLAYER_DARK pour Coach IA joueur). */
  sheetBackgroundColor?: string;
}

const COMPACT_SHEET_MAX_HEIGHT = '58%';
const TALL_SHEET_MAX_HEIGHT = '92%';

/**
 * Modal avec backdrop animé + sheet qui monte depuis le bas.
 */
export const AnimatedModalShell: React.FC<AnimatedModalShellProps> = ({
  visible,
  onClose,
  children,
  closeLabel,
  presentationStyle = 'overFullScreen',
  variant = 'full',
  handleOnly = false,
  themeColors,
  sheetBackgroundColor,
}) => {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const { colors: appColors } = useAppTheme();
  const c = themeColors ?? appColors;
  const { t } = useTranslation();
  const resolvedCloseLabel = closeLabel ?? t('common.close');
  const styles = useMemo(() => createStyles(c), [c]);
  const backdrop = useSharedValue(0);
  const sheetY = useSharedValue(80);

  useEffect(() => {
    if (visible) {
      if (reduced) {
        backdrop.value = 1;
        sheetY.value = 0;
        return;
      }
      backdrop.value = withTiming(1, { duration: motion.duration.modal });
      sheetY.value = withSpring(0, motion.spring.sheet);
    } else {
      if (reduced) {
        backdrop.value = 0;
        sheetY.value = 80;
        return;
      }
      backdrop.value = withTiming(0, { duration: motion.duration.fast });
      sheetY.value = withSpring(80, motion.spring.snappy);
    }
  }, [visible, reduced, backdrop, sheetY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
    opacity: variant === 'compact' || variant === 'tall' ? backdrop.value : 0.4 + backdrop.value * 0.6,
  }));

  const isCompact = variant === 'compact';
  const isTall = variant === 'tall';
  const isBottomSheet = isCompact || isTall;
  const sheetPaddingTop = isBottomSheet ? spacing.sm : Math.max(insets.top, spacing.md);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={resolvedCloseLabel}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            isCompact ? styles.sheetCompact : isTall ? styles.sheetTall : styles.sheetFull,
            isBottomSheet && styles.sheetCompactRadius,
            sheetStyle,
            {
              paddingTop: sheetPaddingTop,
              backgroundColor: sheetBackgroundColor ?? c.background,
            },
          ]}
        >
          {handleOnly ? (
            <View style={styles.handleOnlyRow}>
              <View style={styles.handle} />
            </View>
          ) : (
            <View style={styles.handleRow}>
              <View style={styles.handle} />
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Text style={styles.closeText}>{resolvedCloseLabel}</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.body}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: motion.modalBackdrop,
    },
    sheet: {
      backgroundColor: c.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: c.border,
      overflow: 'hidden',
    },
    sheetFull: { flex: 1 },
    sheetCompact: {
      height: COMPACT_SHEET_MAX_HEIGHT,
      maxHeight: COMPACT_SHEET_MAX_HEIGHT,
      flexGrow: 0,
    },
    sheetTall: {
      height: TALL_SHEET_MAX_HEIGHT,
      maxHeight: TALL_SHEET_MAX_HEIGHT,
      flexGrow: 0,
    },
    sheetCompactRadius: {
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
    },
    handleOnlyRow: {
      alignItems: 'center',
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
    },
    handleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.borderMedium,
    },
    closeBtn: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm },
    closeText: { fontSize: 14, fontWeight: '800', color: c.brand },
    body: { flex: 1 },
  });
}
