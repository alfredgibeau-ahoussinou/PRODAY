import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedEntrance } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing } from '../../theme/designTokens';

interface AuroraHeaderProps {
  variant?: 'sport' | 'default';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  footer?: React.ReactNode;
}

/** En-tête V3 — bandeau gradient + titre section. */
export const AuroraHeader: React.FC<AuroraHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  right,
  footer,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AnimatedEntrance kind="fadeDown">
      <View style={styles.shell}>
        <ProDayGradient kind="cta" style={styles.accentBar} />
        <View style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          <View style={styles.copy}>
            {eyebrow ? (
              <ProDayText variant="caption" muted style={styles.eyebrow} numberOfLines={1}>
                {eyebrow}
              </ProDayText>
            ) : null}
            <ProDayText
              variant="title"
              style={styles.title}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {title}
            </ProDayText>
            {subtitle ? (
              <ProDayText variant="body" muted numberOfLines={3}>
                {subtitle}
              </ProDayText>
            ) : null}
          </View>
          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </AnimatedEntrance>
  );
};

function createStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    shell: { position: 'relative' },
    accentBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
    },
    wrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      gap: spacing.md,
    },
    copy: { flex: 1, flexShrink: 1, minWidth: 0, gap: 2 },
    eyebrow: { textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 10, flexShrink: 1 },
    title: { fontWeight: '800', letterSpacing: -0.4, flexShrink: 1 },
    right: { flexShrink: 0 },
    footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  });
}
