import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedEntrance, PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';

interface MessagesEmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
  secondaryCtaLabel?: string;
  onSecondaryCta?: () => void;
  variant?: 'guest' | 'empty';
}

export const MessagesEmptyState: React.FC<MessagesEmptyStateProps> = ({
  title,
  description,
  ctaLabel,
  onCta,
  secondaryCtaLabel,
  onSecondaryCta,
  variant = 'empty',
}) => (
  <AnimatedEntrance kind="fadeUp">
    <ProDaySurface variant="module" style={styles.wrap}>
      <ProDayGradient kind="cta" style={styles.iconWrap}>
        <Icon name="chat" size={28} color="#FFFFFF" variant="filled" />
      </ProDayGradient>
      <ProDayText variant="title" style={styles.title}>
        {title}
      </ProDayText>
      <ProDayText variant="body" muted style={styles.description}>
        {description}
      </ProDayText>
      {ctaLabel && onCta ? (
        <PressableSpring onPress={onCta} scaleTo={0.96} haptic>
          <ProDayGradient kind="cta" style={styles.cta}>
            <ProDayText variant="section" inverse style={styles.ctaText}>
              {ctaLabel}
            </ProDayText>
          </ProDayGradient>
        </PressableSpring>
      ) : null}
      {secondaryCtaLabel && onSecondaryCta ? (
        <PressableSpring onPress={onSecondaryCta} scaleTo={0.98} haptic>
          <ProDayText variant="caption" accent style={styles.hint}>
            {secondaryCtaLabel}
          </ProDayText>
        </PressableSpring>
      ) : null}
    </ProDaySurface>
  </AnimatedEntrance>
);

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { textAlign: 'center' },
  description: { textAlign: 'center', lineHeight: 22 },
  cta: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  ctaText: { fontWeight: '800' },
  hint: { marginTop: spacing.sm },
});
