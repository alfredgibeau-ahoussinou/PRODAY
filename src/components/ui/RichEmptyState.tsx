import React from 'react';
import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, radius, shadows, surfaces } from '../../theme/designTokens';

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
}) => (
  <View style={[styles.wrap, style]}>
    {image ? (
      <Image source={image} style={styles.image} resizeMode="cover" />
    ) : null}
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
    {actionLabel && onAction ? (
      <Text style={styles.action} onPress={onAction}>
        {actionLabel} →
      </Text>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
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
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  action: {
    marginTop: spacing.md,
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
  },
});
