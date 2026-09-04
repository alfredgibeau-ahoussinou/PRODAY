import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { PressableSpring } from '../motion/PressableSpring';
import { ELITE_COLORS, ELITE_RADIUS, ELITE_SPACING } from '../../theme/prodayEliteTheme';
import { EliteBadge } from './EliteBadge';

interface RecruitmentAdCardProps {
  clubName: string;
  roleLine: string;
  meta: string;
  onPress?: () => void;
  imageSource?: ImageSourcePropType;
  badge?: string;
}

export const RecruitmentAdCard: React.FC<RecruitmentAdCardProps> = ({
  clubName,
  roleLine,
  meta,
  onPress,
  imageSource,
  badge,
}) => {
  return (
    <PressableSpring
      style={styles.card}
      onPress={onPress}
      disabled={!onPress}
      scaleTo={0.97}
      haptic={Boolean(onPress)}
    >
      {imageSource ? (
        <Image source={imageSource} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={styles.logo}>
          <Text style={styles.logoText}>{clubName.charAt(0).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.club} numberOfLines={1}>
            {clubName}
          </Text>
          {badge ? (
            <EliteBadge label={badge} variant="success" size="sm" />
          ) : null}
        </View>

        <Text style={styles.role} numberOfLines={1}>
          {roleLine}
        </Text>

        <Text style={styles.meta} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <View style={styles.chevronContainer}>
        <Text style={styles.chevron}>›</Text>
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ELITE_SPACING.md,
    marginBottom: ELITE_SPACING.sm,
    backgroundColor: ELITE_COLORS.bgSurface,
    borderRadius: ELITE_RADIUS.lg,
    borderWidth: 1,
    borderColor: ELITE_COLORS.border,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: ELITE_RADIUS.md,
    marginRight: ELITE_SPACING.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: ELITE_RADIUS.md,
    backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    borderWidth: 1,
    borderColor: ELITE_COLORS.borderHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ELITE_SPACING.md,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: ELITE_COLORS.primary,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  club: {
    color: ELITE_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  role: {
    color: ELITE_COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    color: ELITE_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  chevronContainer: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: ELITE_SPACING.sm,
  },
  chevron: {
    fontSize: 22,
    fontWeight: '700',
    color: ELITE_COLORS.textMuted,
  },
});
