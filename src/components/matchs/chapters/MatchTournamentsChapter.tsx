import React, { useMemo, useState } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import type { User } from '../../../models/User';
import type { Tournament } from '../../../models/Tournament';
import { SearchBar } from '../../ui/SearchBar';
import { MatchChapterIntro } from '../MatchChapterIntro';
import { MatchTournamentCard } from '../MatchTournamentCard';
import { SkeletonList } from '../../motion';
import { ListEmptyPanel } from '../../ui/ListEmptyPanel';
import { PressableSpring } from '../../motion';
import { ProDayText } from '../../ui/ProDayText';
import { Icon } from '../../ui/Icon';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing, radius } from '../../../theme/designTokens';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';

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
      contentContainerStyle={MATCH_CHAPTER_PAD}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
      }
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      <MatchChapterIntro
        title={t('tournament.intro.title')}
        subtitle={t('tournament.intro.subtitle')}
      />

      {canOrganize && onCreateTournament ? (
        <PressableSpring
          onPress={onCreateTournament}
          scaleTo={0.98}
          haptic
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            backgroundColor: c.brand,
            borderRadius: radius.md,
            paddingVertical: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <Icon name="add" size={18} color={c.brandInverse} />
          <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
            {t('tournament.create.cta')}
          </ProDayText>
        </PressableSpring>
      ) : null}

      <SearchBar
        placeholder={t('tournament.search')}
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <SkeletonList count={3} variant="card" />
      ) : filtered.length === 0 ? (
        <ListEmptyPanel
          icon="trophy"
          title={t('tournament.empty.title')}
          subtitle={t('tournament.empty.body')}
        />
      ) : (
        <View style={{ gap: spacing.sm }}>
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
