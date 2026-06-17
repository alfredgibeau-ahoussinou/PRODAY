import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, RefreshControl, View } from 'react-native';
import type { User } from '../../../models/User';
import type { FriendlyMatch } from '../../../models/FriendlyMatch';
import type { AmicauxStatusFilter } from '../../../content/matchChapters';
import { getAmicauxStatusFilters } from '../../../i18n/localizedChapters';
import { SearchBar } from '../../ui/SearchBar';
import { ProDaySelect } from '../../ui/ProDaySelect';
import { MatchChapterIntro } from '../MatchChapterIntro';
import { MatchFriendlyCard } from '../MatchFriendlyCard';
import { SkeletonList, InteractiveListItem } from '../../motion';
import { ListEmptyPanel } from '../../ui/ListEmptyPanel';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing, radius } from '../../../theme/designTokens';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

export interface MatchAmicauxChapterProps {
  profile: User | null;
  matches: FriendlyMatch[];
  filteredMatches: FriendlyMatch[];
  loadingMatches: boolean;
  amicauxSearch: string;
  onAmicauxSearchChange: (value: string) => void;
  amicauxStatus: AmicauxStatusFilter;
  onAmicauxStatusChange: (value: AmicauxStatusFilter) => void;
  myClubId: string | null;
  canAccept: (match: FriendlyMatch) => boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onPropose: () => void;
  onSearch: () => void;
  onAcceptMatch: (match: FriendlyMatch) => void;
  onCancelMatch: (match: FriendlyMatch) => void;
  onMarkPlayed: (match: FriendlyMatch) => void;
  getMatchIaScore?: (matchId: string) => number | undefined;
  getMatchHealthWarning?: (matchId: string) => string | undefined;
}

export const MatchAmicauxChapter: React.FC<MatchAmicauxChapterProps> = ({
  profile,
  matches,
  filteredMatches,
  loadingMatches,
  amicauxSearch,
  onAmicauxSearchChange,
  amicauxStatus,
  onAmicauxStatusChange,
  myClubId,
  canAccept,
  refreshing,
  onRefresh,
  onPropose,
  onSearch,
  onAcceptMatch,
  onCancelMatch,
  onMarkPlayed,
  getMatchIaScore,
  getMatchHealthWarning,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const amicauxStatusFilters = useMemo(() => getAmicauxStatusFilters(t), [t]);

  return (
    <ScrollView
      contentContainerStyle={MATCH_CHAPTER_PAD}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      {...scrollProps}
    >
      <MatchChapterIntro
        title={t('matchs.friendly.intro.title')}
        subtitle={t('matchs.friendly.intro.subtitle')}
      />

      <View style={[styles.filters, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <SearchBar
          placeholder={t('matchs.friendly.search')}
          value={amicauxSearch}
          onChangeText={onAmicauxSearchChange}
        />
        <ProDaySelect<AmicauxStatusFilter>
          label={t('matchs.friendly.filter.status')}
          placeholder={t('matchs.filter.friendly.all')}
          options={amicauxStatusFilters.map((f) => ({ id: f.id, label: f.label }))}
          value={amicauxStatus}
          onChange={onAmicauxStatusChange}
          inset={false}
        />
      </View>

      {loadingMatches ? (
        <SkeletonList count={3} variant="card" />
      ) : filteredMatches.length === 0 ? (
        <ListEmptyPanel
          icon="handshake"
          title={t('matchs.friendly.empty.title')}
          subtitle={
            matches.length > 0
              ? t('matchs.friendly.empty.filtered')
              : t('matchs.friendly.empty.default')
          }
          primaryCta={
            matches.length === 0 ? { label: t('matchs.friendly.cta.propose'), onPress: onPropose } : undefined
          }
          secondaryCta={
            matches.length === 0 ? { label: t('matchs.friendly.cta.search'), onPress: onSearch } : undefined
          }
        />
      ) : (
        filteredMatches.map((m, index) => {
          const isMine =
            myClubId != null &&
            (m.requester_club_id === myClubId || m.opponent_club_id === myClubId);
          const showAccept = canAccept(m) && !isMine && Boolean(profile);
          return (
            <InteractiveListItem key={m.id} index={index}>
              <MatchFriendlyCard
                match={m}
                isMine={isMine}
                showAccept={showAccept}
                iaScore={getMatchIaScore?.(m.id)}
                healthWarning={getMatchHealthWarning?.(m.id)}
                onAccept={() => onAcceptMatch(m)}
                onCancel={() => onCancelMatch(m)}
                onMarkPlayed={() => onMarkPlayed(m)}
              />
            </InteractiveListItem>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  filters: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
});
