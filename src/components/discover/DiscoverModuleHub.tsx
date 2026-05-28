import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayModuleGrid } from '../ui/ProDayModuleGrid';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import type { ProDayModuleId } from '../../content/prodayModules';
import { spacing } from '../../theme/designTokens';

interface DiscoverModuleHubProps {
  onModulePress: (id: ProDayModuleId) => void;
  liveRecruitment?: boolean;
}

export const DiscoverModuleHub: React.FC<DiscoverModuleHubProps> = ({
  onModulePress,
  liveRecruitment,
}) => (
  <View style={styles.wrap}>
    <DiscoverSectionHeader
      label="Modules ProDay"
      title="Tout en un tap"
      subtitle="Recrutement, matchs, Arena, sponsors"
    />
    <ProDayModuleGrid onModulePress={onModulePress} liveRecruitment={liveRecruitment} />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
});
