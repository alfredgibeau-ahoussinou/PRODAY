import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, radius, shadows } from '../../theme/designTokens';

interface RecruitmentAdCardProps {
  clubName: string;
  roleLine: string;
  meta: string;
  onPress?: () => void;
}

export const RecruitmentAdCard: React.FC<RecruitmentAdCardProps> = ({
  clubName,
  roleLine,
  meta,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.card, shadows.card]}
    onPress={onPress}
    activeOpacity={onPress ? 0.85 : 1}
  >
    <View style={styles.logo}>
      <Text style={styles.logoText}>{clubName.charAt(0)}</Text>
    </View>
    <View style={styles.body}>
      <Text style={styles.club}>{clubName}</Text>
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoText: { fontSize: 20, fontWeight: '800', color: colors.brand },
  body: { flex: 1 },
  club: { fontSize: 16, fontWeight: '700', color: colors.text },
  role: { fontSize: 14, color: colors.brand, marginTop: 2, fontWeight: '600' },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  chevron: { fontSize: 22, color: colors.textMuted, marginLeft: spacing.sm },
});
