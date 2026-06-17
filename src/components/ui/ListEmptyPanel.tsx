import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from './Icon';
import { ProDayText } from './ProDayText';
import { ProDayGradient } from './ProDayGradient';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

type EmptyCta = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
};

type ListEmptyPanelProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  primaryCta?: EmptyCta;
  secondaryCta?: EmptyCta;
};

/** État vide plat — sans carte ombrée. */
export const ListEmptyPanel: React.FC<ListEmptyPanelProps> = ({
  icon,
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <Icon name={icon} size={32} color={colors.textMuted} />
      <ProDayText variant="section">{title}</ProDayText>
      <ProDayText variant="body" muted style={styles.sub}>
        {subtitle}
      </ProDayText>
      {primaryCta || secondaryCta ? (
        <View style={styles.actions}>
          {primaryCta ? (
            <PressableSpring onPress={primaryCta.onPress} scaleTo={0.96} haptic>
              <ProDayGradient kind="cta" style={styles.cta}>
                <ProDayText variant="caption" inverse style={styles.ctaText}>
                  {primaryCta.label}
                </ProDayText>
              </ProDayGradient>
            </PressableSpring>
          ) : null}
          {secondaryCta ? (
            <PressableSpring
              style={[styles.ctaGhost, { borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted }]}
              onPress={secondaryCta.onPress}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" accent style={styles.ctaText}>
                {secondaryCta.label}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    sub: { textAlign: 'center', lineHeight: 22 },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    cta: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
    },
    ctaGhost: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    ctaText: { fontWeight: '800' },
  });
}
