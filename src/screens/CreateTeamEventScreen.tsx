import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import type { TeamEventType } from '../models/TeamEvent';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { teamEventsService } from '../services/teamEvents.service';
import { usersService } from '../services/users.service';
import { clubsService } from '../services/clubs.service';
import { useAuth } from '../context/AuthContext';
import { parseFrenchDate } from '../utils/parseFrenchDate';
import { filterMembersByCategory, memberUidsExcluding } from '../utils/clubMembersFilter';
import { colors, spacing, radius } from '../theme/designTokens';

const EVENT_TYPES: { id: TeamEventType; label: string }[] = [
  { id: 'training', label: 'Entraînement' },
  { id: 'detection', label: 'Journée détection' },
  { id: 'meeting', label: 'Réunion' },
  { id: 'friendly', label: 'Convocation match' },
  { id: 'other', label: 'Autre' },
];

const CATEGORIES = ['U13', 'U15', 'U17', 'U19', 'Seniors', 'Vétérans'];

interface CreateTeamEventScreenProps {
  onBack: () => void;
  onCreated: (eventId: string) => void;
  defaultType?: TeamEventType;
}

export const CreateTeamEventScreen: React.FC<CreateTeamEventScreenProps> = ({
  onBack,
  onCreated,
  defaultType = 'training',
}) => {
  const { profile } = useAuth();
  const [eventType, setEventType] = useState<TeamEventType>(defaultType);
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('18:00');
  const [city, setCity] = useState(profile?.city ?? '');
  const [locationLabel, setLocationLabel] = useState('');
  const [description, setDescription] = useState('');
  const [inviteClub, setInviteClub] = useState(true);
  const [clubMembers, setClubMembers] = useState<{ uid: string; name: string }[]>([]);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [maxParticipants, setMaxParticipants] = useState('30');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (eventType === 'detection' && selectedCategories.length === 0) {
      setSelectedCategories(['Seniors']);
    }
  }, [eventType, selectedCategories.length]);

  useEffect(() => {
    const clubId = profile?.profile.club_id;
    if (!clubId) {
      setClubMembers([]);
      return;
    }
    void usersService.listMembersByClubId(clubId).then((list) => {
      const others = list
        .filter((m) => m.uid !== profile?.uid)
        .map((m) => ({ uid: m.uid, name: m.display_name }));
      setClubMembers(others);
      if (!inviteClub) setSelectedUids(others.map((m) => m.uid));
    });
  }, [profile?.profile.club_id, profile?.uid, inviteClub]);

  useEffect(() => {
    if (eventType === 'detection' && !title) {
      setTitle('Journée détection ProDay');
    }
  }, [eventType, title]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async () => {
    if (!profile) return;
    if (!title.trim() || !city.trim()) {
      Alert.alert('Champs requis', 'Titre et ville obligatoires.');
      return;
    }
    const parsed = parseFrenchDate(dateStr);
    if (!parsed) {
      Alert.alert('Date invalide', 'Utilisez le format JJ/MM/AAAA.');
      return;
    }
    const [h, min] = timeStr.split(':').map((x) => parseInt(x, 10));
    parsed.setHours(Number.isFinite(h) ? h : 18, Number.isFinite(min) ? min : 0, 0, 0);

    setSubmitting(true);
    try {
      const clubId = profile.profile.club_id;
      let clubName: string | undefined;
      let inviteeUids: string[] = [];

      if (clubId) {
        const club = await clubsService.getById(clubId);
        clubName = club?.name;
        if (inviteClub) {
          const members = await usersService.listMembersByClubId(clubId);
          const filtered =
            selectedCategories.length > 0
              ? filterMembersByCategory(members, selectedCategories)
              : members;
          inviteeUids = memberUidsExcluding(filtered, profile.uid);
        } else if (selectedUids.length > 0) {
          inviteeUids = selectedUids.filter((uid) => uid !== profile.uid);
        }
      }

      const id = await teamEventsService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        event_type: eventType,
        organizer_uid: profile.uid,
        organizer_name: profile.display_name,
        club_id: clubId,
        club_name: clubName,
        starts_at: parsed,
        city: city.trim(),
        location_label: locationLabel.trim() || undefined,
        invitee_uids: inviteeUids,
        max_participants:
          eventType === 'detection' ? parseInt(maxParticipants, 10) || undefined : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        reminder_hours_before: 24,
      });

      Alert.alert(
        'Événement créé',
        inviteeUids.length > 0
          ? `${inviteeUids.length} personne(s) convoquée(s).`
          : 'Partagez l’événement à votre effectif.'
      );
      onCreated(id);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Nouvel événement" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {EVENT_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeChip, eventType === t.id && styles.typeChipActive]}
              onPress={() => setEventType(t.id)}
            >
              <Text
                style={[styles.typeText, eventType === t.id && styles.typeTextActive]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Titre"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Date (JJ/MM/AAAA)"
          placeholderTextColor={colors.textMuted}
          value={dateStr}
          onChangeText={setDateStr}
        />
        <TextInput
          style={styles.input}
          placeholder="Heure (14:00)"
          placeholderTextColor={colors.textMuted}
          value={timeStr}
          onChangeText={setTimeStr}
        />
        <TextInput
          style={styles.input}
          placeholder="Ville"
          placeholderTextColor={colors.textMuted}
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={styles.input}
          placeholder="Lieu (stade, adresse…)"
          placeholderTextColor={colors.textMuted}
          value={locationLabel}
          onChangeText={setLocationLabel}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Description (optionnel)"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {eventType === 'detection' && (
          <>
            <Text style={styles.label}>Catégories</Text>
            <View style={styles.typeRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.typeChip,
                    selectedCategories.includes(cat) && styles.typeChipActive,
                  ]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text
                    style={[
                      styles.typeText,
                      selectedCategories.includes(cat) && styles.typeTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Places max"
              placeholderTextColor={colors.textMuted}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="number-pad"
            />
          </>
        )}

        {profile?.profile.club_id && eventType !== 'detection' ? (
          <>
            <Text style={styles.label}>Catégories convoquées (optionnel)</Text>
            <Text style={styles.hint}>
              Si vous sélectionnez des catégories, seuls les joueurs correspondants seront
              convoqués lorsque « Convoquer tout le club » est activé.
            </Text>
            <View style={styles.typeRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.typeChip,
                    selectedCategories.includes(cat) && styles.typeChipActive,
                  ]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text
                    style={[
                      styles.typeText,
                      selectedCategories.includes(cat) && styles.typeTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {profile?.profile.club_id ? (
          <>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Convoquer tout le club</Text>
              <Switch
                value={inviteClub}
                onValueChange={(v) => {
                  setInviteClub(v);
                  if (!v) setSelectedUids(clubMembers.map((m) => m.uid));
                }}
              />
            </View>
            {!inviteClub && clubMembers.length > 0 ? (
              <>
                <Text style={styles.label}>Joueurs convoqués</Text>
                <View style={styles.memberList}>
                  {clubMembers.map((m) => {
                    const on = selectedUids.includes(m.uid);
                    return (
                      <TouchableOpacity
                        key={m.uid}
                        style={[styles.memberChip, on && styles.memberChipOn]}
                        onPress={() =>
                          setSelectedUids((prev) =>
                            on ? prev.filter((id) => id !== m.uid) : [...prev, m.uid]
                          )
                        }
                      >
                        <Text style={[styles.memberChipText, on && styles.memberChipTextOn]}>
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}
          </>
        ) : (
          <Text style={styles.hint}>
            Liez un club à votre profil pour convoquer automatiquement l&apos;effectif.
          </Text>
        )}

        <TouchableOpacity
          style={[styles.submit, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.brandInverse} />
          ) : (
            <Text style={styles.submitText}>Créer et convoquer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  typeChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  typeText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  typeTextActive: { color: colors.brandInverse },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  switchLabel: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
  memberList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  memberChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  memberChipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  memberChipText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  memberChipTextOn: { color: colors.brandInverse },
  submit: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.brandInverse, fontWeight: '900', fontSize: 16 },
});
