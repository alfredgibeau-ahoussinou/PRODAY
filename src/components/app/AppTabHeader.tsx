import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedEntrance } from '../motion/AnimatedEntrance';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing } from '../../theme/designTokens';

interface AppTabHeaderProps {
  title: string;
  subtitle?: string;
  caption?: string;
  right?: React.ReactNode;
  footer?: React.ReactNode;
  /** Inclut la safe area haute (écrans racine d’onglet). */
  safeTop?: boolean;
}

/**
 * En-tête d’onglet style app native — titre large, fond plat, pas de carte marketing.
 */
export const AppTabHeader: React.FC<AppTabHeaderProps> = ({
  title,
  subtitle,
  caption,
  right,
  footer,
  safeTop = true,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AnimatedEntrance kind="fadeDown">
    <View style={styles.shell}>
      <ProDayGradient kind="cta" style={styles.accentBar} />
      <View
        style={[
          styles.wrap,
          safeTop && { paddingTop: spacing.xs },
        ]}
      >
      <View style={styles.row}>
        <View style={styles.copy}>
          {caption ? (
            <ProDayText variant="caption" muted style={styles.caption} numberOfLines={1}>
              {caption}
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
            <ProDayText variant="body" muted style={styles.subtitle} numberOfLines={3}>
              {subtitle}
            </ProDayText>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {footer ? (
        <AnimatedEntrance kind="fadeUp" index={1} delayStep={80}>
          <View style={styles.footer}>{footer}</View>
        </AnimatedEntrance>
      ) : null}
      </View>
    </View>
    </AnimatedEntrance>
  );
};

function createStyles(c: { surface: string; border: string; background: string }) {
  return StyleSheet.create({
    shell: {
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    accentBar: {
      height: 3,
      width: '100%',
    },
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    copy: { flex: 1, flexShrink: 1, minWidth: 0 },
    caption: {
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontSize: 11,
      marginBottom: 2,
      flexShrink: 1,
    },
    title: {
      fontWeight: '800',
      letterSpacing: -0.4,
      flexShrink: 1,
    },
    subtitle: {
      marginTop: 4,
      fontSize: 14,
      lineHeight: 19,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      gap: spacing.xs,
      paddingTop: 4,
    },
    footer: {
      marginTop: spacing.md,
    },
  });
}
