import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import {
  generateClubTournamentPlan,
  type ClubTournamentFormat,
  type GeneratedTournamentPlan,
} from '../../utils/clubTournamentGenerator';
import { clubTournamentsService } from '../../services/clubTournaments.service';
import type { ClubTournamentEvent } from '../../models/ClubTournamentEvent';
import { ClubTournamentLiveHub } from './ClubTournamentLiveHub';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, spacing } from '../../theme/designTokens';

const FORMATS: { id: ClubTournamentFormat; label: string }[] = [
  { id: 'pools_only', label: 'Poules' },
  { id: 'pools_then_knockout', label: 'Poules + finale' },
  { id: 'round_robin', label: 'Round-robin' },
];

/** Wizard ProDay Tournament → Live Hub. */
export const ClubTournamentWizard: React.FC<{
  clubId: string;
  userId: string;
  onPlanReady?: (plan: GeneratedTournamentPlan) => void;
}> = ({ clubId, userId, onPlanReady }) => {
  const { colors } = useAppTheme();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('U13');
  const [teamCount, setTeamCount] = useState('8');
  const [pitchCount, setPitchCount] = useState('2');
  const [matchMin, setMatchMin] = useState('15');
  const [breakMin, setBreakMin] = useState('5');
  const [poolCount, setPoolCount] = useState('2');
  const [format, setFormat] = useState<ClubTournamentFormat>('pools_then_knockout');
  const [startHour, setStartHour] = useState('9');
  const [endHour, setEndHour] = useState('18');
  const [plan, setPlan] = useState<GeneratedTournamentPlan | null>(null);
  const [liveEvent, setLiveEvent] = useState<ClubTournamentEvent | null>(null);
  const [saving, setSaving] = useState(false);

  const preview = useMemo(() => plan, [plan]);

  const applyPlan = (next: GeneratedTournamentPlan) => {
    setPlan(next);
    onPlanReady?.(next);
  };

  const generate = () => {
    const today = new Date();
    const startsAt = new Date(today);
    startsAt.setHours(parseInt(startHour, 10) || 9, 0, 0, 0);
    const endsAt = new Date(today);
    endsAt.setHours(parseInt(endHour, 10) || 18, 0, 0, 0);

    const next = generateClubTournamentPlan({
      name: name.trim() || 'Tournoi club',
      category: category.trim() || 'Catégorie',
      teamCount: parseInt(teamCount, 10) || 8,
      pitchCount: parseInt(pitchCount, 10) || 1,
      matchDurationMin: parseInt(matchMin, 10) || 15,
      breakBetweenMin: parseInt(breakMin, 10) || 5,
      poolCount: parseInt(poolCount, 10) || 2,
      format,
      startsAt,
      endsAt,
    });

    if (next.warnings.length) {
      Alert.alert(
        'Proposition à confirmer',
        `${next.warnings.join('\n')}\n\nLe planning n’est pas appliqué silencieusement.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Confirmer quand même', onPress: () => applyPlan(next) },
        ],
      );
      return;
    }
    applyPlan(next);
  };

  const launchLive = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const event = await clubTournamentsService.createFromPlan({
        club_id: clubId,
        created_by: userId,
        plan,
        makePublic: true,
      });
      setLiveEvent(event);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de démarrer le live');
    } finally {
      setSaving(false);
    }
  };

  if (liveEvent) {
    return (
      <ClubTournamentLiveHub
        event={liveEvent}
        onChange={setLiveEvent}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
      <ProDayText variant="section">Organisation tournoi</ProDayText>
      <ProDayText variant="caption" muted>
        Poules, terrains, horaires, scores et classements automatiques.
      </ProDayText>

      {(
        [
          ['Nom', name, setName],
          ['Catégorie', category, setCategory],
          ['Équipes', teamCount, setTeamCount],
          ['Terrains', pitchCount, setPitchCount],
          ['Durée match (min)', matchMin, setMatchMin],
          ['Pause (min)', breakMin, setBreakMin],
          ['Poules', poolCount, setPoolCount],
          ['Début (h)', startHour, setStartHour],
          ['Fin (h)', endHour, setEndHour],
        ] as const
      ).map(([label, value, setter]) => (
        <View key={label} style={styles.field}>
          <ProDayText variant="caption" muted>
            {label}
          </ProDayText>
          <TextInput
            value={value}
            onChangeText={setter}
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholderTextColor={colors.textMuted}
            keyboardType={label.includes('Nom') || label === 'Catégorie' ? 'default' : 'number-pad'}
          />
        </View>
      ))}

      <ProDayText variant="caption" muted style={styles.label}>
        Format
      </ProDayText>
      <View style={styles.row}>
        {FORMATS.map((f) => (
          <PressableSpring
            key={f.id}
            onPress={() => setFormat(f.id)}
            scaleTo={0.96}
            style={[
              styles.chip,
              {
                borderColor: format === f.id ? colors.accent : colors.border,
                backgroundColor: format === f.id ? colors.accentSoft : colors.surfaceMuted,
              },
            ]}
          >
            <ProDayText variant="caption" accent={format === f.id}>
              {f.label}
            </ProDayText>
          </PressableSpring>
        ))}
      </View>

      <PressableSpring onPress={generate} scaleTo={0.96} haptic style={styles.cta}>
        <ProDayText variant="caption" accent style={styles.ctaText}>
          Générer poules & calendrier
        </ProDayText>
      </PressableSpring>

      {preview ? (
        <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="section">
            {preview.name} · {preview.category}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {preview.pools.length} poules · {preview.teams.length} équipes ·{' '}
            {preview.fixtures.length} matchs
          </ProDayText>
          {preview.fixtures.slice(0, 6).map((fx) => (
            <ProDayText key={fx.id} variant="caption">
              T{fx.pitchIndex} ·{' '}
              {fx.startsAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}{' '}
              {fx.homeName} — {fx.awayName}
            </ProDayText>
          ))}
          <PressableSpring
            onPress={() => void launchLive()}
            disabled={saving}
            scaleTo={0.96}
            haptic
          >
            <ProDayText variant="caption" accent style={styles.ctaText}>
              Ouvrir Live Tournament Hub + QR
            </ProDayText>
          </PressableSpring>
        </ProDaySurface>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  pad: { paddingBottom: spacing.lg, gap: spacing.xs },
  field: { gap: 4, marginTop: spacing.xs },
  label: { marginTop: spacing.sm, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  cta: { marginTop: spacing.md },
  ctaText: { fontWeight: '800' },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: 4, marginTop: spacing.md },
});
