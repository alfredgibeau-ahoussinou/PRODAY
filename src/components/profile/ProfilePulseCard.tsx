import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import { ProDayPulseInteractive } from '../interactive/ProDayPulseInteractive';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { isProfileMobile, profileType } from './profileTypography';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface ProfilePulseCardProps {
  pulse: ProdayPulseResult;
  breakdown: PulseBreakdownItem[];
  compact?: boolean;
}

export const ProfilePulseCard: React.FC<ProfilePulseCardProps> = ({
  pulse,
  breakdown,
  compact = false,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c, compact), [c, compact]);
  const centered = compact && isProfileMobile;

  return (
    <View style={styles.wrap}>
      {!compact ? (
        <View style={styles.titleRow}>
          <Icon name="star-four-points" size={16} color={c.brand} />
          <ProDayText variant="section" inverse style={profileType.menuTitle}>
            Pulse ProDay
          </ProDayText>
        </View>
      ) : null}
      <ProDayPulseInteractive
        pulse={pulse}
        breakdown={breakdown}
        variant="dark"
        density={compact ? 'compact' : 'default'}
        align={centered ? 'center' : 'start'}
      />
    </View>
  );
};

function createStyles(c: AppColors, compact: boolean) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.surfaceInverse,
      borderRadius: radius.lg,
      padding: compact ? spacing.md : spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.brand,
      alignItems: compact && isProfileMobile ? 'center' : 'stretch',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: spacing.sm,
    },
  });
}
