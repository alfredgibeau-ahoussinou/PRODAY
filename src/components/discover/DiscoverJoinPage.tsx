import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import {
  DiscoverExperiencesHub,
  type DiscoverExperienceId,
} from './DiscoverExperiencesHub';
import { FoundersInteractive } from './FoundersInteractive';
import { ShimmerCTA } from './ShimmerCTA';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { StaggerReveal } from '../motion';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { colors, spacing, BRAND } from '../../theme/designTokens';

interface DiscoverJoinPageProps {
  onExperience: (id: DiscoverExperienceId) => void;
  onSignup: () => void;
}

export const DiscoverJoinPage: React.FC<DiscoverJoinPageProps> = ({
  onExperience,
  onSignup,
}) => (
  <ScrollView
    style={styles.root}
    contentContainerStyle={styles.content}
    showsVerticalScrollIndicator={false}
  >
    <DiscoverSectionHeader
      label="Rejoindre"
      title="Prêt pour la saison ?"
      subtitle="Pages interactives · compte gratuit"
      compact
    />

    <DiscoverExperiencesHub onPress={onExperience} />

    <StaggerReveal index={0}>
      <View style={styles.section}>
        <FoundersInteractive />
      </View>
    </StaggerReveal>

    <View style={styles.ctaBlock}>
      <ShimmerCTA label="Créer mon compte — gratuit" onPress={onSignup} />
      <ShimmerCTA variant="secondary" label="J'ai déjà un compte" onPress={onSignup} delay={60} />
      <Animated.Text style={styles.foot}>{BRAND.tagline}</Animated.Text>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl },
  section: { marginTop: spacing.lg },
  ctaBlock: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  foot: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: spacing.sm,
  },
});
