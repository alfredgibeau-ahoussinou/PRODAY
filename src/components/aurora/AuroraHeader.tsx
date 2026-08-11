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
  /** `night` = texte clair sur atmosphère terrain. */
  tone?: 'default' | 'night';
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Action gauche (ex. retour). */
  left?: React.ReactNode;
  right?: React.ReactNode;
  footer?: React.ReactNode;
}

/** En-tête V3 — bandeau gradient + titre section. */
export const AuroraHeader: React.FC<AuroraHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  left,
  right,
  footer,
  tone = 'default',
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const night = tone === 'night';
  const styles = useMemo(() => createStyles(colors, night), [colors, night]);

  return (
    <AnimatedEntrance kind="fadeDown">
      <View style={styles.shell}>
        <ProDayGradient kind="cta" style={styles.accentBar} />
        <View style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
          {left ? <View style={styles.left}>{left}</View> : null}
          <View style={styles.copy}>
            {eyebrow ? (
              <ProDayText
                variant="caption"
                muted={!night}
                style={[styles.eyebrow, night && styles.inkMuted]}
                numberOfLines={1}
              >
                {eyebrow}
              </ProDayText>
            ) : null}
            <ProDayText
              variant="title"
              style={[styles.title, night && styles.ink]}
              numberOfLines={2}
            >
              {title}
            </ProDayText>
            {subtitle ? (
              <ProDayText
                variant="body"
                muted={!night}
                style={night ? styles.inkMuted : undefined}
                numberOfLines={3}
              >
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

function createStyles(
  _colors: ReturnType<typeof useAppTheme>['colors'],
  night: boolean,
) {
  return StyleSheet.create({
    shell: { position: 'relative', zIndex: 2 },
    accentBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      opacity: night ? 0.85 : 1,
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
    ink: { color: '#F7FBF8' },
    inkMuted: { color: 'rgba(247,251,248,0.72)' },
    left: { flexShrink: 0, paddingTop: 2 },
    right: { flexShrink: 0 },
    footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  });
}
