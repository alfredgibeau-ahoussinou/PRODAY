import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import {
  CoachChapterScroll,
  CoachEmptyState,
  CoachSettingsGroup,
  CoachSettingsRow,
  CoachText,
} from '../../../components/coach/coachPortalUi';
import { CoachPane } from '../../../components/coach/CoachScreenHeader';
import { getCoachPageIdentity } from '../../../content/coachPageIdentity';
import { useCoachTheme } from './CoachThemeContext';
import type { User } from '../../../models/User';
import {
  DEFAULT_COACHING_COMMISSION,
  type CoachHourlyProfile,
  type CoachSessionBooking,
  type CoachSessionDurationMin,
  type CoachSessionStatus,
} from '../../../models/HomeTraining';
import { coachingSessionsService } from '../../../services/homeTraining.service';
import { usersService } from '../../../services/users.service';
import { radius, spacing } from '../../../theme/designTokens';

const STATUS_LABEL: Record<CoachSessionStatus, string> = {
  requested: 'Demande',
  accepted: 'Confirmé',
  declined: 'Refusé',
  paid: 'Payé',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const DURATIONS: CoachSessionDurationMin[] = [30, 60, 90];

type Props = {
  profile: User;
};

/**
 * MVP coaching personnel payant — tarif + disponibilité + RDV.
 * Paiement carte via Stripe côté joueur si Functions branchées ;
 * sinon le coach peut marquer « payé hors app ».
 */
export function CoachHourlyPane({ profile }: Props) {
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const pageIdentity = getCoachPageIdentity('coaching_perso');

  const [hourly, setHourly] = useState<CoachHourlyProfile | null>(null);
  const [rateText, setRateText] = useState('30');
  const [bookings, setBookings] = useState<CoachSessionBooking[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [busy, setBusy] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);
  const [duration, setDuration] = useState<CoachSessionDurationMin>(60);
  const [loading, setLoading] = useState(true);

  const clubId = profile.profile.club_id;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [prof, rows, members] = await Promise.all([
        coachingSessionsService.getHourlyProfile(profile.uid),
        coachingSessionsService.listForCoach(profile.uid),
        clubId ? usersService.listMembersByClubId(clubId) : Promise.resolve([] as User[]),
      ]);
      setHourly(prof);
      setRateText(String(prof?.hourly_rate_eur ?? 30));
      setBookings(rows.slice(0, 24));
      setPlayers(members.filter((m) => m.uid !== profile.uid && m.role === 'player'));
    } finally {
      setLoading(false);
    }
  }, [profile.uid, clubId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const buildProfilePayload = (available: boolean, rate: number): CoachHourlyProfile => ({
    coach_uid: profile.uid,
    display_name: profile.display_name,
    photo_url: profile.avatar_url,
    bio: profile.profile.bio,
    specialties: profile.profile.specialties ?? [],
    age_categories: profile.profile.category ? [profile.profile.category] : [],
    positions_coached: [],
    city: profile.city?.trim() || 'France',
    hourly_rate_eur: rate,
    club_id: clubId,
    available,
    sessions_completed: hourly?.sessions_completed ?? 0,
    rating_avg: hourly?.rating_avg,
  });

  const parseRate = (): number | null => {
    const n = Number(rateText.replace(',', '.'));
    if (!Number.isFinite(n)) return null;
    const min = DEFAULT_COACHING_COMMISSION.hourly_rate_min_eur;
    const max = DEFAULT_COACHING_COMMISSION.hourly_rate_max_eur;
    if (n < min || n > max) {
      Alert.alert('Tarif', `Indiquez un tarif entre ${min} et ${max} €/h.`);
      return null;
    }
    return Math.round(n * 100) / 100;
  };

  const saveAvailability = async (available: boolean) => {
    const rate = parseRate();
    if (rate == null) return;
    setBusy(true);
    try {
      const payload = buildProfilePayload(available, rate);
      await coachingSessionsService.upsertHourlyProfile(payload);
      setHourly(payload);
      Alert.alert(
        available ? 'Créneaux ouverts' : 'Créneaux fermés',
        available
          ? `Tu es visible pour les joueurs à ${rate} €/h (Train Hub → Coach humain).`
          : 'Tu n’apparais plus dans la liste des coachs à l’heure.',
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  };

  const saveRate = async () => {
    const rate = parseRate();
    if (rate == null) return;
    setBusy(true);
    try {
      const payload = buildProfilePayload(hourly?.available ?? true, rate);
      await coachingSessionsService.upsertHourlyProfile(payload);
      setHourly(payload);
      Alert.alert('Tarif enregistré', `${rate} €/h — visible pour les joueurs.`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  };

  const setBookingStatus = async (id: string, status: CoachSessionStatus) => {
    try {
      await coachingSessionsService.setStatus(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
    }
  };

  const proposeToPlayer = async () => {
    if (!selectedPlayer) {
      Alert.alert('Joueur', 'Choisissez un joueur du club.');
      return;
    }
    const rate = parseRate();
    if (rate == null) return;
    setBusy(true);
    try {
      const coachProfile =
        hourly ?? buildProfilePayload(true, rate);
      if (!hourly) {
        await coachingSessionsService.upsertHourlyProfile({ ...coachProfile, available: true });
        setHourly({ ...coachProfile, available: true });
      }
      const starts = new Date();
      starts.setDate(starts.getDate() + 1);
      starts.setHours(18, 0, 0, 0);
      await coachingSessionsService.proposeSession({
        coach: { ...coachProfile, hourly_rate_eur: rate },
        player_uid: selectedPlayer.uid,
        player_name: selectedPlayer.display_name,
        starts_at: starts,
        duration_min: duration,
        location_label: coachProfile.city,
        notes: 'Proposé par le coach — paiement carte ou hors app',
      });
      setProposeOpen(false);
      setSelectedPlayer(null);
      await refresh();
      Alert.alert(
        'Créneau proposé',
        `${selectedPlayer.display_name} · ${duration} min · ~${Math.round(rate * (duration / 60))} € (demain 18h). Le joueur le voit dans Train Hub.`,
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Proposition impossible.');
    } finally {
      setBusy(false);
    }
  };

  const pending = bookings.filter((b) => b.status === 'requested');
  const upcoming = bookings.filter((b) =>
    ['accepted', 'paid'].includes(b.status),
  );

  return (
    <CoachPane title={pageIdentity.title}>
      <CoachChapterScroll>
        <CoachText variant="body" muted style={styles.intro}>
          Coaching personnel à l’heure — tarif affiché, demandes joueurs, créneaux proposés.
          Paiement carte si Stripe est actif ; sinon marquez « payé hors app ».
        </CoachText>

        <CoachText variant="caption" muted style={styles.kicker}>
          Tarif horaire (€)
        </CoachText>
        <View style={styles.rateRow}>
          <TextInput
            style={styles.rateInput}
            value={rateText}
            onChangeText={setRateText}
            keyboardType="decimal-pad"
            placeholder="30"
            placeholderTextColor={tokens.muted}
            accessibilityLabel="Tarif horaire en euros"
          />
          <Pressable
            style={[styles.primaryBtn, busy && styles.disabled]}
            disabled={busy}
            onPress={() => void saveRate()}
          >
            <CoachText variant="caption" inverse style={styles.btnText}>
              Enregistrer
            </CoachText>
          </Pressable>
        </View>

        <CoachSettingsGroup>
          <CoachSettingsRow
            icon="time"
            label={
              hourly?.available
                ? 'Fermer les créneaux (masquer)'
                : 'Ouvrir les créneaux (visible joueurs)'
            }
            onPress={() => void saveAvailability(!(hourly?.available ?? false))}
            last={!proposeOpen}
          />
          {!proposeOpen ? (
            <CoachSettingsRow
              icon="add"
              label="Proposer un créneau à un joueur"
              onPress={() => setProposeOpen(true)}
              last
            />
          ) : null}
        </CoachSettingsGroup>

        {proposeOpen ? (
          <View style={styles.proposeBox}>
            <CoachText variant="section">Proposer un créneau</CoachText>
            <CoachText variant="caption" muted>
              Demain 18h · durée au choix · statut confirmé (le joueur peut payer).
            </CoachText>
            <View style={styles.durationRow}>
              {DURATIONS.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.chip, duration === d && styles.chipOn]}
                  onPress={() => setDuration(d)}
                >
                  <CoachText variant="caption" accent={duration === d}>
                    {d} min
                  </CoachText>
                </Pressable>
              ))}
            </View>
            {players.length === 0 ? (
              <CoachEmptyState
                title="Aucun joueur club"
                body="Rattachez un club avec des joueurs pour proposer un créneau, ou attendez une demande depuis Train Hub."
              />
            ) : (
              <View style={styles.playerList}>
                {players.slice(0, 12).map((p) => (
                  <Pressable
                    key={p.uid}
                    style={[
                      styles.playerChip,
                      selectedPlayer?.uid === p.uid && styles.chipOn,
                    ]}
                    onPress={() => setSelectedPlayer(p)}
                  >
                    <CoachText
                      variant="caption"
                      accent={selectedPlayer?.uid === p.uid}
                      numberOfLines={1}
                    >
                      {p.display_name}
                    </CoachText>
                  </Pressable>
                ))}
              </View>
            )}
            <View style={styles.proposeActions}>
              <Pressable style={styles.secondaryBtn} onPress={() => setProposeOpen(false)}>
                <CoachText variant="caption">Annuler</CoachText>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, busy && styles.disabled]}
                disabled={busy || !selectedPlayer}
                onPress={() => void proposeToPlayer()}
              >
                <CoachText variant="caption" inverse style={styles.btnText}>
                  Proposer
                </CoachText>
              </Pressable>
            </View>
          </View>
        ) : null}

        <CoachText variant="caption" muted style={styles.kicker}>
          Demandes en attente
        </CoachText>
        {loading ? (
          <CoachText variant="caption" muted>
            Chargement…
          </CoachText>
        ) : pending.length === 0 ? (
          <CoachText variant="caption" muted>
            Aucune demande pour l’instant.
          </CoachText>
        ) : (
          <CoachSettingsGroup>
            {pending.map((b, index) => (
              <CoachSettingsRow
                key={b.id}
                icon="person"
                label={`${b.player_name} · ${b.duration_min} min · ${b.price_eur} €`}
                last={index === pending.length - 1}
                onPress={() => {
                  Alert.alert(
                    'Demande de séance',
                    `${b.player_name} · ${b.starts_at.toLocaleString('fr-FR')} · ${b.price_eur} €`,
                    [
                      { text: 'Fermer', style: 'cancel' },
                      {
                        text: 'Refuser',
                        style: 'destructive',
                        onPress: () => void setBookingStatus(b.id, 'declined'),
                      },
                      {
                        text: 'Accepter',
                        onPress: () => void setBookingStatus(b.id, 'accepted'),
                      },
                    ],
                  );
                }}
              />
            ))}
          </CoachSettingsGroup>
        )}

        <CoachText variant="caption" muted style={styles.kicker}>
          Confirmés / à venir
        </CoachText>
        {upcoming.length === 0 ? (
          <CoachText variant="caption" muted>
            Aucun créneau confirmé.
          </CoachText>
        ) : (
          <CoachSettingsGroup>
            {upcoming.map((b, index) => (
              <CoachSettingsRow
                key={b.id}
                icon="calendar"
                label={`${b.player_name} · ${STATUS_LABEL[b.status]} · ${b.price_eur} €`}
                last={index === upcoming.length - 1}
                onPress={() => {
                  const actions: {
                    text: string;
                    style?: 'cancel' | 'destructive';
                    onPress?: () => void;
                  }[] = [{ text: 'Fermer', style: 'cancel' }];
                  if (b.status === 'accepted') {
                    actions.push(
                      {
                        text: 'Payé hors app',
                        onPress: () => void setBookingStatus(b.id, 'paid'),
                      },
                      {
                        text: 'Annuler',
                        style: 'destructive',
                        onPress: () => void setBookingStatus(b.id, 'cancelled'),
                      },
                    );
                  } else if (b.status === 'paid') {
                    actions.push({
                      text: 'Marquer terminé',
                      onPress: () => void setBookingStatus(b.id, 'completed'),
                    });
                  }
                  Alert.alert(
                    'Créneau',
                    `${b.player_name}\n${b.starts_at.toLocaleString('fr-FR')}\n${b.duration_min} min · ${b.price_eur} €\nStatut : ${STATUS_LABEL[b.status]}`,
                    actions,
                  );
                }}
              />
            ))}
          </CoachSettingsGroup>
        )}

        <CoachText variant="caption" muted style={styles.footerHint}>
          Côté joueur : Train Hub → Coach humain. Statut actuel :{' '}
          {hourly?.available ? `ouvert · ${hourly.hourly_rate_eur} €/h` : 'fermé'}.
        </CoachText>
      </CoachChapterScroll>
    </CoachPane>
  );
}

function createStyles(tokens: {
  bg: string;
  surface: string;
  border: string;
  foreground: string;
  muted: string;
  accent: string;
  soft: string;
  onAccent?: string;
}) {
  return StyleSheet.create({
    intro: { marginBottom: spacing.sm },
    kicker: {
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    rateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    rateInput: {
      flex: 1,
      minHeight: 48,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      color: tokens.foreground,
      paddingHorizontal: spacing.md,
      fontSize: 17,
      fontWeight: '600',
    },
    primaryBtn: {
      backgroundColor: tokens.accent,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      minHeight: 48,
      justifyContent: 'center',
    },
    secondaryBtn: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      minHeight: 48,
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    btnText: { fontWeight: '700' },
    disabled: { opacity: 0.45 },
    proposeBox: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    durationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.bg,
    },
    chipOn: {
      borderColor: tokens.accent,
      backgroundColor: tokens.soft,
    },
    playerList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    playerChip: {
      maxWidth: '48%',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    proposeActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    footerHint: { marginTop: spacing.lg, marginBottom: spacing.xl },
  });
}
