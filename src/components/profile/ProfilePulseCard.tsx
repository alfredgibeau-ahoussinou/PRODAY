import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import { ProDayPulseInteractive } from '../interactive/ProDayPulseInteractive';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface ProfilePulseCardProps {
  pulse: ProdayPulseResult;
  breakdown: PulseBreakdownItem[];
}

export const ProfilePulseCard: React.FC<ProfilePulseCardProps> = ({ pulse, breakdown }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Icon name="star-four-points" size={16} color={c.brand} />
        <Text style={styles.title}>Pulse ProDay</Text>
      </View>
      <ProDayPulseInteractive pulse={pulse} breakdown={breakdown} variant="dark" />
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.surfaceInverse,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.brand,
    },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
    title: { color: c.brandInverse, fontSize: 14, fontWeight: '900' },
  });
}
