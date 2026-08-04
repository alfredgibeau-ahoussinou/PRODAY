import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { User } from '../models/User';
import { useTournament } from '../hooks/useTournaments';
import { tournamentsService } from '../services/tournaments.service';
import { usersService } from '../services/users.service';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PressableSpring, SkeletonList } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDayButton } from '../components/ui/ProDayButton';
import { Icon } from '../components/ui/Icon';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useTranslation } from '../context/LocaleContext';
import { PitchLineupView } from '../components/team/PitchLineupView';
import type { EventLineupSlot } from '../models/TeamEvent';
import * as WebBrowser from 'expo-web-browser';
import { startTournamentEntryPayment } from '../services/tournamentPayment.service';

interface TournamentDetailScreenProps {
  tournamentId: string;
  profile: User;
  onBack: () => void;
}

export const TournamentDetailScreen: React.FC<TournamentDetailScreenProps> = ({
  tournamentId,
  profile,
  onBack,
}) => {
  const { t, locale } = useTranslation();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const { tournament, loading, refresh } = useTournament(tournamentId, refreshSignal);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [scoreDraft, setScoreDraft] = useState<Record<string, { home: string; away: string }>>({});

  const clubId = profile.profile.club_id;
  const isOrganizer = tournament?.organizer_uid === profile.uid;
  const myRegistration = tournament?.registrations.find((r) => r.club_id === clubId);

  useEffect(() => {
    if (!clubId) return;
    void usersService.listMembersByClubId(clubId).then(setMembers);
  }, [clubId]);

  useEffect(() => {
    if (myRegistration) {
      setSelectedUids(myRegistration.player_uids);
    } else if (members.length > 0) {
      setSelectedUids(members.slice(0, Math.min(11, members.length)).map((m) => m.uid));
    }
  }, [myRegistration, members]);

  const togglePlayer = (uid: string) => {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const registerTeam = async () => {
    if (!tournament || !clubId) {
      Alert.alert(t('tournament.alert.clubRequired.title'), t('tournament.alert.clubRequired.body'));
      return;
    }
    if (selectedUids.length < 5) {
      Alert.alert(t('tournament.alert.roster.title'), t('tournament.alert.roster.body'));
      return;
    }
    setBusy(true);
    try {
      await tournamentsService.registerTeam({
        tournament_id: tournament.id,
        club_id: clubId,
        club_name: profile.display_name,
        captain_uid: profile.uid,
        captain_name: profile.display_name,
        player_uids: selectedUids,
        player_names: selectedUids.map(
          (uid) => members.find((m) => m.uid === uid)?.display_name ?? 'Joueur'
        ),
      });
      setRefreshSignal((n) => n + 1);
      await refresh();
      if (tournament.entry_fee_cents > 0) {
        Alert.alert(
          t('tournament.alert.registered.title'),
          'Inscription enregistrée. Réglez les frais pour finaliser.'
        );
      } else {
        Alert.alert(t('tournament.alert.registered.title'), t('tournament.alert.registered.body'));
      }
    } catch (e) {
      Alert.alert(
        t('feed.alert.error'),
        e instanceof Error ? e.message : t('tournament.alert.registerFailed')
      );
    } finally {
      setBusy(false);
    }
  };

  const payEntryFee = async () => {
    if (!tournament || !myRegistration) return;
    if (myRegistration.paid || tournament.entry_fee_cents <= 0) return;
    setBusy(true);
    try {
      const { url } = await startTournamentEntryPayment(tournament.id, myRegistration.id);
      const result = await WebBrowser.openAuthSessionAsync(url, 'proday://tournament');
      setRefreshSignal((n) => n + 1);
      await refresh();
      if (result.type === 'success') {
        Alert.alert('Paiement', 'Si le paiement est confirmé, le statut se met à jour sous peu.');
      }
    } catch (e) {
      Alert.alert(
        t('feed.alert.error'),
        e instanceof Error ? e.message : 'Paiement impossible pour le moment.'
      );
    } finally {
      setBusy(false);
    }
  };

  const generatePools = async () => {
    if (!tournament) return;
    setBusy(true);
    try {
      await tournamentsService.generatePoolsAndFixtures(tournament.id);
      setRefreshSignal((n) => n + 1);
      await refresh();
    } catch (e) {
      Alert.alert(
        t('feed.alert.error'),
        e instanceof Error ? e.message : t('tournament.alert.generateFailed')
      );
    } finally {
      setBusy(false);
    }
  };

  const submitScore = useCallback(
    async (fixtureId: string) => {
      if (!tournament) return;
      const draft = scoreDraft[fixtureId];
      if (!draft) return;
      const home = parseInt(draft.home, 10);
      const away = parseInt(draft.away, 10);
      if (Number.isNaN(home) || Number.isNaN(away)) return;
      setBusy(true);
      try {
        await tournamentsService.submitFixtureScore(tournament.id, fixtureId, home, away);
        setRefreshSignal((n) => n + 1);
        await refresh();
      } catch (e) {
        Alert.alert(
          t('feed.alert.error'),
          e instanceof Error ? e.message : t('tournament.alert.scoreFailed')
        );
      } finally {
        setBusy(false);
      }
    },
    [tournament, scoreDraft, refresh, t]
  );

  const lineupStarters: EventLineupSlot[] = selectedUids.slice(0, 11).map((uid) => ({
    uid,
    display_name: members.find((m) => m.uid === uid)?.display_name ?? 'Joueur',
    role: 'starter' as const,
  }));

  if (loading || !tournament) {
    return (
      <View style={[styles.root, rootStyle, styles.loader]}>
        <ScreenHeader title={t('tournament.detail.title')} onBack={onBack} />
        <SkeletonList count={4} variant="card" />
      </View>
    );
  }

  const fee =
    tournament.entry_fee_cents > 0
      ? `${(tournament.entry_fee_cents / 100).toFixed(0)} €`
      : t('tournament.fee.free');

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label={tournament.city}
        title={tournament.title}
        subtitle={tournament.starts_at.toLocaleDateString(locale, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <ProDayText variant="body" muted style={{ lineHeight: 22 }}>
            {tournament.description ?? t('tournament.detail.noDescription')}
          </ProDayText>
          <View style={styles.infoRow}>
            <ProDayText variant="caption" muted>
              {t('tournament.card.teams', {
                n: tournament.registrations.length,
                max: tournament.max_teams,
              })}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {fee}
            </ProDayText>
          </View>
        </View>

        {!myRegistration && tournament.status === 'open' && clubId ? (
          <View style={[styles.section, { borderColor: c.border }]}>
            <ProDayText variant="section">{t('tournament.register.title')}</ProDayText>
            <ProDayText variant="caption" muted style={styles.sectionSub}>
              {t('tournament.register.subtitle')}
            </ProDayText>

            <PitchLineupView formation="4-3-3" starters={lineupStarters} />

            <View style={styles.roster}>
              {members.map((member) => {
                const on = selectedUids.includes(member.uid);
                return (
                  <PressableSpring
                    key={member.uid}
                    onPress={() => togglePlayer(member.uid)}
                    scaleTo={0.98}
                    style={[
                      styles.rosterChip,
                      {
                        borderColor: on ? c.brand : c.border,
                        backgroundColor: on ? c.brandSoft : c.surface,
                      },
                    ]}
                  >
                    <ProDayText variant="caption" style={{ fontWeight: on ? '800' : '600' }}>
                      {member.display_name}
                    </ProDayText>
                  </PressableSpring>
                );
              })}
            </View>

            <ProDayButton
              label={t('tournament.register.cta')}
              onPress={() => void registerTeam()}
              loading={busy}
              disabled={busy}
            />
          </View>
        ) : null}

        {myRegistration ? (
          <View style={[styles.section, { borderColor: c.border }]}>
            <ProDayText variant="section">{t('tournament.myTeam.title')}</ProDayText>
            <ProDayText variant="caption" muted>
              {myRegistration.club_name} · {myRegistration.player_uids.length}{' '}
              {t('tournament.myTeam.players')}
              {tournament.entry_fee_cents > 0
                ? myRegistration.paid
                  ? ' · Payé'
                  : ' · En attente de paiement'
                : ''}
            </ProDayText>
            {tournament.entry_fee_cents > 0 && !myRegistration.paid ? (
              <ProDayButton
                label={`Payer ${fee}`}
                onPress={() => void payEntryFee()}
                loading={busy}
                disabled={busy}
                style={{ marginTop: spacing.md }}
              />
            ) : null}
          </View>
        ) : null}

        {isOrganizer && tournament.pools.length === 0 && tournament.registrations.length >= 2 ? (
          <ProDayButton
            label={t('tournament.organizer.generatePools')}
            onPress={() => void generatePools()}
            loading={busy}
            disabled={busy}
          />
        ) : null}

        {tournament.pools.map((pool) => (
          <View key={pool.id} style={[styles.section, { borderColor: c.border }]}>
            <View style={styles.sectionHead}>
              <Icon name="trophy" size={16} color={c.brand} />
              <ProDayText variant="section">{pool.name}</ProDayText>
            </View>

            {(tournament.standings[pool.id] ?? []).map((row, index) => (
              <View key={row.registration_id} style={styles.standingRow}>
                <ProDayText variant="caption" style={{ width: 20, fontWeight: '800' }}>
                  {index + 1}
                </ProDayText>
                <ProDayText variant="caption" style={{ flex: 1, fontWeight: '700' }}>
                  {row.club_name}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {row.points} pts · {row.goals_for}-{row.goals_against}
                </ProDayText>
              </View>
            ))}

            {tournament.fixtures
              .filter((f) => f.pool_id === pool.id)
              .map((fixture) => (
                <View
                  key={fixture.id}
                  style={[styles.fixtureRow, { backgroundColor: c.surfaceMuted }]}
                >
                  <ProDayText variant="caption" style={{ flex: 1, fontWeight: '700' }}>
                    {fixture.home_name}
                  </ProDayText>
                  {fixture.played ? (
                    <ProDayText variant="caption" style={{ fontWeight: '900' }}>
                      {fixture.home_score} - {fixture.away_score}
                    </ProDayText>
                  ) : isOrganizer ? (
                    <View style={styles.scoreInputs}>
                      <TextInput
                        style={[styles.scoreInput, { borderColor: c.border, color: c.text }]}
                        keyboardType="number-pad"
                        maxLength={2}
                        value={scoreDraft[fixture.id]?.home ?? ''}
                        onChangeText={(v) =>
                          setScoreDraft((prev) => ({
                            ...prev,
                            [fixture.id]: { home: v, away: prev[fixture.id]?.away ?? '' },
                          }))
                        }
                      />
                      <TextInput
                        style={[styles.scoreInput, { borderColor: c.border, color: c.text }]}
                        keyboardType="number-pad"
                        maxLength={2}
                        value={scoreDraft[fixture.id]?.away ?? ''}
                        onChangeText={(v) =>
                          setScoreDraft((prev) => ({
                            ...prev,
                            [fixture.id]: { home: prev[fixture.id]?.home ?? '', away: v },
                          }))
                        }
                      />
                      <PressableSpring
                        onPress={() => void submitScore(fixture.id)}
                        scaleTo={0.95}
                        style={[styles.scoreBtn, { backgroundColor: c.brand }]}
                      >
                        <Icon name="checkmark-circle" size={16} color={c.brandInverse} />
                      </PressableSpring>
                    </View>
                  ) : (
                    <ProDayText variant="caption" muted>
                      vs
                    </ProDayText>
                  )}
                  <ProDayText variant="caption" style={{ flex: 1, textAlign: 'right', fontWeight: '700' }}>
                    {fixture.away_name}
                  </ProDayText>
                </View>
              ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    loader: { padding: spacing.md },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    infoCard: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
    section: {
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    sectionSub: { lineHeight: 20 },
    roster: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    rosterChip: {
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    primaryBtn: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    btnText: { fontWeight: '800' },
    standingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 4,
    },
    fixtureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderRadius: radius.md,
      padding: spacing.sm,
    },
    scoreInputs: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    scoreInput: {
      width: 32,
      height: 32,
      borderWidth: 1,
      borderRadius: 8,
      textAlign: 'center',
      fontWeight: '800',
    },
    scoreBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
