import React, { useMemo, useState } from 'react';
import { ScrollView, RefreshControl, View, StyleSheet } from 'react-native';
import type { User } from '../../../models/User';
import type { Tournament } from '../../../models/Tournament';
import { MATCH_SITE } from '../../../content/matchPageIdentity';
import { SearchBar } from '../../ui/SearchBar';
import { MatchChapterIntro } from '../MatchChapterIntro';
import { MatchTournamentCard } from '../MatchTournamentCard';
import { SkeletonList } from '../../motion';
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

interface MatchTournamentsChapterProps {
  profile: User | null;
  tournaments: Tournament[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenTournament: (id: string) => void;
  onCreateTournament?: () => void;
  myClubId: string | null;
}

export const MatchTournamentsChapter: React.FC<MatchTournamentsChapterProps> = ({
  profile,
  tournaments,
  loading,
  refreshing,
  onRefresh,
  onOpenTournament,
  onCreateTournament,
  myClubId,
}) => {
  const { colors: c } = useAppTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tournaments;
    return tournaments.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.city.toLowerCase().includes(q) ||
        item.categories.some((cat) => cat.toLowerCase().includes(q))
    );
  }, [tournaments, search]);

  const canOrganize =
    profile &&
    (profile.role === 'organizer' || profile.role === 'club' || profile.role === 'coach');

  return (
    <ScrollView
      contentContainerStyle={[MATCH_CHAPTER_PAD, styles.stack]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
      }
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      <MatchChapterIntro
        kicker="Tournois"
        title={t('tournament.intro.title')}
        subtitle={t('tournament.intro.subtitle')}
      />

      <MatchKpiRow
        items={[
          { label: 'Total', value: String(tournaments.length), tone: c.accent },
          {
            label: 'Liste',
            value: String(filtered.length),
            tone: MATCH_SITE.foreground,
          },
        ]}
      />

      {canOrganize && onCreateTournament ? (
        <MatchActionRow
          primary={t('tournament.create.cta')}
          onPrimary={onCreateTournament}
        />
      ) : null}

      <MatchFilterBar>
        <SearchBar
          placeholder={t('tournament.search')}
          value={search}
          onChangeText={setSearch}
        />
      </MatchFilterBar>

      {loading ? (
        <SkeletonList count={3} variant="card" />
      ) : filtered.length === 0 ? (
        <MatchEmptyState
          title={t('tournament.empty.title')}
          body={t('tournament.empty.body')}
        />
      ) : (
        <View style={styles.list}>
          <ProDayText variant="caption" style={[styles.sectionKicker, { color: c.accent }]}>
            Tournois · {filtered.length}
          </ProDayText>
          {filtered.map((tournament) => {
            const registered = Boolean(
              myClubId &&
                tournament.registrations.some((r) => r.club_id === myClubId)
            );
            return (
              <MatchTournamentCard
                key={tournament.id}
                tournament={tournament}
                colors={c}
                registered={registered}
                onPress={() => onOpenTournament(tournament.id)}
              />
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
