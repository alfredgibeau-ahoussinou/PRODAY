import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { DiscoverUniverseCarousel } from './DiscoverUniverseCarousel';
import { DiscoverModuleHub } from './DiscoverModuleHub';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { StaggerReveal } from '../motion';
import type { ProDayModuleId } from '../../content/prodayModules';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';

interface DiscoverUniversePageProps {
  onModulePress: (id: ProDayModuleId) => void;
  liveRecruitment: boolean;
}

export const DiscoverUniversePage: React.FC<DiscoverUniversePageProps> = ({
  onModulePress,
  liveRecruitment,
}) => (
  <ScrollView
    style={styles.root}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  >
    <DiscoverSectionHeader
      label="Modules"
      title="Tout ProDay en un tap"
      subtitle="Swipez les univers ou touchez la grille"
      compact
    />

    <StaggerReveal index={0}>
      <DiscoverUniverseCarousel onModulePress={onModulePress} showHeader={false} />
    </StaggerReveal>

    <StaggerReveal index={1}>
      <DiscoverModuleHub
        onModulePress={onModulePress}
        liveRecruitment={liveRecruitment}
      />
    </StaggerReveal>
  </ScrollView>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl },
});
