import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useProductLine } from '../../context/ProductLineContext';
import { useMessagesData } from '../../hooks/useAppData';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { useProDayBrain } from '../intelligence/useProDayBrain';
import { SectionShell } from '../shell/SectionShell';
import { IntelligencePanel } from '../ui/IntelligencePanel';
import { NextCard } from '../ui/NextCard';
import { NextText } from '../ui/NextText';
import { PressableSpring } from '../../components/motion';
import { nextSpacing } from '../design-system/tokens';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { CommunityGroupsPanel, SocialNearbyStrip } from '../../features/v3';

export const MessagesSection: React.FC = () => {
  const { profile } = useAuth();
  const { productLine } = useProductLine();
  const { count: unread } = useUnreadMessageCount();
  const { data } = useDashboardData(profile!);
  const brain = useProDayBrain(profile, productLine, data, unread, 'messages');
  const { threads, loading, refresh } = useMessagesData(profile?.uid);
  const [refreshing, setRefreshing] = useState(false);

  const sorted = useMemo(
    () => [...threads].sort((a, b) => Number(b.unread) - Number(a.unread)),
    [threads]
  );

  if (!profile) return null;

  return (
    <SectionShell
      sectionId="messages"
      scroll={false}
      intelligence={
        <IntelligencePanel label="IA Messages" headline={brain.headline} insights={brain.insights} compact />
      }
      stats={
        <View style={styles.stats}>
          <MiniStat value={threads.length} label="Conversations" />
          <MiniStat value={unread} label="Non lus" hi={unread > 0} />
        </View>
      }
    >
      {profile ? (
        <>
          <CommunityGroupsPanel city={profile.city} />
          <SocialNearbyStrip items={brain.socialSuggestions ?? []} />
        </>
      ) : null}

      <FlatList
        data={sorted}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingBottom: TAB_BAR_CONTENT_INSET + nextSpacing.xl, gap: nextSpacing.sm }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
            tintColor="#00FF9C"
          />
        }
        ListEmptyComponent={
          loading ? (
            <NextText variant="body" muted>
              Chargement…
            </NextText>
          ) : (
            <NextText variant="body" muted>
              Aucune conversation — contactez un profil depuis le Mercato.
            </NextText>
          )
        }
        renderItem={({ item }) => (
          <PressableSpring scaleTo={0.98} haptic>
            <NextCard variant={item.unread ? 'signal' : 'raised'}>
              <NextText variant="section" inverse={item.unread}>
                {item.participant_name}
              </NextText>
              <NextText variant="caption" muted={!item.unread} inverse={item.unread}>
                {item.last_message ?? 'Nouvelle conversation'}
              </NextText>
            </NextCard>
          </PressableSpring>
        )}
      />
    </SectionShell>
  );
};

const MiniStat: React.FC<{ value: number; label: string; hi?: boolean }> = ({ value, label, hi }) => (
  <View style={[styles.chip, hi && styles.chipHi]}>
    <NextText variant="section" accent={hi}>
      {value}
    </NextText>
    <NextText variant="micro" muted>
      {label}
    </NextText>
  </View>
);

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: nextSpacing.sm },
  chip: {
    flex: 1,
    alignItems: 'center',
    padding: nextSpacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipHi: { borderColor: 'rgba(0,255,156,0.35)' },
});
