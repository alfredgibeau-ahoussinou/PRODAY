import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import type { User } from '../../models/User';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { createCompetitionScreenStyles } from '../../components/competition/competitionScreenStyles';
import {
  generateFullTournamentPlan,
  type TournamentFormat,
} from '../../utils/tournamentScheduler';
import { generateClubTournamentPlan } from '../../utils/clubTournamentGenerator';
import { clubTournamentsService } from '../../services/clubTournaments.service';

interface Props {
  profile: User;
  onBack: () => void;
  onCreated: (tournamentId: string) => void;
}

const FORMAT_OPTIONS: { key: TournamentFormat; label: string }[] = [
  { key: 'pools_then_knockout', label: 'Poules + Finale' },
  { key: 'pools_only', label: 'Poules uniquement' },
  { key: 'direct_elimination', label: 'Élimination directe' },
  { key: 'round_robin', label: 'Championnat' },
];

export const TournamentCreateScreen: React.FC<Props> = ({
  profile,
  onBack,
  onCreated,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createCompetitionScreenStyles(c), [c]);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('U13');
  const [teamCount, setTeamCount] = useState('8');
  const [pitchCount, setPitchCount] = useState('2');
  const [matchDuration, setMatchDuration] = useState('12');
  const [breakDuration, setBreakDuration] = useState('3');
  const [format, setFormat] = useState<TournamentFormat>('pools_then_knockout');
  const [startTime, setStartTime] = useState('09:00');
  const [teamNames, setTeamNames] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const publish = async () => {
    if (!name.trim()) {
      Alert.alert('Champs requis', 'Indiquez le nom du tournoi.');
      return;
    }
    const tc = parseInt(teamCount, 10);
    if (isNaN(tc) || tc < 2) {
      Alert.alert('Équipes', 'Au moins 2 équipes requises.');
      return;
    }

    setSubmitting(true);
    try {
      const [h, m] = startTime.split(':').map(Number);
      const startsAt = new Date();
      startsAt.setHours(h || 9, m || 0, 0, 0);
      startsAt.setDate(startsAt.getDate() + 7);

      const endsAt = new Date(startsAt);
      endsAt.setHours(23, 0, 0, 0);

      const names = teamNames
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const plan = generateClubTournamentPlan({
        name: name.trim(),
        category: category.trim(),
        teamCount: tc,
        pitchCount: parseInt(pitchCount, 10) || 2,
        matchDurationMin: parseInt(matchDuration, 10) || 12,
        breakBetweenMin: parseInt(breakDuration, 10) || 3,
        poolCount: Math.max(1, Math.ceil(tc / 4)),
        format: format === 'direct_elimination' ? 'pools_then_knockout' : format,
        startsAt,
        endsAt,
        teamNames: names.length >= tc ? names : undefined,
      });

      const event = await clubTournamentsService.createFromPlan({
        club_id: profile.profile.club_id ?? profile.uid,
        created_by: profile.uid,
        plan,
      });

      onCreated(event.id);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldRow = (label: string, value: string, onChange: (v: string) => void, placeholder: string, keyboard?: 'numeric') => (
    <>
      <ProDayText variant="caption" muted style={styles.label}>
        {label}
      </ProDayText>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        keyboardType={keyboard === 'numeric' ? 'number-pad' : 'default'}
      />
    </>
  );

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label="Tournoi"
        title="Nouveau tournoi"
        subtitle="Configurez le format, les terrains et le planning sera généré automatiquement."
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {fieldRow('Nom du tournoi', name, setName, 'Tournoi de printemps U13')}
        {fieldRow('Ville / Lieu', city, setCity, 'Complexe Jean Moulin, Paris')}
        {fieldRow('Catégorie', category, setCategory, 'U13, Senior…')}
        {fieldRow("Nombre d'équipes", teamCount, setTeamCount, '8', 'numeric')}
        {fieldRow('Terrains disponibles', pitchCount, setPitchCount, '2', 'numeric')}
        {fieldRow('Durée match (min)', matchDuration, setMatchDuration, '12', 'numeric')}
        {fieldRow('Pause entre matchs (min)', breakDuration, setBreakDuration, '3', 'numeric')}
        {fieldRow('Heure de début', startTime, setStartTime, '09:00')}

        <ProDayText variant="caption" muted style={styles.label}>
          Format
        </ProDayText>
        <View style={styles.modeRow}>
          {FORMAT_OPTIONS.map(({ key, label }) => {
            const on = format === key;
            return (
              <PressableSpring
                key={key}
                onPress={() => setFormat(key)}
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
                  inverse={on}
                  style={{ fontWeight: '700', color: on ? c.brandInverse : c.text }}
                >
                  {label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>

        <ProDayText variant="caption" muted style={styles.label}>
          Noms des équipes (optionnel, virgules)
        </ProDayText>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={teamNames}
          onChangeText={setTeamNames}
          multiline
          placeholder="FC Paris, AS Lyon, OC Marseille…"
          placeholderTextColor={c.textMuted}
        />

        <PressableSpring
          onPress={() => void publish()}
          disabled={submitting}
          scaleTo={0.98}
          haptic={!submitting}
          style={[styles.submit, styles.btnPrimary, submitting && { opacity: 0.7 }]}
        >
          {submitting ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <ProDayText variant="caption" inverse style={styles.submitText}>
              Créer le tournoi
            </ProDayText>
          )}
        </PressableSpring>
      </ScrollView>
    </View>
  );
};
