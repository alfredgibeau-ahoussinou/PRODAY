import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { PressableSpring } from '../motion';
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
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <PressableSpring
          onPress={onAction}
          scaleTo={0.97}
          haptic
          style={styles.actionBtn}
        >
          <Text style={styles.action}>{actionLabel} →</Text>
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
      fontSize: 17,
      fontWeight: '800',
      color: c.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 13,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 19,
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
      fontSize: 14,
      fontWeight: '800',
      color: c.accent,
    },
  });
}
