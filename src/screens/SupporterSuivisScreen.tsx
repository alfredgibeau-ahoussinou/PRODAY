import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SupporterPageFrame } from '../components/supporter/SupporterPageFrame';
import {
  getSupporterPageIdentity,
  SUPPORTER_SITE,
} from '../content/supporterPageIdentity';
import { SupporterFilterBar } from '../components/supporter/SupporterFilterBar';
import { ProDayText } from '../components/ui/ProDayText';
import { Icon } from '../components/ui/Icon';
import { PressableSpring, PushScreenTransition } from '../components/motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LocaleContext';
import { useFollows } from '../hooks/useFollows';
import {
  loadSupporterMatchFilters,
  saveSupporterMatchFilters,
  type SupporterMatchFilters,
} from '../services/supporterPreferences.service';
import type { FollowTargetType } from '../models/Follow';
import type { User } from '../models/User';
import { clubsService } from '../services/clubs.service';
import { usersService } from '../services/users.service';
import { useTournaments } from '../hooks/useTournaments';
import { useUserProfile } from '../hooks/useRecruitmentData';
import { buildFollowContext, filterTournamentsBySearch } from '../utils/supporterMatchFilters';
import { spacing } from '../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { PlayerProfileScreen } from './PlayerProfileScreen';

type SegmentId = 'players' | 'clubs' | 'tournaments';
type TournamentDateFilter = 'all' | 'week' | 'month';

type PlayerCard = {
  id: string;
  name: string;
  meta?: string;
  avatarUrl?: string;
  verified?: boolean;
};

function playerToCard(player: User): PlayerCard {
  const meta = [player.profile?.position, player.city, player.profile?.level]
    .filter(Boolean)
    .join(' · ');
  return {
    id: player.uid,
    name: player.display_name,
    meta: meta || undefined,
    avatarUrl: player.avatar_url,
    verified: player.is_verified,
  };
}

export const SupporterSuivisScreen: React.FC = () => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const { tournaments } = useTournaments();
  const {
    follows,
    loading: followsLoading,
    pendingKey,
    isFollowing,
    toggle,
    clubs: followedClubs,
    players: followedPlayers,
    tournaments: followedTournaments,
  } = useFollows(profile?.uid);

  const [segment, setSegment] = useState<SegmentId>('players');
  const [clubs, setClubs] = useState<{ id: string; name: string; city: string }[]>([]);
  const [suggestedPlayers, setSuggestedPlayers] = useState<PlayerCard[]>([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playerQuery, setPlayerQuery] = useState('');
  const [clubQuery, setClubQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<TournamentDateFilter>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const { user: selectedPlayer } = useUserProfile(selectedPlayerId);
  const [filters, setFilters] = useState<SupporterMatchFilters>({
    gender: 'all',
    source: 'all',
    scope: 'all',
    competition: 'all',
  });

  useEffect(() => {
    if (!profile?.uid) return;
    loadSupporterMatchFilters(profile.uid)
      .then(setFilters)
      .catch(() => undefined);
  }, [profile?.uid]);

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
    let cancelled = false;
    const q = playerQuery.trim();
    setPlayersLoading(true);
    const load = q.length >= 2 ? usersService.listPlayers(q) : usersService.listRecentPlayers();
    void load
      .then((rows) => {
        if (cancelled) return;
        setSuggestedPlayers(rows.slice(0, 16).map(playerToCard));
      })
      .catch(() => {
        if (!cancelled) setSuggestedPlayers([]);
      })
      .finally(() => {
        if (!cancelled) setPlayersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [playerQuery]);

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
    try {
      await toggle(targetType, targetId, targetLabel);
    } catch (e) {
      Alert.alert(
        t('supporter.suivis.errorTitle'),
        e instanceof Error ? e.message : t('supporter.suivis.errorBody')
      );
    }
  };

  const filteredTournaments = useMemo(() => {
    const ctx = buildFollowContext(follows);
    let rows = tournaments;
    if (filters.scope === 'follows') {
      rows = rows.filter((tournament) => ctx.tournamentIds.has(tournament.id));
    }
    return filterTournamentsBySearch(rows, cityQuery, dateFilter).slice(0, 12);
  }, [tournaments, cityQuery, dateFilter, filters.scope, follows]);

  const discoverPlayers = useMemo(
    () => suggestedPlayers.filter((p) => !isFollowing('player', p.id)),
    [suggestedPlayers, isFollowing]
  );

  const DATE_FILTERS: { id: TournamentDateFilter; labelKey: string }[] = [
    { id: 'all', labelKey: 'supporter.suivis.date.all' },
    { id: 'week', labelKey: 'supporter.suivis.date.week' },
    { id: 'month', labelKey: 'supporter.suivis.date.month' },
  ];

  const segments: { id: SegmentId; label: string; count: number }[] = [
    { id: 'players', label: t('supporter.suivis.tab.players'), count: followedPlayers.length },
    { id: 'clubs', label: t('supporter.suivis.tab.clubs'), count: followedClubs.length },
    {
      id: 'tournaments',
      label: t('supporter.suivis.tab.tournaments'),
      count: followedTournaments.length,
    },
  ];

  const renderFollowBtn = (
    type: FollowTargetType,
    id: string,
    label: string
  ) => {
    const key = `${type}:${id}`;
    const active = isFollowing(type, id);
    const busy = pendingKey === key;
    return (
      <PressableSpring
        onPress={() => void toggleFollow(type, id, label)}
        disabled={busy}
        scaleTo={0.96}
        haptic
        style={[styles.followBtn, active && styles.followBtnOn]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={SUPPORTER_SITE.accent} />
        ) : (
          <ProDayText variant="caption" style={[styles.followBtnText, active && styles.followBtnTextOn]}>
            {active
              ? t('supporter.match.action.following')
              : t('supporter.match.action.follow')}
          </ProDayText>
        )}
      </PressableSpring>
    );
  };

  const renderPlayerRow = (player: PlayerCard, opts?: { openable?: boolean }) => (
    <View key={`player:${player.id}`} style={styles.row}>
      <PressableSpring
        onPress={
          opts?.openable
            ? () => setSelectedPlayerId(player.id)
            : undefined
        }
        disabled={!opts?.openable}
        scaleTo={0.98}
        style={styles.rowMain}
      >
        {player.avatarUrl ? (
          <Image source={{ uri: player.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <ProDayText variant="section" style={styles.avatarLetter}>
              {player.name.charAt(0).toUpperCase()}
            </ProDayText>
          </View>
        )}
        <View style={styles.copy}>
          <View style={styles.nameRow}>
            <ProDayText variant="section" style={styles.name} numberOfLines={1}>
              {player.name}
            </ProDayText>
            {player.verified ? (
              <Icon name="checkmark-circle" size={14} color={SUPPORTER_SITE.accent} />
            ) : null}
          </View>
          {player.meta ? (
            <ProDayText variant="caption" style={styles.meta} numberOfLines={2}>
              {player.meta}
            </ProDayText>
          ) : null}
        </View>
        {opts?.openable ? (
          <Icon name="chevron-forward" size={16} color={SUPPORTER_SITE.muted} />
        ) : null}
      </PressableSpring>
      {renderFollowBtn('player', player.id, player.name)}
    </View>
  );

  const renderSimpleRow = (
    type: FollowTargetType,
    id: string,
    title: string,
    subtitle?: string
  ) => (
    <View key={`${type}:${id}`} style={styles.row}>
      <View style={styles.simpleIcon}>
        <Icon
          name={type === 'club' ? 'shield' : 'trophy'}
          size={18}
          color={SUPPORTER_SITE.accent}
        />
      </View>
      <View style={styles.copy}>
        <ProDayText variant="section" style={styles.name} numberOfLines={1}>
          {title}
        </ProDayText>
        {subtitle ? (
          <ProDayText variant="caption" style={styles.meta}>
            {subtitle}
          </ProDayText>
        ) : null}
      </View>
      {renderFollowBtn(type, id, title)}
    </View>
  );

  return (
    <>
      <SupporterPageFrame identity={getSupporterPageIdentity('suivis')} badge="Illimité">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summary}>
            <ProDayText variant="caption" style={styles.summaryText}>
              {t('supporter.suivis.summary', {
                clubs: String(followedClubs.length),
                players: String(followedPlayers.length),
                tournaments: String(followedTournaments.length),
              })}
            </ProDayText>
            <ProDayText variant="caption" style={styles.summaryAccent}>
              {t('supporter.suivis.freeUnlimited')}
            </ProDayText>
          </View>

          <View style={styles.segments}>
            {segments.map((item) => {
              const on = segment === item.id;
              return (
                <PressableSpring
                  key={item.id}
                  onPress={() => setSegment(item.id)}
                  scaleTo={0.97}
                  style={[styles.segment, on && styles.segmentOn]}
                >
                  <ProDayText
                    variant="caption"
                    style={[styles.segmentText, on && styles.segmentTextOn]}
                  >
                    {item.label}
                    {item.count > 0 ? ` · ${item.count}` : ''}
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>

          {followsLoading ? (
            <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginVertical: spacing.lg }} />
          ) : null}

          {segment === 'players' ? (
            <View style={styles.block}>
              <ProDayText variant="caption" style={styles.sectionKicker}>
                {t('supporter.suivis.myPlayers')}
              </ProDayText>
              {followedPlayers.length === 0 ? (
                <View style={styles.empty}>
                  <Icon name="people" size={28} color={SUPPORTER_SITE.accent} />
                  <ProDayText variant="section" style={styles.emptyTitle}>
                    {t('supporter.suivis.emptyPlayersTitle')}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.emptyBody}>
                    {t('supporter.suivis.emptyPlayersBody')}
                  </ProDayText>
                </View>
              ) : (
                followedPlayers.map((follow) => {
                  const [name, ...rest] = (follow.target_label ?? follow.target_id).split(' · ');
                  return renderPlayerRow(
                    {
                      id: follow.target_id,
                      name,
                      meta: rest.length ? rest.join(' · ') : t('supporter.followType.player'),
                    },
                    { openable: true }
                  );
                })
              )}

              <ProDayText variant="caption" style={[styles.sectionKicker, styles.sectionGap]}>
                {playerQuery.trim().length >= 2
                  ? t('supporter.suivis.searchPlayers')
                  : t('supporter.suivis.suggestedPlayers')}
              </ProDayText>
              <TextInput
                value={playerQuery}
                onChangeText={setPlayerQuery}
                placeholder={t('supporter.suivis.playerPlaceholder')}
                placeholderTextColor={SUPPORTER_SITE.muted}
                style={styles.input}
              />
              {playersLoading ? (
                <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginTop: spacing.md }} />
              ) : discoverPlayers.length > 0 ? (
                discoverPlayers.map((player) => renderPlayerRow(player, { openable: true }))
              ) : (
                <View style={styles.emptySoft}>
                  <ProDayText variant="caption" style={styles.meta}>
                    {t('supporter.suivis.noPlayers')}
                  </ProDayText>
                </View>
              )}
            </View>
          ) : null}

          {segment === 'clubs' ? (
            <View style={styles.block}>
              <ProDayText variant="caption" style={styles.sectionKicker}>
                {t('supporter.suivis.myClubs')}
              </ProDayText>
              {followedClubs.length === 0 ? (
                <View style={styles.emptySoft}>
                  <ProDayText variant="caption" style={styles.meta}>
                    {t('supporter.suivis.emptyClubs')}
                  </ProDayText>
                </View>
              ) : (
                followedClubs.map((follow) =>
                  renderSimpleRow(
                    'club',
                    follow.target_id,
                    follow.target_label ?? follow.target_id,
                    t('supporter.followType.club')
                  )
                )
              )}

              <ProDayText variant="caption" style={[styles.sectionKicker, styles.sectionGap]}>
                {clubQuery.trim().length >= 2
                  ? t('supporter.suivis.searchClubs')
                  : t('supporter.suivis.suggestedClubs')}
              </ProDayText>
              <TextInput
                value={clubQuery}
                onChangeText={setClubQuery}
                placeholder={t('supporter.suivis.clubPlaceholder')}
                placeholderTextColor={SUPPORTER_SITE.muted}
                style={styles.input}
              />
              {clubs
                .filter((club) => !isFollowing('club', club.id))
                .slice(0, 8)
                .map((club) => renderSimpleRow('club', club.id, club.name, club.city))}
            </View>
          ) : null}

          {segment === 'tournaments' ? (
            <View style={styles.block}>
              <ProDayText variant="caption" style={styles.sectionKicker}>
                {t('supporter.suivis.myTournaments')}
              </ProDayText>
              {followedTournaments.length === 0 ? (
                <View style={styles.emptySoft}>
                  <ProDayText variant="caption" style={styles.meta}>
                    {t('supporter.empty.tournaments')}
                  </ProDayText>
                </View>
              ) : (
                followedTournaments.map((follow) =>
                  renderSimpleRow(
                    'tournament',
                    follow.target_id,
                    follow.target_label ?? follow.target_id,
                    t('supporter.followType.tournament')
                  )
                )
              )}

              <ProDayText variant="caption" style={[styles.sectionKicker, styles.sectionGap]}>
                {t('supporter.suivis.tournamentSearch')}
              </ProDayText>
              <SupporterFilterBar filters={filters} onChange={handleFiltersChange} />
              <TextInput
                value={cityQuery}
                onChangeText={setCityQuery}
                placeholder={t('supporter.suivis.cityPlaceholder')}
                placeholderTextColor={SUPPORTER_SITE.muted}
                style={styles.input}
              />
              <View style={styles.dateChips}>
                {DATE_FILTERS.map((entry) => {
                  const active = entry.id === dateFilter;
                  return (
                    <PressableSpring
                      key={entry.id}
                      onPress={() => setDateFilter(entry.id)}
                      style={[styles.dateChip, active && styles.dateChipOn]}
                    >
                      <ProDayText
                        variant="caption"
                        style={[styles.dateChipText, active && styles.dateChipTextOn]}
                      >
                        {t(entry.labelKey)}
                      </ProDayText>
                    </PressableSpring>
                  );
                })}
              </View>
              {filteredTournaments
                .filter((tournament) => !isFollowing('tournament', tournament.id))
                .map((tournament) =>
                  renderSimpleRow('tournament', tournament.id, tournament.title, tournament.city)
                )}
            </View>
          ) : null}
        </ScrollView>
      </SupporterPageFrame>

      <PushScreenTransition active={Boolean(selectedPlayerId && selectedPlayer)}>
        {selectedPlayerId && selectedPlayer ? (
          <PlayerProfileScreen
            player={selectedPlayer}
            onBack={() => setSelectedPlayerId(null)}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    gap: spacing.md,
  },
  summary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    borderLeftWidth: 2,
    borderLeftColor: SUPPORTER_SITE.accent,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  summaryText: { color: SUPPORTER_SITE.foreground, fontWeight: '700' },
  summaryAccent: { color: SUPPORTER_SITE.accent, fontWeight: '700' },
  segments: { flexDirection: 'row', gap: 6 },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  segmentOn: {
    borderColor: SUPPORTER_SITE.accent,
    backgroundColor: SUPPORTER_SITE.soft,
  },
  segmentText: {
    color: SUPPORTER_SITE.muted,
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
  segmentTextOn: { color: SUPPORTER_SITE.foreground },
  block: { gap: spacing.sm },
  sectionKicker: {
    color: SUPPORTER_SITE.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 10,
    fontWeight: '800',
  },
  sectionGap: { marginTop: spacing.md },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: SUPPORTER_SITE.foreground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.sm,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SUPPORTER_SITE.soft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
  },
  avatarLetter: { color: SUPPORTER_SITE.accent, fontWeight: '800' },
  simpleIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SUPPORTER_SITE.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: SUPPORTER_SITE.foreground, fontWeight: '800', flexShrink: 1 },
  meta: { color: SUPPORTER_SITE.muted, lineHeight: 16 },
  followBtn: {
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  followBtnOn: {
    borderColor: SUPPORTER_SITE.accent,
    backgroundColor: SUPPORTER_SITE.soft,
  },
  followBtnText: { color: SUPPORTER_SITE.muted, fontWeight: '800', fontSize: 11 },
  followBtnTextOn: { color: SUPPORTER_SITE.accent },
  empty: {
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    borderLeftWidth: 2,
    borderLeftColor: SUPPORTER_SITE.accent,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  emptyTitle: { color: SUPPORTER_SITE.foreground, fontWeight: '800' },
  emptyBody: { color: SUPPORTER_SITE.muted, lineHeight: 18 },
  emptySoft: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  dateChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dateChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  dateChipOn: {
    borderColor: SUPPORTER_SITE.accent,
    backgroundColor: SUPPORTER_SITE.accent,
  },
  dateChipText: { color: SUPPORTER_SITE.muted, fontWeight: '700' },
  dateChipTextOn: { color: '#fff' },
});
