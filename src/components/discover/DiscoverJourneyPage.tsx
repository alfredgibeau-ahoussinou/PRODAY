import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DiscoverJourney } from './DiscoverJourney';
import { FeatureShowcaseAnimated } from './FeatureShowcaseAnimated';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { StaggerReveal } from '../motion';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';

interface DiscoverJourneyPageProps {
  onStepPress: (id: string) => void;
  onFeaturePress: () => void;
}

export const DiscoverJourneyPage: React.FC<DiscoverJourneyPageProps> = ({
  onStepPress,
  onFeaturePress,
}) => (
  <ScrollView
    style={styles.root}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  >
    <DiscoverSectionHeader
      label="Parcours"
      title="Vivez l'expérience"
      subtitle="Étapes interactives — touchez pour explorer"
      compact
    />

    <DiscoverJourney onStepPress={onStepPress} />

    <StaggerReveal index={0}>
      <View style={styles.section}>
        <FeatureShowcaseAnimated onFeaturePress={onFeaturePress} />
      </View>
    </StaggerReveal>
  </ScrollView>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl },
  section: { marginTop: spacing.lg },
});
