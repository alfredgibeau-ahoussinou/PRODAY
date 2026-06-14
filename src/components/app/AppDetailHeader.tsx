import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedEntrance } from '../motion/AnimatedEntrance';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface AppDetailHeaderProps {
  title: string;
  subtitle?: string;
  caption?: string;
  leading?: React.ReactNode;
  footer?: React.ReactNode;
}

/** Bloc d’en-tête de détail — surface plate, pas de bannière hero. */
export const AppDetailHeader: React.FC<AppDetailHeaderProps> = ({
  title,
  subtitle,
  caption,
  leading,
  footer,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AnimatedEntrance kind="fadeUp">
    <View style={styles.wrap}>
      <View style={styles.row}>
        {leading ? <View style={styles.leading}>{leading}</View> : null}
        <View style={styles.copy}>
          {caption ? (
            <ProDayText variant="caption" muted style={styles.caption}>
              {caption}
            </ProDayText>
          ) : null}
          <ProDayText variant="title" numberOfLines={3}>
            {title}
          </ProDayText>
          {subtitle ? (
            <ProDayText variant="body" muted style={styles.subtitle}>
              {subtitle}
            </ProDayText>
          ) : null}
        </View>
      </View>
      {footer ? (
        <AnimatedEntrance kind="fade" index={1} delayStep={90}>
          <View style={styles.footer}>{footer}</View>
        </AnimatedEntrance>
      ) : null}
    </View>
    </AnimatedEntrance>
  );
};

function createStyles(c: { surface: string; border: string }) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      gap: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    leading: {
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    caption: {
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      fontSize: 11,
    },
    subtitle: {
      marginTop: 2,
      lineHeight: 20,
    },
    footer: {},
  });
}
