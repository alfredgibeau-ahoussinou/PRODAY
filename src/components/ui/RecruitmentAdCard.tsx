import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { colors, spacing, radius, shadows, surfaces } from '../../theme/designTokens';

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
}) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={onPress ? 0.85 : 1}
  >
    {imageSource ? (
      <Image source={imageSource} style={styles.thumb} resizeMode="cover" />
    ) : (
      <View style={styles.logo}>
        <Text style={styles.logoText}>{clubName.charAt(0)}</Text>
      </View>
    )}
    <View style={styles.body}>
      <View style={styles.titleRow}>
        <Text style={styles.club}>{clubName}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.role}>{roleLine}</Text>
      <Text style={styles.meta}>{meta}</Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    ...surfaces.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.soft,
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
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoText: { fontSize: 20, fontWeight: '800', color: colors.accent },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  club: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1 },
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.accent },
  role: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  chevron: { fontSize: 22, color: colors.accent, fontWeight: '600', marginLeft: spacing.sm },
});
