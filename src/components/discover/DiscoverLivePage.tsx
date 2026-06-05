import React from 'react';
import { View, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { AnimatedStatCounters } from './AnimatedStatCounters';
import { DiscoverLivePreview } from './DiscoverLivePreview';
import { DiscoverHighlightStrip, buildDiscoverHighlights } from './DiscoverHighlightStrip';
import { ProDayPulseIntro } from '../interactive/ProDayPulseInteractive';
import { ExploreLaunchpads } from './ExploreLaunchpads';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { StaggerReveal } from '../motion';
import type { RecruitmentStats } from '../../services/stats.service';
import type { RecruitmentPost } from '../../models/Player';
import type { Tournament } from '../../models/Tournament';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';

interface DiscoverLivePageProps {
  stats: RecruitmentStats | null;
  posts: RecruitmentPost[];
  tournaments: Tournament[];
  loading: boolean;
  onPress: () => void;
  onMercato: () => void;
  onMatchs: () => void;
}

export const DiscoverLivePage: React.FC<DiscoverLivePageProps> = ({
  stats,
  posts,
  tournaments,
  loading,
  onPress,
  onMercato,
  onMatchs,
}) => {
  const { colors: c } = useDiscoverStyles();
  const highlights = buildDiscoverHighlights(stats, tournaments.length);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <DiscoverSectionHeader
        label="Communauté"
        title="En direct sur ProDay"
        subtitle="Communauté ProDay en temps réel"
        compact
      />

      <StaggerReveal index={0}>
        <DiscoverHighlightStrip highlights={highlights} />
      </StaggerReveal>

      <StaggerReveal index={1}>
        {loading ? (
          <ActivityIndicator color={c.brand} style={styles.loader} />
        ) : stats ? (
          <AnimatedStatCounters stats={stats} onPress={onPress} />
        ) : null}
      </StaggerReveal>

      <StaggerReveal index={2}>
        <DiscoverLivePreview
          posts={posts}
          tournaments={tournaments}
          loading={loading}
          onPress={onPress}
        />
      </StaggerReveal>

      <StaggerReveal index={3}>
        <ProDayPulseIntro stats={stats} onPress={onPress} />
      </StaggerReveal>

      <ExploreLaunchpads onMercato={onMercato} onMatchs={onMatchs} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  loader: { marginVertical: spacing.xl },
});
