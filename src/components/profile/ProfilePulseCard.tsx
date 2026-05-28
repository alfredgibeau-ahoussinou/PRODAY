import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import { ProDayPulseInteractive } from '../interactive/ProDayPulseInteractive';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

interface ProfilePulseCardProps {
  pulse: ProdayPulseResult;
  breakdown: PulseBreakdownItem[];
}

export const ProfilePulseCard: React.FC<ProfilePulseCardProps> = ({ pulse, breakdown }) => (
  <View style={styles.wrap}>
    <View style={styles.titleRow}>
      <Icon name="star-four-points" size={16} color={colors.accent} />
      <Text style={styles.title}>Pulse ProDay</Text>
    </View>
    <ProDayPulseInteractive pulse={pulse} breakdown={breakdown} variant="dark" />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  title: { color: colors.brandInverse, fontSize: 14, fontWeight: '900' },
});
