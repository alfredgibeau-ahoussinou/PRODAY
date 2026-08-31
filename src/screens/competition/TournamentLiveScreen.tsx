import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { PressableSpring } from '../../components/motion';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { createCompetitionScreenStyles } from '../../components/competition/competitionScreenStyles';
import { clubTournamentsService } from '../../services/clubTournaments.service';
import {
  computePoolTable,
  type ClubTournamentEvent,
  type ClubTournamentLiveFixture,
} from '../../models/ClubTournamentEvent';
import { reschedule } from '../../utils/tournamentScheduler';

interface Props {
  tournamentId: string;
  isOrganizer: boolean;
  onBack: () => void;
}

type Tab = 'planning' | 'standings' | 'bracket';

export const TournamentLiveScreen: React.FC<Props> = ({
  tournamentId,
  isOrganizer,
  onBack,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createCompetitionScreenStyles(c), [c]);
  const [event, setEvent] = useState<ClubTournamentEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('planning');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvent(await clubTournamentsService.getById(tournamentId));
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitScore = async (
    fixtureId: string,
    homeScore: number,
    awayScore: number,
  ) => {
    if (!event) return;
    const updated = event.fixtures.map((f) =>
      f.id === fixtureId
        ? { ...f, home_score: homeScore, away_score: awayScore, status: 'done' as const }
        : f,
    );
    await clubTournamentsService.updateFixtures(event.id, updated);
    setEvent({ ...event, fixtures: updated, updated_at: new Date() });
  };

  const applyDelay = async (fixtureId: string, delayMin: number) => {
    if (!event) return;
    const result = reschedule(event.fixtures, fixtureId, delayMin);
    const updated = result.updated as ClubTournamentLiveFixture[];
    await clubTournamentsService.updateFixtures(event.id, updated);
    setEvent({ ...event, fixtures: updated, updated_at: new Date() });
    Alert.alert('Planning mis à jour', result.summary);
  };

  if (loading) {
    return (
      <View style={[styles.root, rootStyle, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={c.brand} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader label="Tournoi" title="Introuvable" onBack={onBack} />
      </View>
    );
  }

  const poolFixtures = event.fixtures.filter((f) => f.phase === 'pool');
  const knockoutFixtures = event.fixtures.filter((f) => f.phase === 'knockout');
  const poolIds = [...new Set(poolFixtures.map((f) => f.poolId).filter(Boolean))] as string[];

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label="Tournoi live"
        title={event.name}
        subtitle={`${event.teams.length} équipes · ${event.fixtures.length} matchs`}
        onBack={onBack}
      />

      <View style={styles.modeRow}>
        {(['planning', 'standings', 'bracket'] as const).map((t) => {
          const on = tab === t;
          const labels: Record<Tab, string> = {
            planning: 'Planning',
            standings: 'Classement',
            bracket: 'Bracket',
          };
          return (
            <PressableSpring
              key={t}
              onPress={() => setTab(t)}
              scaleTo={0.96}
              style={[
                styles.modeChip,
                {
                  backgroundColor: on ? c.brand : c.surface,
                  borderColor: on ? c.brand : c.border,
                },
              ]}
            >
              <ProDayText
                variant="caption"
                style={{ fontWeight: '700', color: on ? c.brandInverse : c.text }}
              >
                {labels[t]}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {tab === 'planning' && (
          <PlanningTab
            fixtures={event.fixtures}
            isOrganizer={isOrganizer}
            onSubmitScore={submitScore}
            onDelay={applyDelay}
            styles={styles}
            colors={c}
          />
        )}
        {tab === 'standings' && (
          <StandingsTab
            fixtures={event.fixtures}
            poolIds={poolIds}
            pools={event.pools}
            styles={styles}
            colors={c}
          />
        )}
        {tab === 'bracket' && (
          <BracketTab
            fixtures={knockoutFixtures}
            styles={styles}
            colors={c}
          />
        )}
      </ScrollView>
    </View>
  );
};

// ── Planning Tab ────────────────────────────────────────────────────

function PlanningTab({
  fixtures,
  isOrganizer,
  onSubmitScore,
  onDelay,
  styles,
  colors: c,
}: {
  fixtures: ClubTournamentLiveFixture[];
  isOrganizer: boolean;
  onSubmitScore: (id: string, h: number, a: number) => Promise<void>;
  onDelay: (id: string, min: number) => Promise<void>;
  styles: ReturnType<typeof createCompetitionScreenStyles>;
  colors: any;
}) {
  const pitches = [...new Set(fixtures.map((f) => f.pitchIndex))].sort();

  return (
    <>
      {pitches.map((pitch) => (
        <View key={pitch} style={{ marginBottom: 16 }}>
          <ProDayText variant="section" style={styles.sectionTitle}>
            Terrain {pitch}
          </ProDayText>
          {fixtures
            .filter((f) => f.pitchIndex === pitch)
            .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
            .map((f) => (
              <FixtureRow
                key={f.id}
                fixture={f}
                isOrganizer={isOrganizer}
                onSubmitScore={onSubmitScore}
                onDelay={onDelay}
                styles={styles}
                colors={c}
              />
            ))}
        </View>
      ))}
    </>
  );
}

function FixtureRow({
  fixture: f,
  isOrganizer,
  onSubmitScore,
  onDelay,
  styles,
  colors: c,
}: {
  fixture: ClubTournamentLiveFixture;
  isOrganizer: boolean;
  onSubmitScore: (id: string, h: number, a: number) => Promise<void>;
  onDelay: (id: string, min: number) => Promise<void>;
  styles: ReturnType<typeof createCompetitionScreenStyles>;
  colors: any;
}) {
  const [homeS, setHomeS] = useState(f.home_score?.toString() ?? '');
  const [awayS, setAwayS] = useState(f.away_score?.toString() ?? '');
  const time = f.startsAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const save = async () => {
    const h = parseInt(homeS, 10);
    const a = parseInt(awayS, 10);
    if (isNaN(h) || isNaN(a)) return;
    await onSubmitScore(f.id, h, a);
  };

  return (
    <View style={[styles.card, { marginTop: 8 }]}>
      <ProDayText variant="caption" muted>
        {time} · {f.roundLabel} · {f.status === 'done' ? 'Terminé' : f.status === 'live' ? 'En cours' : 'À venir'}
      </ProDayText>
      <View style={styles.scoreRow}>
        <ProDayText variant="body" style={styles.bodyStrong}>
          {f.homeName}
        </ProDayText>
        {isOrganizer && f.status !== 'done' ? (
          <>
            <TextInput
              style={styles.scoreInput}
              value={homeS}
              onChangeText={setHomeS}
              keyboardType="number-pad"
              maxLength={2}
            />
            <ProDayText variant="body">-</ProDayText>
            <TextInput
              style={styles.scoreInput}
              value={awayS}
              onChangeText={setAwayS}
              keyboardType="number-pad"
              maxLength={2}
            />
          </>
        ) : (
          <ProDayText variant="title" style={styles.titleText}>
            {f.home_score ?? '-'} - {f.away_score ?? '-'}
          </ProDayText>
        )}
        <ProDayText variant="body" style={styles.bodyStrong}>
          {f.awayName}
        </ProDayText>
      </View>
      {isOrganizer && f.status !== 'done' && (
        <View style={styles.btnRow}>
          <PressableSpring
            onPress={() => void save()}
            scaleTo={0.96}
            style={[styles.btn, styles.btnPrimary, styles.btnFlex]}
          >
            <ProDayText variant="caption" inverse style={{ fontWeight: '700' }}>
              Valider score
            </ProDayText>
          </PressableSpring>
          <PressableSpring
            onPress={() =>
              Alert.prompt?.('Retard (minutes)', '', (v) => {
                const d = parseInt(v, 10);
                if (!isNaN(d) && d > 0) void onDelay(f.id, d);
              }) ??
              Alert.alert('Retard', 'Utilisez le formulaire de décalage.')
            }
            scaleTo={0.96}
            style={[styles.btn, styles.btnGhost, styles.btnFlex]}
          >
            <ProDayText variant="caption" style={{ fontWeight: '700' }}>
              Signaler retard
            </ProDayText>
          </PressableSpring>
        </View>
      )}
    </View>
  );
}

// ── Standings Tab ───────────────────────────────────────────────────

function StandingsTab({
  fixtures,
  poolIds,
  pools,
  styles,
  colors: c,
}: {
  fixtures: ClubTournamentLiveFixture[];
  poolIds: string[];
  pools: { id: string; name: string; teamIds: string[] }[];
  styles: ReturnType<typeof createCompetitionScreenStyles>;
  colors: any;
}) {
  return (
    <>
      {poolIds.map((pid) => {
        const pool = pools.find((p) => p.id === pid);
        const table = computePoolTable(fixtures, pid);
        return (
          <View key={pid} style={{ marginBottom: 16 }}>
            <ProDayText variant="section" style={styles.sectionTitle}>
              {pool?.name ?? pid}
            </ProDayText>
            <View style={styles.tableHeader}>
              <ProDayText variant="caption" muted style={styles.cellRank}>#</ProDayText>
              <ProDayText variant="caption" muted style={styles.cellTeam}>Équipe</ProDayText>
              <ProDayText variant="caption" muted style={styles.cellNum}>J</ProDayText>
              <ProDayText variant="caption" muted style={styles.cellNum}>Pts</ProDayText>
              <ProDayText variant="caption" muted style={styles.cellNum}>+/-</ProDayText>
            </View>
            {table.map((row, i) => (
              <View key={row.teamId} style={styles.tableRow}>
                <ProDayText variant="caption" style={styles.cellRank}>{i + 1}</ProDayText>
                <ProDayText variant="caption" style={styles.cellTeam}>{row.name}</ProDayText>
                <ProDayText variant="caption" style={styles.cellNum}>{row.played}</ProDayText>
                <ProDayText variant="caption" style={[styles.cellNum, { fontWeight: '800' }]}>{row.pts}</ProDayText>
                <ProDayText variant="caption" style={styles.cellNum}>{row.gf - row.ga}</ProDayText>
              </View>
            ))}
          </View>
        );
      })}
    </>
  );
}

// ── Bracket Tab ─────────────────────────────────────────────────────

function BracketTab({
  fixtures,
  styles,
  colors: c,
}: {
  fixtures: ClubTournamentLiveFixture[];
  styles: ReturnType<typeof createCompetitionScreenStyles>;
  colors: any;
}) {
  if (fixtures.length === 0) {
    return (
      <ProDayText variant="body" muted>
        La phase finale sera générée quand toutes les poules seront terminées.
      </ProDayText>
    );
  }

  const rounds = [...new Set(fixtures.map((f) => f.roundLabel))];
  return (
    <>
      {rounds.map((round) => (
        <View key={round} style={{ marginBottom: 16 }}>
          <ProDayText variant="section" style={styles.sectionTitle}>
            {round}
          </ProDayText>
          {fixtures
            .filter((f) => f.roundLabel === round)
            .map((f) => (
              <View key={f.id} style={[styles.card, { marginTop: 8 }]}>
                <View style={styles.scoreRow}>
                  <ProDayText variant="body" style={styles.bodyStrong}>
                    {f.homeName}
                  </ProDayText>
                  <ProDayText variant="title" style={styles.titleText}>
                    {f.home_score ?? '-'} - {f.away_score ?? '-'}
                  </ProDayText>
                  <ProDayText variant="body" style={styles.bodyStrong}>
                    {f.awayName}
                  </ProDayText>
                </View>
              </View>
            ))}
        </View>
      ))}
    </>
  );
}
