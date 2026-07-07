import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { SupporterFilterBar } from '../components/supporter/SupporterFilterBar';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { PressableSpring } from '../components/motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LocaleContext';
import { followsService } from '../services/follows.service';
import {
  loadSupporterMatchFilters,
  saveSupporterMatchFilters,
  type SupporterMatchFilters,
} from '../services/supporterPreferences.service';
import type { Follow, FollowTargetType } from '../models/Follow';
import { clubsService } from '../services/clubs.service';
import { usersService } from '../services/users.service';
import { useTournaments } from '../hooks/useTournaments';
import { useAppTheme } from '../context/ProductLineContext';
import { buildFollowContext, filterTournamentsBySearch } from '../utils/supporterMatchFilters';
import { radius, spacing } from '../theme/designTokens';

type TournamentDateFilter = 'all' | 'week' | 'month';

export const SupporterSuivisScreen: React.FC = () => {
  const { profile } = useAuth();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { tournaments } = useTournaments();
  const [clubs, setClubs] = useState<{ id: string; name: string; city: string }[]>([]);
  const [players, setPlayers] = useState<{ id: string; name: string; city?: string }[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [cityQuery, setCityQuery] = useState('');
  const [playerQuery, setPlayerQuery] = useState('');
  const [clubQuery, setClubQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<TournamentDateFilter>('all');
  const [filters, setFilters] = useState<SupporterMatchFilters>({
    gender: 'all',
    source: 'all',
    scope: 'all',
  });

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) return;
    const list = await followsService.listByFollower(profile.uid);
    setFollows(list);
  }, [profile?.uid]);

  useEffect(() => {
    if (!profile?.uid) return;
    loadSupporterMatchFilters(profile.uid)
      .then(setFilters)
      .catch(() => undefined);
    void loadFollows();
  }, [profile?.uid, loadFollows]);

  useEffect(() => {
    const q = clubQuery.trim();
    if (q.length >= 2) {
      clubsService
        .searchByName(q)
        .then((rows) =>
          setClubs(rows.slice(0, 12).map((club) => ({ id: club.id, name: club.name, city: club.city })))
        )
        .catch(() => setClubs([]));
      return;
    }
    clubsService
      .list(12)
      .then((rows) => setClubs(rows.map((club) => ({ id: club.id, name: club.name, city: club.city }))))
      .catch(() => setClubs([]));
  }, [clubQuery]);

  useEffect(() => {
    const q = playerQuery.trim();
    if (q.length >= 2) {
      usersService
        .listPlayers(q)
        .then((rows) =>
          setPlayers(
            rows.slice(0, 12).map((player) => ({
              id: player.uid,
              name: player.display_name,
              city: player.city,
            }))
          )
        )
        .catch(() => setPlayers([]));
      return;
    }
    usersService
      .listRecentPlayers()
      .then((rows) =>
        setPlayers(
          rows.slice(0, 10).map((player) => ({
            id: player.uid,
            name: player.display_name,
            city: player.city,
          }))
        )
      )
      .catch(() => setPlayers([]));
  }, [playerQuery]);

  const followedKeys = useMemo(
    () => new Set(follows.map((follow) => `${follow.target_type}:${follow.target_id}`)),
    [follows]
  );

  const handleFiltersChange = useCallback(
    (next: SupporterMatchFilters) => {
      setFilters(next);
      if (profile?.uid) {
        void saveSupporterMatchFilters(profile.uid, next);
      }
    },
    [profile?.uid]
  );

  const toggleFollow = async (
    targetType: FollowTargetType,
    targetId: string,
    targetLabel: string
  ) => {
    if (!profile?.uid) return;
    await followsService.toggle(profile.uid, targetType, targetId, targetLabel);
    await loadFollows();
  };

  const followedClubs = follows.filter((follow) => follow.target_type === 'club');
  const followedPlayers = follows.filter((follow) => follow.target_type === 'player');
  const followedTournaments = follows.filter((follow) => follow.target_type === 'tournament');

  const filteredTournaments = useMemo(() => {
    const ctx = buildFollowContext(follows);
    let rows = tournaments;
    if (filters.scope === 'follows') {
      rows = rows.filter((tournament) => ctx.tournamentIds.has(tournament.id));
    }
    return filterTournamentsBySearch(rows, cityQuery, dateFilter).slice(0, 12);
  }, [tournaments, cityQuery, dateFilter, filters.scope, follows]);

  const renderRow = (
    type: FollowTargetType,
    id: string,
    title: string,
    subtitle?: string
  ) => {
    const key = `${type}:${id}`;
    const active = followedKeys.has(key);
    return (
      <View
        key={key}
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.copy}>
          <ProDayText variant="section">{title}</ProDayText>
          {subtitle ? <ProDayText variant="caption" muted>{subtitle}</ProDayText> : null}
        </View>
        <PressableSpring
          onPress={() => void toggleFollow(type, id, title)}
          style={[
            styles.action,
            {
              backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
              borderColor: active ? colors.accent : colors.border,
            },
          ]}
        >
          <ProDayText variant="caption" style={{ color: active ? colors.accent : colors.textSecondary }}>
            {active ? t('supporter.match.action.following') : t('supporter.match.action.follow')}
          </ProDayText>
        </PressableSpring>
      </View>
    );
  };

  const DATE_FILTERS: { id: TournamentDateFilter; labelKey: string }[] = [
    { id: 'all', labelKey: 'supporter.suivis.date.all' },
    { id: 'week', labelKey: 'supporter.suivis.date.week' },
    { id: 'month', labelKey: 'supporter.suivis.date.month' },
  ];

  return (
    <TabScreenShell
      caption={t('supporter.shell.caption')}
      title={t('supporter.suivis.title')}
      subtitle={t('supporter.suivis.subtitle')}
      flat
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ProDayText variant="eyebrow" muted>
          {t('supporter.suivis.myFollows')}
        </ProDayText>
        <View style={[styles.summary, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <ProDayText variant="caption" muted>
            {t('supporter.suivis.summary', {
              clubs: String(followedClubs.length),
              players: String(followedPlayers.length),
              tournaments: String(followedTournaments.length),
            })}
          </ProDayText>
          <ProDayText variant="caption" accent>
            {t('supporter.suivis.freeUnlimited')}
          </ProDayText>
        </View>

        {followedClubs.length + followedPlayers.length + followedTournaments.length > 0 ? (
          <>
            {followedClubs.map((follow) =>
              renderRow('club', follow.target_id, follow.target_label ?? follow.target_id, t('supporter.followType.club'))
            )}
            {followedPlayers.map((follow) =>
              renderRow('player', follow.target_id, follow.target_label ?? follow.target_id, t('supporter.followType.player'))
            )}
            {followedTournaments.map((follow) =>
              renderRow(
                'tournament',
                follow.target_id,
                follow.target_label ?? follow.target_id,
                t('supporter.followType.tournament')
              )
            )}
          </>
        ) : (
          <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
            <ProDayText variant="body">{t('supporter.empty.follows')}</ProDayText>
          </ProDaySurface>
        )}

        <ProDayText variant="eyebrow" muted style={styles.sectionTitle}>
          {t('supporter.suivis.searchPlayers')}
        </ProDayText>
        <TextInput
          value={playerQuery}
          onChangeText={setPlayerQuery}
          placeholder={t('supporter.suivis.playerPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        />
        {players.length > 0 ? (
          players.map((player) =>
            renderRow('player', player.id, player.name, player.city ?? t('supporter.followType.player'))
          )
        ) : (
          <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
            <ProDayText variant="caption" muted>{t('supporter.suivis.noPlayers')}</ProDayText>
          </ProDaySurface>
        )}

        <ProDayText variant="eyebrow" muted style={styles.sectionTitle}>
          {t('supporter.suivis.searchClubs')}
        </ProDayText>
        <TextInput
          value={clubQuery}
          onChangeText={setClubQuery}
          placeholder={t('supporter.suivis.clubPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        />
        {clubs.slice(0, 8).map((club) => renderRow('club', club.id, club.name, club.city))}

        <ProDayText variant="eyebrow" muted style={styles.sectionTitle}>
          {t('supporter.suivis.tournamentSearch')}
        </ProDayText>
        <SupporterFilterBar filters={filters} onChange={handleFiltersChange} />
        <TextInput
          value={cityQuery}
          onChangeText={setCityQuery}
          placeholder={t('supporter.suivis.cityPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
        />
        <View style={styles.dateChips}>
          {DATE_FILTERS.map((entry) => {
            const active = entry.id === dateFilter;
            return (
              <PressableSpring
                key={entry.id}
                onPress={() => setDateFilter(entry.id)}
                style={[
                  styles.dateChip,
                  {
                    backgroundColor: active ? colors.accent : colors.surface,
                    borderColor: active ? colors.accent : colors.border,
                  },
                ]}
              >
                <ProDayText variant="caption" style={{ color: active ? '#fff' : colors.textSecondary }}>
                  {t(entry.labelKey)}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
        {filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament) =>
            renderRow('tournament', tournament.id, tournament.title, tournament.city)
          )
        ) : (
          <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
            <ProDayText variant="caption" muted>{t('supporter.empty.tournaments')}</ProDayText>
          </ProDaySurface>
        )}
      </ScrollView>
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  sectionTitle: {
    marginTop: spacing.lg,
  },
  empty: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  summary: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  action: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dateChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  dateChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
