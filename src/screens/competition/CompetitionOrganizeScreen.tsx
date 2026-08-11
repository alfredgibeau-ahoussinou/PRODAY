import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import type { User } from '../../models/User';
import { competitionsService } from '../../services/competitions.service';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { createCompetitionScreenStyles } from '../../components/competition/competitionScreenStyles';

interface CompetitionOrganizeScreenProps {
  profile: User;
  onBack: () => void;
  onCreated: (seasonId: string) => void;
}

export const CompetitionOrganizeScreen: React.FC<CompetitionOrganizeScreenProps> = ({
  profile,
  onBack,
  onCreated,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createCompetitionScreenStyles(c), [c]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Senior');
  const [seasonLabel, setSeasonLabel] = useState('2026-2027');
  const [teamNames, setTeamNames] = useState('Équipe A, Équipe B, Équipe C, Équipe D');
  const [mode, setMode] = useState<'round_robin' | 'home_away'>('home_away');
  const [submitting, setSubmitting] = useState(false);

  const publish = async () => {
    if (!name.trim()) {
      Alert.alert('Champs requis', 'Indiquez le nom de la compétition.');
      return;
    }
    const teams = teamNames
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (teams.length < 2) {
      Alert.alert('Équipes', 'Ajoutez au moins 2 équipes (séparées par des virgules).');
      return;
    }

    setSubmitting(true);
    try {
      const competitionId = await competitionsService.createCompetition({
        name: name.trim(),
        category: category.trim() || undefined,
        season_label: seasonLabel.trim() || 'Saison',
        organizer_uids: [profile.uid],
        club_ids: profile.profile.club_id ? [profile.profile.club_id] : [],
        created_by: profile.uid,
      });
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + 7);
      const seasonId = await competitionsService.createSeason({
        competition_id: competitionId,
        label: seasonLabel.trim() || 'Saison',
        starts_at: startsAt,
        organizer_uids: [profile.uid],
      });
      for (let i = 0; i < teams.length; i += 1) {
        await competitionsService.addTeam({
          season_id: seasonId,
          club_id: profile.profile.club_id ?? `${profile.uid}_team_${i}`,
          display_name: teams[i],
        });
      }
      await competitionsService.generateSchedule(seasonId, mode);
      onCreated(seasonId);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label="Compétitions"
        title="Organiser"
        subtitle="Créez une saison, ajoutez les équipes et générez le calendrier."
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <ProDayText variant="caption" muted style={styles.label}>
          Nom
        </ProDayText>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Championnat régional U17"
          placeholderTextColor={c.textMuted}
        />

        <ProDayText variant="caption" muted style={styles.label}>
          Catégorie
        </ProDayText>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="U15, Senior…"
          placeholderTextColor={c.textMuted}
        />

        <ProDayText variant="caption" muted style={styles.label}>
          Saison
        </ProDayText>
        <TextInput
          style={styles.input}
          value={seasonLabel}
          onChangeText={setSeasonLabel}
          placeholder="2026-2027"
          placeholderTextColor={c.textMuted}
        />

        <ProDayText variant="caption" muted style={styles.label}>
          Équipes (virgules)
        </ProDayText>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={teamNames}
          onChangeText={setTeamNames}
          multiline
          placeholderTextColor={c.textMuted}
        />

        <View style={styles.modeRow}>
          {(['home_away', 'round_robin'] as const).map((m) => {
            const on = mode === m;
            return (
              <PressableSpring
                key={m}
                onPress={() => setMode(m)}
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
                  {m === 'home_away' ? 'Aller-retour' : 'Simple'}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>

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
              Créer & générer le calendrier
            </ProDayText>
          )}
        </PressableSpring>
      </ScrollView>
    </View>
  );
};
