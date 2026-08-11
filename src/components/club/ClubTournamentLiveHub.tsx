import React, { useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, TextInput, View } from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import {
  computePoolTable,
  publicTournamentUrl,
  type ClubTournamentEvent,
  type ClubTournamentLiveFixture,
} from '../../models/ClubTournamentEvent';
import { clubTournamentsService } from '../../services/clubTournaments.service';
import { proposeTournamentReschedule } from '../../utils/clubTournamentGenerator';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, spacing } from '../../theme/designTokens';

/** Live Tournament Hub — scores, classements, retard avec confirmation. */
export const ClubTournamentLiveHub: React.FC<{
  event: ClubTournamentEvent;
  onChange: (next: ClubTournamentEvent) => void;
}> = ({ event, onChange }) => {
  const { colors } = useAppTheme();
  const [busy, setBusy] = useState(false);

  const live = useMemo(
    () => event.fixtures.filter((f) => f.status === 'live'),
    [event.fixtures],
  );
  const nextUp = useMemo(
    () =>
      [...event.fixtures]
        .filter((f) => f.status === 'scheduled' || f.status === 'delayed')
        .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0] ?? null,
    [event.fixtures],
  );

  const persist = async (fixtures: ClubTournamentLiveFixture[]) => {
    setBusy(true);
    try {
      await clubTournamentsService.updateFixtures(event.id, fixtures);
      onChange({ ...event, fixtures, updated_at: new Date() });
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Sauvegarde impossible');
    } finally {
      setBusy(false);
    }
  };

  const setScore = async (fx: ClubTournamentLiveFixture, home: number, away: number) => {
    const fixtures = event.fixtures.map((f) =>
      f.id === fx.id
        ? { ...f, home_score: home, away_score: away, status: 'done' as const }
        : f,
    );
    await persist(fixtures);
  };

  const startMatch = async (fx: ClubTournamentLiveFixture) => {
    const fixtures = event.fixtures.map((f) =>
      f.id === fx.id ? { ...f, status: 'live' as const } : f,
    );
    await persist(fixtures);
  };

  const delayMatch = (fx: ClubTournamentLiveFixture) => {
    const delayMin = 15;
    const proposal = proposeTournamentReschedule(event.fixtures, fx.id, delayMin);
    Alert.alert('Confirmation requise', proposal.summary, [
      { text: 'Refuser', style: 'cancel' },
      {
        text: 'Appliquer +15 min',
        onPress: () => {
          const updated = proposal.updated.map((f) => {
            const base = event.fixtures.find((x) => x.id === f.id)!;
            return {
              ...base,
              startsAt: f.startsAt,
              endsAt: f.endsAt,
              status: f.id === fx.id ? ('delayed' as const) : base.status,
              delay_min: f.id === fx.id ? delayMin : base.delay_min,
            };
          });
          void persist(updated);
        },
      },
    ]);
  };

  const shareQr = async () => {
    const url = publicTournamentUrl(event.id);
    await Share.share({
      message: `Tournoi ${event.name} — résultats & classements : ${url}`,
      title: event.name,
    });
  };

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">Live · {event.name}</ProDayText>
      <ProDayText variant="caption" muted>
        {event.category} · saisie rapide scores / forfait / retard
      </ProDayText>

      <PressableSpring onPress={() => void shareQr()} scaleTo={0.96} haptic>
        <ProDayText variant="caption" accent style={styles.link}>
          Partager QR / page publique
        </ProDayText>
      </PressableSpring>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          Match en cours
        </ProDayText>
        {live.length === 0 ? (
          <ProDayText variant="caption" muted>
            Aucun match live — démarrez un match ci-dessous.
          </ProDayText>
        ) : (
          live.map((f) => (
            <ScoreRow
              key={f.id}
              fixture={f}
              busy={busy}
              onScore={(h, a) => void setScore(f, h, a)}
            />
          ))
        )}
      </ProDaySurface>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          Match suivant
        </ProDayText>
        {nextUp ? (
          <>
            <ProDayText variant="caption">
              Terrain {nextUp.pitchIndex} ·{' '}
              {nextUp.startsAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </ProDayText>
            <ProDayText variant="body">
              {nextUp.homeName} — {nextUp.awayName}
            </ProDayText>
            <View style={styles.row}>
              <PressableSpring
                onPress={() => void startMatch(nextUp)}
                disabled={busy}
                scaleTo={0.96}
                haptic
              >
                <ProDayText variant="caption" accent style={styles.link}>
                  Démarrer
                </ProDayText>
              </PressableSpring>
              <PressableSpring onPress={() => delayMatch(nextUp)} scaleTo={0.96} haptic>
                <ProDayText variant="caption" muted>
                  Retard…
                </ProDayText>
              </PressableSpring>
            </View>
          </>
        ) : (
          <ProDayText variant="caption" muted>
            Donnée indisponible — plus de match programmé.
          </ProDayText>
        )}
      </ProDaySurface>

      {event.pools.map((pool) => {
        const table = computePoolTable(event.fixtures, pool.id);
        return (
          <ProDaySurface
            key={pool.id}
            variant="module"
            style={[styles.card, { borderColor: colors.border }]}
          >
            <ProDayText variant="caption" accent style={styles.section}>
              Classement · {pool.name}
            </ProDayText>
            {table.length === 0 ? (
              <ProDayText variant="caption" muted>
                Donnée indisponible — saisissez des scores.
              </ProDayText>
            ) : (
              table.map((row, i) => (
                <ProDayText key={row.teamId} variant="caption">
                  {i + 1}. {row.name} — {row.pts} pts ({row.gf}-{row.ga})
                </ProDayText>
              ))
            )}
          </ProDaySurface>
        );
      })}

      <ProDayText variant="caption" muted style={styles.section}>
        Tous les matchs
      </ProDayText>
      {event.fixtures.map((f) => (
        <ProDaySurface
          key={f.id}
          variant="module"
          style={[styles.card, { borderColor: colors.border }]}
        >
          <ProDayText variant="caption" muted>
            T{f.pitchIndex} · {f.status} ·{' '}
            {f.startsAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </ProDayText>
          <ScoreRow fixture={f} busy={busy} onScore={(h, a) => void setScore(f, h, a)} />
          {f.status === 'scheduled' ? (
            <View style={styles.row}>
              <PressableSpring onPress={() => void startMatch(f)} scaleTo={0.96} haptic>
                <ProDayText variant="caption" accent>
                  Live
                </ProDayText>
              </PressableSpring>
              <PressableSpring
                onPress={() => void setScore(f, 3, 0)}
                scaleTo={0.96}
                haptic
              >
                <ProDayText variant="caption" muted>
                  Forfait 3-0
                </ProDayText>
              </PressableSpring>
            </View>
          ) : null}
        </ProDaySurface>
      ))}
    </View>
  );
};

const ScoreRow: React.FC<{
  fixture: ClubTournamentLiveFixture;
  busy: boolean;
  onScore: (home: number, away: number) => void;
}> = ({ fixture, busy, onScore }) => {
  const { colors } = useAppTheme();
  const [home, setHome] = useState(String(fixture.home_score ?? ''));
  const [away, setAway] = useState(String(fixture.away_score ?? ''));

  return (
    <View style={styles.scoreRow}>
      <ProDayText variant="caption" style={{ flex: 1 }} numberOfLines={1}>
        {fixture.homeName}
      </ProDayText>
      <TextInput
        value={home}
        onChangeText={setHome}
        keyboardType="number-pad"
        style={[styles.scoreInput, { borderColor: colors.border, color: colors.ink }]}
      />
      <ProDayText variant="caption">—</ProDayText>
      <TextInput
        value={away}
        onChangeText={setAway}
        keyboardType="number-pad"
        style={[styles.scoreInput, { borderColor: colors.border, color: colors.ink }]}
      />
      <ProDayText variant="caption" style={{ flex: 1 }} numberOfLines={1}>
        {fixture.awayName}
      </ProDayText>
      <PressableSpring
        onPress={() => onScore(parseInt(home, 10) || 0, parseInt(away, 10) || 0)}
        disabled={busy}
        scaleTo={0.96}
        haptic
      >
        <ProDayText variant="caption" accent>
          OK
        </ProDayText>
      </PressableSpring>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: 4 },
  section: { fontWeight: '800', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.6 },
  link: { fontWeight: '800' },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: 4 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  scoreInput: {
    width: 36,
    borderWidth: 1,
    borderRadius: radius.sm,
    textAlign: 'center',
    paddingVertical: 4,
    fontSize: 14,
  },
});
