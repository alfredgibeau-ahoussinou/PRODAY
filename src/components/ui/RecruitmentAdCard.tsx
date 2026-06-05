import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { spacing, radius, shadows } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';

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
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        shadows.soft,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
    >
      {imageSource ? (
        <Image source={imageSource} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.logo, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.logoText, { color: colors.brand }]}>{clubName.charAt(0)}</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.club, { color: colors.text }]}>{clubName}</Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
              <Text style={[styles.badgeText, { color: colors.brand }]}>{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.role, { color: colors.textSecondary }]}>{roleLine}</Text>
        <Text style={[styles.meta, { color: colors.textMuted }]}>{meta}</Text>
      </View>
      <Text style={[styles.chevron, { color: colors.brand }]}>›</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    marginRight: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoText: { fontSize: 20, fontWeight: '800' },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  club: { fontSize: 16, fontWeight: '800', flex: 1 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
  role: { fontSize: 14, marginTop: 2 },
  meta: { fontSize: 12, marginTop: 4 },
  chevron: { fontSize: 22, fontWeight: '600', marginLeft: spacing.sm },
});
