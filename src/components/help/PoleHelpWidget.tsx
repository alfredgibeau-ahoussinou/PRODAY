import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedEntrance, PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, shadows, brandOverlay } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import {
  PoleHelpIcon,
  WIDGET_BRAND_PILL_SIZE,
  WIDGET_CARD_MIN_HEIGHT,
  WIDGET_CARD_RADIUS,
  WIDGET_CARD_WIDTH,
  WIDGET_MINI_SIZE,
  WIDGET_TITLE,
} from './poleHelpChatShared';

type PoleHelpWidgetProps = {
  expanded: boolean;
  teaser: string;
  usesBriefcaseIcon: boolean;
  colors: AppColors;
  onOpen: () => void;
  onCollapse: () => void;
};

export const PoleHelpWidget: React.FC<PoleHelpWidgetProps> = ({
  expanded,
  teaser,
  usesBriefcaseIcon,
  colors,
  onOpen,
  onCollapse,
}) => {
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!expanded) {
    return (
      <View style={styles.anchor} pointerEvents="box-none">
        <AnimatedEntrance kind="fadeUp" index={0}>
          <PressableSpring
            onPress={onOpen}
            scaleTo={0.97}
            haptic
            style={styles.miniPressable}
            accessibilityRole="button"
            accessibilityLabel={WIDGET_TITLE}
          >
            <View
              style={[
                styles.miniPill,
                {
                  backgroundColor: colors.surface,
                  borderColor: brandOverlay(0.22),
                },
              ]}
            >
              <PoleHelpIcon usesBriefcaseIcon={usesBriefcaseIcon} size={18} color={colors.brand} />
            </View>
          </PressableSpring>
        </AnimatedEntrance>
      </View>
    );
  }

  return (
    <View style={styles.anchor} pointerEvents="box-none">
      <AnimatedEntrance kind="fadeUp" index={0}>
        <View style={styles.cardWrap}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <PressableSpring
            onPress={onOpen}
            scaleTo={0.98}
            haptic
            style={styles.cardPressable}
            accessibilityRole="button"
            accessibilityLabel={`${WIDGET_TITLE}. ${teaser}`}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.brandPill, { backgroundColor: colors.brandSoft }]}>
                <PoleHelpIcon usesBriefcaseIcon={usesBriefcaseIcon} size={14} color={colors.brand} />
              </View>
              <ProDayText variant="caption" style={[styles.cardTitle, { color: colors.text }]}>
                {WIDGET_TITLE}
              </ProDayText>
              <View style={styles.collapseSpacer} />
            </View>
            <ProDayText variant="caption" muted numberOfLines={1} style={styles.cardTeaser}>
              {teaser}
            </ProDayText>
          </PressableSpring>
          <PressableSpring
            onPress={onCollapse}
            scaleTo={0.97}
            haptic
            hitSlop={8}
            style={[styles.collapseBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            accessibilityRole="button"
            accessibilityLabel="Réduire l’assistant"
          >
            <Icon name="chevron-down" size={12} color={colors.textMuted} />
          </PressableSpring>
        </View>
        </View>
      </AnimatedEntrance>
    </View>
  );
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    anchor: {
      position: 'absolute',
      right: spacing.lg,
      bottom: TAB_BAR_CONTENT_INSET + spacing.xs,
      alignItems: 'flex-end',
      zIndex: 40,
    },
    cardWrap: {
      width: WIDGET_CARD_WIDTH,
      maxWidth: WIDGET_CARD_WIDTH,
    },
    card: {
      minHeight: WIDGET_CARD_MIN_HEIGHT,
      borderRadius: WIDGET_CARD_RADIUS,
      borderWidth: 1,
      ...shadows.interactive,
      position: 'relative',
    },
    cardPressable: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      paddingRight: spacing.xl + spacing.sm,
      gap: spacing.xs,
    },
    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    brandPill: {
      width: WIDGET_BRAND_PILL_SIZE,
      height: WIDGET_BRAND_PILL_SIZE,
      borderRadius: WIDGET_BRAND_PILL_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    cardTitle: {
      flex: 1,
      fontWeight: '800',
      fontSize: 13,
      letterSpacing: -0.1,
    },
    collapseBtn: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    collapseSpacer: {
      width: 22,
      flexShrink: 0,
    },
    cardTeaser: {
      fontWeight: '600',
      fontSize: 12,
      lineHeight: 16,
      paddingLeft: WIDGET_BRAND_PILL_SIZE + spacing.sm,
    },
    miniPressable: {
      borderRadius: WIDGET_MINI_SIZE / 2,
      ...shadows.fab,
    },
    miniPill: {
      width: WIDGET_MINI_SIZE,
      height: WIDGET_MINI_SIZE,
      borderRadius: WIDGET_MINI_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
  });
}
