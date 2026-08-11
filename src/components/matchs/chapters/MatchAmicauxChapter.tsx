import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, RefreshControl, View } from 'react-native';
import type { User } from '../../../models/User';
import type { FriendlyMatch } from '../../../models/FriendlyMatch';
import type { AmicauxStatusFilter } from '../../../content/matchChapters';
import { MATCH_SITE } from '../../../content/matchPageIdentity';
import { getAmicauxStatusFilters } from '../../../i18n/localizedChapters';
import { SearchBar } from '../../ui/SearchBar';
import { ProDaySelect } from '../../ui/ProDaySelect';
import { MatchChapterIntro } from '../MatchChapterIntro';
import { MatchFriendlyCard } from '../MatchFriendlyCard';
import { SkeletonList, InteractiveListItem } from '../../motion';
import { ProDayText } from '../../ui/ProDayText';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing } from '../../../theme/designTokens';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';
import {
  MatchActionRow,
  MatchEmptyState,
  MatchFilterBar,
  MatchKpiRow,
} from '../matchCenterUi';

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
  onOrganize?: () => void;
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
  onOrganize,
  onAcceptMatch,
  onCancelMatch,
  onMarkPlayed,
  getMatchIaScore,
  getMatchHealthWarning,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const amicauxStatusFilters = useMemo(() => getAmicauxStatusFilters(t), [t]);
  const openCount = matches.filter((m) => m.status === 'OPEN').length;

  return (
    <ScrollView
      contentContainerStyle={[MATCH_CHAPTER_PAD, styles.stack]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      {...scrollProps}
    >
      <MatchChapterIntro
        kicker="Amicaux"
        title={t('matchs.friendly.intro.title')}
        subtitle={t('matchs.friendly.intro.subtitle')}
      />

      <MatchKpiRow
        items={[
          { label: 'Ouverts', value: String(openCount), tone: MATCH_SITE.warn },
          {
            label: 'Liste',
            value: String(filteredMatches.length),
            tone: colors.accent,
          },
        ]}
      />

      <MatchActionRow
        primary={t('matchs.friendly.cta.proposeMatch')}
        onPrimary={onPropose}
        secondary={
          onOrganize ? t('matchs.friendly.cta.organize') : t('matchs.friendly.cta.search')
        }
        onSecondary={onOrganize ?? onSearch}
      />

      <MatchFilterBar>
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
      </MatchFilterBar>

      {loadingMatches ? (
        <SkeletonList count={3} variant="card" />
      ) : filteredMatches.length === 0 ? (
        <MatchEmptyState
          title={t('matchs.friendly.empty.title')}
          body={
            matches.length > 0
              ? t('matchs.friendly.empty.filtered')
              : t('matchs.friendly.empty.default')
          }
          cta={matches.length === 0 ? t('matchs.friendly.cta.propose') : undefined}
          onPress={matches.length === 0 ? onPropose : undefined}
        />
      ) : (
        <View style={styles.list}>
          <ProDayText variant="caption" style={[styles.sectionKicker, { color: colors.accent }]}>
            Offres · {filteredMatches.length}
          </ProDayText>
          {filteredMatches.map((m, index) => {
            const isMine =
              myClubId != null &&
              (m.requester_club_id === myClubId || m.opponent_club_id === myClubId);
            const showAccept = canAccept(m) && Boolean(profile);
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
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: { gap: spacing.md, paddingTop: spacing.sm },
  list: { gap: spacing.xs },
  sectionKicker: {
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
});
