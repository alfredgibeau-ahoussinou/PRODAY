import React, { useMemo } from 'react';
import {
  View,
  Image,
  ImageSourcePropType,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from './ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, surfaces } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface RichEmptyStateProps {
  title: string;
  subtitle: string;
  image?: ImageSourcePropType;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const RichEmptyState: React.FC<RichEmptyStateProps> = ({
  title,
  subtitle,
  image,
  actionLabel,
  onAction,
  style,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={[styles.wrap, style]}>
      {image ? (
        <Image source={image} style={styles.image} resizeMode="cover" />
      ) : null}
      <ProDayText variant="section" style={styles.title}>
        {title}
      </ProDayText>
      <ProDayText variant="body" muted style={styles.subtitle}>
        {subtitle}
      </ProDayText>
      {actionLabel && onAction ? (
        <PressableSpring
          onPress={onAction}
          scaleTo={0.97}
          haptic
          style={styles.actionBtn}
        >
          <ProDayText variant="caption" accent style={styles.action}>
            {actionLabel} →
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      padding: spacing.xl,
      ...surfaces.card,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: 140,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    title: {
      textAlign: 'center',
    },
    subtitle: {
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    actionBtn: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: c.borderStrong,
      backgroundColor: c.surfaceMuted,
    },
    action: {
      fontWeight: '800',
    },
  });
}
