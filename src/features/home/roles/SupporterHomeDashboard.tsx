import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { User } from '../../../models/User';
import { PushScreenTransition } from '../../../components/motion';
import { ProDayText } from '../../../components/ui/ProDayText';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { useFollows } from '../../../hooks/useFollows';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing } from '../../../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../../../components/navigation/BottomTabBar';
import { SupporterLiveScoresStrip } from '../../../components/supporter/SupporterLiveScoresStrip';
import { SupporterPageFrame } from '../../../components/supporter/SupporterPageFrame';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../../../content/supporterPageIdentity';
import { SupporterClubSearch } from '../../../components/supporter/SupporterClubSearch';
import { SupporterMatchDetailScreen } from '../../../screens/supporter/SupporterMatchDetailScreen';
import { getSupporterHomeLayout } from '../../../utils/supporterHomeLayout';
import type { SupporterMatchViewItem } from '../../../utils/supporterMatchFilters';

export interface SupporterHomeProps {
  profile: User;
  unreadMessages: number;
  onRefresh?: () => Promise<void>;
  refreshing?: boolean;
}

/** Accueil tribune — scores live, coups d’envoi des clubs suivis, recherche. */
export const SupporterHomeDashboard: React.FC<SupporterHomeProps> = ({
  profile,
  onRefresh,
  refreshing,
}) => {
  const identity = getSupporterPageIdentity('tribune');
  const layout = getSupporterHomeLayout();
  const { clubs: followedClubDocs, refresh: refreshFollows, toggle, isFollowing } = useFollows(
    profile.uid,
  );
  const { t } = useTranslation();
  const nav = useTabNavigationActions();
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);

  const followedIds = useMemo(
    () => new Set(followedClubDocs.map((row) => row.target_id)),
    [followedClubDocs],
  );

  const handleRefresh = useCallback(async () => {
    await refreshFollows();
    await onRefresh?.();
  }, [refreshFollows, onRefresh]);

  const handleToggleClub = useCallback(
    (id: string, label: string) => {
      void toggle('club', id, label);
    },
    [toggle],
  );

  return (
    <>
      <SupporterPageFrame identity={identity} showHero={layout.hasTribuneHero} badge="100 % gratuit">
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={() => void handleRefresh()}
              tintColor={SUPPORTER_SITE.accent}
            />
          }
        >
          <SupporterClubSearch
            compact
            followedIds={followedIds}
            onToggle={handleToggleClub}
          />

          <SupporterLiveScoresStrip
            onViewAll={() => nav.openMatchs({ homeTab: 'season' })}
            onOpenMatch={setSelected}
          />

          <View style={styles.freeStamp}>
            <ProDayText variant="caption" style={styles.freeStampText}>
              {t('supporter.home.freeStamp')}
            </ProDayText>
          </View>
        </ScrollView>
      </SupporterPageFrame>

      <PushScreenTransition active={Boolean(selected)}>
        {selected ? (
          <SupporterMatchDetailScreen
            item={selected}
            onBack={() => setSelected(null)}
            isFollowedClub={(id) => isFollowing('club', id)}
            onToggleClub={handleToggleClub}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  pad: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    gap: spacing.md,
  },
  freeStamp: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  freeStampText: {
    color: SUPPORTER_SITE.muted,
    fontWeight: '600',
    fontSize: 11,
    textAlign: 'center',
  },
});
