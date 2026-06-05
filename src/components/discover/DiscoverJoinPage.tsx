import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, Text } from 'react-native';
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
import { spacing, BRAND } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

interface DiscoverJoinPageProps {
  onExperience: (id: DiscoverExperienceId) => void;
  onSignup: () => void;
  /** Marge bas (pager accueil — hors barre d’onglets globale). */
  scrollBottomPad?: number;
}

export const DiscoverJoinPage: React.FC<DiscoverJoinPageProps> = ({
  onExperience,
  onSignup,
  scrollBottomPad,
}) => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        scrollBottomPad != null ? { paddingBottom: scrollBottomPad } : null,
      ]}
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
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
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
      color: c.textMuted,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 2,
      marginTop: spacing.sm,
    },
  });
}
