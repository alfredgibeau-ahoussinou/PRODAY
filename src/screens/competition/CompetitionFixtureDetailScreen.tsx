import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import type { User } from '../../models/User';
import { competitionsService } from '../../services/competitions.service';
import type { CompetitionFixture } from '../../models/Competition';
import { isContestWindowOpen } from '../../utils/competitionStandings';
import { materializeFixtureTeamEvent } from '../../services/competitionMatchday.service';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { PressableSpring, SkeletonList } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { createCompetitionScreenStyles } from '../../components/competition/competitionScreenStyles';
import { competitionFixtureStatusLabel } from '../../components/competition/competitionLabels';
import { spacing } from '../../theme/designTokens';

interface CompetitionFixtureDetailScreenProps {
  fixtureId: string;
  profile: User;
  onBack: () => void;
  onOpenTeamEvent?: (eventId: string) => void;
}

export const CompetitionFixtureDetailScreen: React.FC<CompetitionFixtureDetailScreenProps> = ({
  fixtureId,
  profile,
  onBack,
  onOpenTeamEvent,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createCompetitionScreenStyles(c), [c]);
  const [fixture, setFixture] = useState<CompetitionFixture | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');

  const reload = async () => {
    setLoading(true);
    try {
      const f = await competitionsService.getFixture(fixtureId);
      setFixture(f);
      if (f) {
        setHome(f.home_score != null ? String(f.home_score) : '');
        setAway(f.away_score != null ? String(f.away_score) : '');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [fixtureId]);

  const submit = async () => {
    if (!fixture) return;
    setBusy(true);
    try {
      await competitionsService.submitResult({
        fixture_id: fixture.id,
        actor_uid: profile.uid,
        home_score: parseInt(home, 10) || 0,
        away_score: parseInt(away, 10) || 0,
      });
      await reload();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Soumission impossible');
    } finally {
      setBusy(false);
    }
  };

  const validate = async () => {
    if (!fixture) return;
    setBusy(true);
    try {
      if (fixture.status === 'scheduled' || fixture.status === 'live') {
        await competitionsService.submitResult({
          fixture_id: fixture.id,
          actor_uid: profile.uid,
          home_score: parseInt(home, 10) || 0,
          away_score: parseInt(away, 10) || 0,
        });
      }
      await competitionsService.validateResult({
        fixture_id: fixture.id,
        actor_uid: profile.uid,
      });
      await reload();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Validation impossible');
    } finally {
      setBusy(false);
    }
  };

  const contest = async () => {
    if (!fixture) return;
    setBusy(true);
    try {
      await competitionsService.contestResult({
        fixture_id: fixture.id,
        actor_uid: profile.uid,
        reason: 'Score contesté',
      });
      await reload();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Contestation impossible');
    } finally {
      setBusy(false);
    }
  };

  const materialize = async () => {
    if (!fixture) return;
    setBusy(true);
    try {
      const eventId = await materializeFixtureTeamEvent(fixture, profile);
      await reload();
      onOpenTeamEvent?.(eventId);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création convocation impossible');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !fixture) {
    return (
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader label="Compétitions" title="Match" onBack={onBack} />
        <View style={styles.body}>
          <SkeletonList count={3} variant="card" />
        </View>
      </View>
    );
  }

  if (!fixture) {
    return (
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader label="Compétitions" title="Match" onBack={onBack} />
        <View style={styles.body}>
          <ProDayText variant="body" muted>
            Match introuvable
          </ProDayText>
        </View>
      </View>
    );
  }

  const canContest = isContestWindowOpen(fixture);
  const statusLive = fixture.status === 'live' || fixture.status === 'validated';

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label={`Journée ${fixture.matchday}`}
        title={`${fixture.home_name} vs ${fixture.away_name}`}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: statusLive ? c.brandSoft : c.surfaceMuted },
            ]}
          >
            <ProDayText
              variant="caption"
              style={{
                color: statusLive ? c.brand : c.textMuted,
                fontWeight: '800',
              }}
            >
              {competitionFixtureStatusLabel(fixture.status)}
              {fixture.source === 'external' ? ' · Externe' : ''}
            </ProDayText>
          </View>
          <ProDayText variant="caption" muted>
            {fixture.kickoff_at.toLocaleString('fr-FR')}
          </ProDayText>

          {fixture.source === 'proday' ? (
            <View style={styles.scoreRow}>
              <TextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                value={home}
                onChangeText={setHome}
                placeholder="0"
                placeholderTextColor={c.textMuted}
              />
              <ProDayText variant="title" style={{ color: c.text }}>
                -
              </ProDayText>
              <TextInput
                style={styles.scoreInput}
                keyboardType="number-pad"
                value={away}
                onChangeText={setAway}
                placeholder="0"
                placeholderTextColor={c.textMuted}
              />
            </View>
          ) : (
            <ProDayText
              variant="title"
              style={{ color: c.text, textAlign: 'center', marginTop: spacing.sm }}
            >
              {fixture.home_score ?? 0} à {fixture.away_score ?? 0}
            </ProDayText>
          )}
        </View>

        {fixture.ai_summary ? (
          <View style={styles.card}>
            <ProDayText variant="section" style={styles.sectionTitle}>
              Résumé IA
            </ProDayText>
            <ProDayText variant="body">{fixture.ai_summary}</ProDayText>
          </View>
        ) : null}

        {fixture.auto_potm_name ? (
          <View style={styles.card}>
            <ProDayText variant="section" style={styles.sectionTitle}>
              Homme du match
            </ProDayText>
            <ProDayText variant="body" style={styles.bodyStrong}>
              {fixture.auto_potm_name}
            </ProDayText>
          </View>
        ) : null}

        {fixture.highlight_urls && fixture.highlight_urls.length > 0 ? (
          <View style={styles.card}>
            <ProDayText variant="section" style={styles.sectionTitle}>
              Highlights
            </ProDayText>
            <ProDayText variant="caption" muted>
              {fixture.highlight_urls.join('\n')}
            </ProDayText>
          </View>
        ) : null}

        {fixture.source === 'proday' ? (
          <View style={styles.btnRow}>
            <PressableSpring
              disabled={busy}
              onPress={() => void submit()}
              scaleTo={0.98}
              style={[styles.btn, styles.btnGhost, styles.btnFlex, busy && { opacity: 0.7 }]}
            >
              <ProDayText variant="caption" style={styles.bodyStrong}>
                Soumettre
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              disabled={busy}
              onPress={() => void validate()}
              scaleTo={0.98}
              haptic={!busy}
              style={[styles.btn, styles.btnPrimary, styles.btnFlex, busy && { opacity: 0.7 }]}
            >
              {busy ? (
                <ActivityIndicator color={c.brandInverse} />
              ) : (
                <ProDayText variant="caption" inverse style={styles.submitText}>
                  Valider
                </ProDayText>
              )}
            </PressableSpring>
          </View>
        ) : null}

        {canContest ? (
          <PressableSpring
            disabled={busy}
            onPress={() => void contest()}
            scaleTo={0.98}
            style={[styles.btn, styles.btnGhost, busy && { opacity: 0.7 }]}
          >
            <ProDayText variant="caption" style={styles.bodyStrong}>
              Contester (48h)
            </ProDayText>
          </PressableSpring>
        ) : null}

        {!fixture.team_event_id ? (
          <PressableSpring
            disabled={busy}
            onPress={() => void materialize()}
            scaleTo={0.98}
            haptic={!busy}
            style={[styles.btn, styles.btnPrimary, busy && { opacity: 0.7 }]}
          >
            <ProDayText variant="caption" inverse style={styles.submitText}>
              Créer la convocation match
            </ProDayText>
          </PressableSpring>
        ) : (
          <PressableSpring
            onPress={() => onOpenTeamEvent?.(fixture.team_event_id!)}
            scaleTo={0.98}
            haptic
            style={[styles.btn, styles.btnPrimary]}
          >
            <ProDayText variant="caption" inverse style={styles.submitText}>
              Ouvrir le Match Hub
            </ProDayText>
          </PressableSpring>
        )}

        {fixture.status === 'validated' && !fixture.ai_summary ? (
          <PressableSpring
            disabled={busy}
            onPress={() => {
              void (async () => {
                setBusy(true);
                try {
                  const { competitionExclusivesService } = await import(
                    '../../services/competitionExclusives.service'
                  );
                  await competitionExclusivesService.generateAndStoreFixtureSummary(fixture.id);
                  await reload();
                } finally {
                  setBusy(false);
                }
              })();
            }}
            scaleTo={0.98}
            style={[styles.btn, styles.btnGhost, busy && { opacity: 0.7 }]}
          >
            <ProDayText variant="caption" style={styles.bodyStrong}>
              Générer résumé IA
            </ProDayText>
          </PressableSpring>
        ) : null}
      </ScrollView>
    </View>
  );
};
