import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring, AnimatedModalShell } from '../../../components/motion';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { teamEventsService } from '../../../services/teamEvents.service';
import { friendlyMatchesService } from '../../../services/friendlyMatches.service';
import { membershipsService } from '../../../services/memberships.service';
import { teamsService } from '../../../services/teams.service';
import { teamStaffService } from '../../../services/teamStaff.service';
import { usersService } from '../../../services/users.service';
import type { User } from '../../../models/User';
import type { ClubCreateActionId } from '../navigation/clubNavConfig';
import { useClubWorkspace } from '../hooks/useClubWorkspace';
import { ClubText } from '../ui/clubUi';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { spacing } from '../../../theme/designTokens';

const ACTION_TITLES: Record<ClubCreateActionId, string> = {
  match: 'Nouveau match',
  training: 'Nouvel entraînement',
  player: 'Ajouter un joueur',
  coach: 'Ajouter un coach',
  invite_member: 'Inviter un membre',
  event: 'Nouvel événement',
  invite_club: 'Invitation autre club',
};

type Props = {
  visible: boolean;
  action: ClubCreateActionId | null;
  onClose: () => void;
  onCreated?: () => void;
};

function parseStartsAt(dateStr: string, timeStr: string): Date {
  const day = dateStr.trim() || new Date().toISOString().slice(0, 10);
  const hm = timeStr.trim() || '18:00';
  const starts = new Date(`${day}T${hm.length === 5 ? hm : '18:00'}:00`);
  if (Number.isNaN(starts.getTime())) {
    throw new Error('Date ou heure invalide (AAAA-MM-JJ · HH:MM).');
  }
  return starts;
}

/** Formulaire CRÉER branché sur les services Firestore existants. */
export function ClubCreateFormModal({ visible, action, onClose, onCreated }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useClubTheme();
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('18:00');
  const [city, setCity] = useState('');
  const [teamId, setTeamId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState('');
  const [category, setCategory] = useState('U15');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setTitle('');
    setDate(new Date().toISOString().slice(0, 10));
    setTime('18:00');
    setCity(ws.club?.city ?? '');
    setTeamId(ws.teams[0]?.id ?? null);
    setOpponent('');
    setCategory('U15');
    setSearch('');
    setResults([]);
    setSaving(false);
  }, [ws.club?.city, ws.teams]);

  useEffect(() => {
    if (visible && action) reset();
  }, [visible, action, reset]);

  const runSearch = async () => {
    const q = search.trim();
    if (q.length < 2) {
      Alert.alert('Recherche', 'Saisissez au moins 2 caractères.');
      return;
    }
    setSearching(true);
    try {
      if (action === 'coach') {
        setResults((await usersService.listStaff('coach', q)).slice(0, 8));
      } else {
        setResults((await usersService.listPlayers(q)).slice(0, 8));
      }
    } finally {
      setSearching(false);
    }
  };

  const ensureClub = (): string | null => {
    if (!ws.clubId || !profile) {
      Alert.alert('Club requis', 'Liez un club à votre compte pour créer.');
      return null;
    }
    return ws.clubId;
  };

  const finishOk = (message: string) => {
    Alert.alert('Créé', message);
    onCreated?.();
    void ws.refresh();
    onClose();
  };

  const createEventLike = async (eventType: 'friendly' | 'training' | 'other', defaultTitle: string) => {
    const clubId = ensureClub();
    if (!clubId || !profile) return;
    const starts = parseStartsAt(date, time);
    const ends = new Date(starts.getTime() + (eventType === 'training' ? 90 : 120) * 60 * 1000);
    const invitee_uids =
      teamId != null
        ? ws.memberships
            .filter((m) => m.status === 'active' && (!m.team_id || m.team_id === teamId))
            .map((m) => m.player_uid)
            .slice(0, 40)
        : ws.players.map((p) => p.uid).slice(0, 40);

    await teamEventsService.create({
      title: title.trim() || defaultTitle,
      event_type: eventType,
      organizer_uid: profile.uid,
      organizer_name: profile.display_name || 'Club',
      club_id: clubId,
      club_name: ws.club?.name,
      team_id: teamId ?? undefined,
      starts_at: starts,
      ends_at: ends,
      city: city.trim() || ws.club?.city || 'À préciser',
      location_label: city.trim() || undefined,
      invitee_uids,
      categories: category.trim() ? [category.trim()] : undefined,
    });
  };

  const submit = async () => {
    if (!action || !profile) return;
    setSaving(true);
    try {
      if (action === 'match') {
        await createEventLike('friendly', opponent.trim() ? `Match vs ${opponent.trim()}` : 'Match');
        finishOk('Le match est au calendrier. Convocations en attente côté effectif.');
        return;
      }
      if (action === 'training') {
        await createEventLike('training', 'Entraînement');
        finishOk('Séance créée. Ouvrez la feuille de présence depuis Entraînements.');
        return;
      }
      if (action === 'event') {
        await createEventLike('other', title.trim() || 'Événement club');
        finishOk('Événement enregistré.');
        return;
      }
      if (action === 'invite_club') {
        const clubId = ensureClub();
        if (!clubId) return;
        if (!city.trim() || !date.trim() || !time.trim()) {
          Alert.alert('Champs requis', 'Ville, date et heure sont obligatoires.');
          return;
        }
        const starts = parseStartsAt(date, time);
        await friendlyMatchesService.create({
          requester_uid: profile.uid,
          requester_club_id: clubId,
          requester_club_name: ws.club?.name ?? profile.display_name,
          opponent_club_name: opponent.trim() || undefined,
          city: city.trim(),
          date: starts,
          time_label: time.trim(),
          category: category.trim() || 'U15',
          level: 'Départemental',
          level_type: 'competition',
          match_kind: 'amical',
          venue_side: 'home',
          message: title.trim() || undefined,
          mode: opponent.trim() ? 'direct' : 'open',
        });
        finishOk(
          opponent.trim()
            ? `Invitation envoyée à ${opponent.trim()}.`
            : 'Match publié sur le tableau ouvert.',
        );
        return;
      }
      Alert.alert('Sélection', 'Choisissez un profil dans les résultats de recherche.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setSaving(false);
    }
  };

  const inviteUser = async (user: User) => {
    const clubId = ensureClub();
    if (!clubId || !profile || !action) return;
    setSaving(true);
    try {
      if (action === 'player' || action === 'invite_member') {
        await membershipsService.invitePlayer({
          club_id: clubId,
          team_id: teamId ?? undefined,
          player_uid: user.uid,
          player_name: user.display_name,
          invited_by_uid: profile.uid,
        });
        finishOk(`${user.display_name} doit accepter l’affiliation.`);
        return;
      }
      if (action === 'coach') {
        await teamStaffService.add({
          club_id: clubId,
          team_id: teamId ?? undefined,
          uid: user.uid,
          display_name: user.display_name,
          staff_role: 'coach',
        });
        if (teamId) {
          await teamsService.assignCoach(teamId, user.uid);
        }
        finishOk(
          teamId
            ? `${user.display_name} ajouté et affecté à l’équipe.`
            : `${user.display_name} ajouté au staff. Affectez-le depuis Coach.`,
        );
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Invitation impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (!action) return null;

  const needsSearch = action === 'player' || action === 'coach' || action === 'invite_member';
  const needsSchedule =
    action === 'match' || action === 'training' || action === 'event' || action === 'invite_club';

  return (
    <AnimatedModalShell
      visible={visible}
      onClose={onClose}
      variant="tall"
      handleOnly
      sheetBackgroundColor={tokens.raised}
    >
      <View style={[styles.sheetBody, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <ClubText variant="section">{ACTION_TITLES[action]}</ClubText>
          <ClubText variant="caption" muted style={{ marginBottom: spacing.sm }}>
            Enregistrement réel dans le club
          </ClubText>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 420 }}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {needsSchedule ? (
              <>
                {action !== 'invite_club' ? (
                  <Field
                    label="Titre"
                    value={title}
                    onChangeText={setTitle}
                    placeholder={
                      action === 'match'
                        ? 'Match vs…'
                        : action === 'training'
                          ? 'Séance technique'
                          : 'Nom de l’événement'
                    }
                    styles={styles}
                    tokens={tokens}
                  />
                ) : null}
                {action === 'match' || action === 'invite_club' ? (
                  <Field
                    label="Adversaire / club"
                    value={opponent}
                    onChangeText={setOpponent}
                    placeholder={action === 'invite_club' ? 'Nom du club (ou vide = ouvert)' : 'Adversaire'}
                    styles={styles}
                    tokens={tokens}
                  />
                ) : null}
                <Field
                  label="Date (AAAA-MM-JJ)"
                  value={date}
                  onChangeText={setDate}
                  placeholder="2026-08-21"
                  styles={styles}
                  tokens={tokens}
                />
                <Field
                  label="Heure (HH:MM)"
                  value={time}
                  onChangeText={setTime}
                  placeholder="18:00"
                  styles={styles}
                  tokens={tokens}
                />
                <Field
                  label="Ville / lieu"
                  value={city}
                  onChangeText={setCity}
                  placeholder="Ville"
                  styles={styles}
                  tokens={tokens}
                />
                {(action === 'match' || action === 'invite_club') && (
                  <Field
                    label="Catégorie"
                    value={category}
                    onChangeText={setCategory}
                    placeholder="U15"
                    styles={styles}
                    tokens={tokens}
                  />
                )}
                {action !== 'invite_club' && ws.teams.length > 0 ? (
                  <View style={{ gap: 6 }}>
                    <ClubText variant="caption" muted>
                      Équipe
                    </ClubText>
                    {ws.teams.map((t) => (
                      <PressableSpring
                        key={t.id}
                        onPress={() => setTeamId(t.id)}
                        scaleTo={0.98}
                        style={[styles.chip, teamId === t.id && styles.chipOn]}
                      >
                        <ClubText
                          variant="caption"
                          style={teamId === t.id ? { color: '#fff', fontWeight: '700' } : undefined}
                        >
                          {t.name}
                        </ClubText>
                      </PressableSpring>
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}

            {needsSearch ? (
              <>
                {ws.teams.length > 0 ? (
                  <View style={{ gap: 6 }}>
                    <ClubText variant="caption" muted>
                      Équipe (optionnel)
                    </ClubText>
                    {ws.teams.map((t) => (
                      <PressableSpring
                        key={t.id}
                        onPress={() => setTeamId(t.id)}
                        scaleTo={0.98}
                        style={[styles.chip, teamId === t.id && styles.chipOn]}
                      >
                        <ClubText
                          variant="caption"
                          style={teamId === t.id ? { color: '#fff', fontWeight: '700' } : undefined}
                        >
                          {t.name}
                        </ClubText>
                      </PressableSpring>
                    ))}
                  </View>
                ) : null}
                <Field
                  label="Rechercher"
                  value={search}
                  onChangeText={setSearch}
                  placeholder={action === 'coach' ? 'Nom du coach' : 'Nom du joueur'}
                  styles={styles}
                  tokens={tokens}
                />
                <PressableSpring
                  onPress={() => void runSearch()}
                  scaleTo={0.97}
                  haptic
                  style={styles.secondaryBtn}
                >
                  {searching ? (
                    <ActivityIndicator color={tokens.accent} />
                  ) : (
                    <ClubText variant="caption" style={{ fontWeight: '700', color: tokens.accent }}>
                      Chercher
                    </ClubText>
                  )}
                </PressableSpring>
                {results.map((u) => (
                  <PressableSpring
                    key={u.uid}
                    onPress={() => void inviteUser(u)}
                    scaleTo={0.98}
                    haptic
                    style={styles.resultRow}
                    disabled={saving}
                  >
                    <ClubText variant="body" style={{ fontWeight: '600', flex: 1 }}>
                      {u.display_name}
                    </ClubText>
                    <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
                      Inviter
                    </ClubText>
                  </PressableSpring>
                ))}
              </>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <PressableSpring onPress={onClose} scaleTo={0.97} style={styles.cancelBtn}>
              <ClubText variant="caption" muted style={{ fontWeight: '700' }}>
                Annuler
              </ClubText>
            </PressableSpring>
            {!needsSearch ? (
              <PressableSpring
                onPress={() => void submit()}
                scaleTo={0.97}
                haptic
                style={styles.primaryBtn}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <ClubText variant="caption" style={{ color: '#fff', fontWeight: '800' }}>
                    Enregistrer
                  </ClubText>
                )}
              </PressableSpring>
            ) : null}
          </View>
      </View>
    </AnimatedModalShell>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  styles,
  tokens,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  styles: ReturnType<typeof createStyles>;
  tokens: ClubThemeTokens;
}) {
  return (
    <View style={{ gap: 4 }}>
      <ClubText variant="caption" muted>
        {label}
      </ClubText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.muted}
        style={styles.input}
        autoCapitalize="none"
      />
    </View>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    sheetBody: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      flex: 1,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: tokens.foreground,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
      alignSelf: 'flex-start',
    },
    chipOn: { backgroundColor: tokens.accent, borderColor: tokens.accent },
    secondaryBtn: {
      alignSelf: 'flex-start',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.accent,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    actions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
    cancelBtn: { paddingHorizontal: 14, paddingVertical: 12 },
    primaryBtn: {
      backgroundColor: tokens.accent,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 12,
      minWidth: 120,
      alignItems: 'center',
    },
  });
}
