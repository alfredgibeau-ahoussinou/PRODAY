import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { ClubTournamentWizard } from './ClubTournamentWizard';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, spacing } from '../../theme/designTokens';
import { teamEventsService } from '../../services/teamEvents.service';

export type ClubEventKind =
  | 'tournament'
  | 'match'
  | 'stage'
  | 'detection'
  | 'plateau'
  | 'club_day'
  | 'internal'
  | 'other';

const EVENT_KINDS: { id: ClubEventKind; label: string }[] = [
  { id: 'tournament', label: 'Tournoi' },
  { id: 'match', label: 'Match' },
  { id: 'stage', label: 'Stage' },
  { id: 'detection', label: 'Détection' },
  { id: 'plateau', label: 'Plateau' },
  { id: 'club_day', label: 'Journée du club' },
  { id: 'internal', label: 'Événement interne' },
  { id: 'other', label: 'Autre' },
];

type Phase = 'list' | 'pick_type' | 'form' | 'tournament';

/**
 * Organisation des événements — entrée unique pour dirigeants club.
 */
export const ClubEventOrganization: React.FC<{
  clubId: string;
  userId: string;
  organizerName?: string;
  teamId?: string | null;
}> = ({ clubId, userId, organizerName }) => {
  const { colors } = useAppTheme();
  const [phase, setPhase] = useState<Phase>('list');
  const [kind, setKind] = useState<ClubEventKind | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [category, setCategory] = useState('');
  const [teams, setTeams] = useState('');
  const [participants, setParticipants] = useState('');
  const [pitches, setPitches] = useState('');
  const [owner, setOwner] = useState('');
  const [notes, setNotes] = useState('');

  const kindLabel = useMemo(
    () => EVENT_KINDS.find((k) => k.id === kind)?.label ?? '',
    [kind],
  );

  const resetForm = () => {
    setName('');
    setDate('');
    setTime('');
    setPlace('');
    setCategory('');
    setTeams('');
    setParticipants('');
    setPitches('');
    setOwner('');
    setNotes('');
  };

  const startCreate = () => {
    resetForm();
    setKind(null);
    setPhase('pick_type');
  };

  const pickKind = (id: ClubEventKind) => {
    setKind(id);
    if (id === 'tournament') {
      setPhase('tournament');
      return;
    }
    setPhase('form');
  };

  const mapToTeamEventType = (k: ClubEventKind) => {
    switch (k) {
      case 'detection':
        return 'detection' as const;
      case 'match':
        return 'friendly' as const;
      case 'tournament':
        return 'tournament' as const;
      case 'stage':
      case 'plateau':
      case 'club_day':
      case 'internal':
      case 'other':
      default:
        return 'other' as const;
    }
  };

  const saveSimpleEvent = async () => {
    if (!name.trim()) {
      Alert.alert('Nom requis', 'Indiquez le nom de l’événement.');
      return;
    }
    if (!kind) return;
    setSaving(true);
    try {
      const day = date.trim() || new Date().toISOString().slice(0, 10);
      const hm = time.trim() || '10:00';
      const starts = new Date(`${day}T${hm.length === 5 ? hm : '10:00'}:00`);
      const ends = new Date(starts.getTime() + 2 * 60 * 60 * 1000);
      await teamEventsService.create({
        organizer_uid: userId,
        organizer_name: organizerName?.trim() || 'Dirigeant',
        club_id: clubId,
        event_type: mapToTeamEventType(kind),
        title: name.trim(),
        starts_at: starts,
        ends_at: ends,
        city: place.trim() || 'À préciser',
        location_label: place.trim() || undefined,
        invitee_uids: [],
        max_participants: participants.trim()
          ? parseInt(participants, 10) || undefined
          : undefined,
        categories: category.trim() ? [category.trim()] : undefined,
        description: [
          kindLabel ? `Type : ${kindLabel}` : '',
          teams.trim() ? `Équipes : ${teams.trim()}` : '',
          pitches.trim() ? `Terrains : ${pitches.trim()}` : '',
          owner.trim() ? `Responsable : ${owner.trim()}` : '',
          notes.trim(),
        ]
          .filter(Boolean)
          .join('\n'),
      });
      Alert.alert('Événement créé', 'Votre événement est prêt. Les détails sont enregistrés.');
      setPhase('list');
      resetForm();
      setKind(null);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible');
    } finally {
      setSaving(false);
    }
  };

  if (phase === 'tournament') {
    return (
      <View style={styles.wrap}>
        <PressableSpring onPress={() => setPhase('list')} scaleTo={0.97}>
          <ProDayText variant="caption" accent style={styles.back}>
            ← Organisation des événements
          </ProDayText>
        </PressableSpring>
        <ClubTournamentWizard clubId={clubId} userId={userId} />
      </View>
    );
  }

  if (phase === 'pick_type') {
    return (
      <View style={styles.wrap}>
        <ProDayText variant="section">Type d’événement</ProDayText>
        <ProDayText variant="caption" muted style={styles.lead}>
          Choisissez le format. Les tournois ouvrent l’organisation automatisée.
        </ProDayText>
        <View style={styles.kindGrid}>
          {EVENT_KINDS.map((k) => (
            <PressableSpring
              key={k.id}
              onPress={() => pickKind(k.id)}
              scaleTo={0.96}
              style={[styles.kindChip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
            >
              <ProDayText variant="caption">{k.label}</ProDayText>
            </PressableSpring>
          ))}
        </View>
        <PressableSpring onPress={() => setPhase('list')} scaleTo={0.97}>
          <ProDayText variant="caption" muted style={styles.back}>
            Annuler
          </ProDayText>
        </PressableSpring>
      </View>
    );
  }

  if (phase === 'form' && kind) {
    const fields: [string, string, (v: string) => void, boolean?][] = [
      ['Nom de l’événement', name, setName],
      ['Date (AAAA-MM-JJ)', date, setDate],
      ['Heure (HH:MM)', time, setTime],
      ['Lieu', place, setPlace],
      ['Catégorie / âge', category, setCategory],
      ['Nombre d’équipes', teams, setTeams, true],
      ['Nombre de participants', participants, setParticipants, true],
      ['Terrains disponibles', pitches, setPitches],
      ['Responsable de l’événement', owner, setOwner],
      ['Informations complémentaires', notes, setNotes],
    ];
    return (
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <ProDayText variant="section">Créer : {kindLabel}</ProDayText>
        <ProDayText variant="caption" muted style={styles.lead}>
          Type : {kindLabel}
        </ProDayText>
        {fields.map(([label, value, setter, numeric]) => (
          <View key={label} style={styles.field}>
            <ProDayText variant="caption" muted>
              {label}
            </ProDayText>
            <TextInput
              value={value}
              onChangeText={setter}
              keyboardType={numeric ? 'number-pad' : 'default'}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
              multiline={label.startsWith('Informations')}
            />
          </View>
        ))}
        <PressableSpring
          onPress={() => void saveSimpleEvent()}
          disabled={saving}
          scaleTo={0.97}
          haptic
          style={[styles.cta, { backgroundColor: colors.accent }]}
        >
          <ProDayText variant="caption" inverse>
            {saving ? 'Enregistrement…' : 'Créer l’événement'}
          </ProDayText>
        </PressableSpring>
        <PressableSpring onPress={() => setPhase('pick_type')} scaleTo={0.97}>
          <ProDayText variant="caption" muted style={styles.back}>
            ← Changer le type
          </ProDayText>
        </PressableSpring>
      </ScrollView>
    );
  }

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">Organisation des événements</ProDayText>
      <ProDayText variant="caption" muted style={styles.lead}>
        Créez un tournoi, un match, un stage ou une journée club. Les tournois
        génèrent poules, matchs, horaires, terrains et classements auto.
      </ProDayText>
      <PressableSpring
        onPress={startCreate}
        scaleTo={0.97}
        haptic
        style={[styles.cta, { backgroundColor: colors.accent }]}
      >
        <ProDayText variant="caption" inverse>
          + Créer un événement
        </ProDayText>
      </PressableSpring>
      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" muted>
          Tournoi : équipes, poules, matchs, scores, classement en direct, phases finales.
        </ProDayText>
      </ProDaySurface>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, paddingBottom: spacing.lg },
  lead: { marginBottom: spacing.xs },
  back: { marginTop: spacing.sm },
  kindGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  kindChip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  field: { gap: 4, marginTop: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  cta: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  card: { padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.sm },
});
