import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import {
  CoachChapterScroll,
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
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';

const STATUS_LABEL: Record<CoachSessionStatus, string> = {
  requested: 'Demande',
  accepted: 'Confirmé',
  declined: 'Refusé',
  paid: 'Payé',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

const DURATIONS: CoachSessionDurationMin[] = [30, 60, 90];
const RATE_PRESETS = [20, 30, 40, 50, 60];

type Props = {
  profile: User;
};

/**
 * Coaching Personnel Pro — Gestion du tarif, disponibilités & propositions de séances.
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
          ? `Vous êtes visible pour les joueurs à ${rate} €/h (Train Hub > Coach humain).`
          : 'Vous n’apparaissez plus dans la liste des coachs à l’heure.',
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setBusy(false);
    }
  };

  const saveRate = async (newRate?: number) => {
    const rate = newRate ?? parseRate();
    if (rate == null) return;
    if (newRate) setRateText(String(newRate));
    setBusy(true);
    try {
      const payload = buildProfilePayload(hourly?.available ?? true, rate);
      await coachingSessionsService.upsertHourlyProfile(payload);
      setHourly(payload);
      Alert.alert('Tarif enregistré', `${rate} €/h — visible par les joueurs.`);
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
      const coachProfile = hourly ?? buildProfilePayload(true, rate);
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
        `${selectedPlayer.display_name} · ${duration} min · ~${Math.round(rate * (duration / 60))} € (demain 18h). Le joueur le voit dans son Train Hub.`,
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Proposition impossible.');
    } finally {
      setBusy(false);
    }
  };

  const isAvailable = hourly?.available ?? false;
  const currentRate = (hourly?.hourly_rate_eur ?? Number(rateText)) || 30;
  const sessionsCompleted = hourly?.sessions_completed ?? 0;
  const estimatedRevenue = sessionsCompleted * currentRate;

  const pending = bookings.filter((b) => b.status === 'requested');
  const upcoming = bookings.filter((b) => ['accepted', 'paid'].includes(b.status));

  return (
    <CoachPane title={pageIdentity.title} fallbackNavId="plus">
      <CoachChapterScroll>
        {/* Hero Card : Disponibilité & Statut du Coach */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconBox}>
              <Icon name="time" size={24} color={tokens.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.heroStatusBadgeRow}>
                <View style={[styles.statusDot, isAvailable ? styles.statusDotOpen : styles.statusDotClosed]} />
                <ProDayText variant="caption" style={[styles.statusText, isAvailable ? styles.statusTextOpen : styles.statusTextClosed]}>
                  {isAvailable ? 'CRÉNEAUX OUVERTS' : 'CRÉNEAUX FERMÉS'}
                </ProDayText>
              </View>
              <ProDayText variant="title" style={styles.heroTitle}>
                Coaching Personnel
              </ProDayText>
              <ProDayText variant="caption" style={styles.heroSub}>
                {isAvailable
                  ? 'Vous êtes visible dans Train Hub pour des séances individuelles.'
                  : 'Créneaux masqués. Activez la visibilité pour recevoir des réservations.'}
              </ProDayText>
            </View>

            <Switch
              value={isAvailable}
              onValueChange={(val) => void saveAvailability(val)}
              trackColor={{ false: tokens.border, true: tokens.soft }}
              thumbColor={isAvailable ? tokens.accent : tokens.muted}
            />
          </View>

          {/* KPI Metrics */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <ProDayText variant="caption" style={styles.kpiLabel}>
                Tarif / heure
              </ProDayText>
              <ProDayText variant="section" style={styles.kpiVal}>
                {currentRate} €
              </ProDayText>
            </View>
            <View style={styles.kpiCard}>
              <ProDayText variant="caption" style={styles.kpiLabel}>
                Séances
              </ProDayText>
              <ProDayText variant="section" style={styles.kpiVal}>
                {sessionsCompleted}
              </ProDayText>
            </View>
            <View style={styles.kpiCard}>
              <ProDayText variant="caption" style={styles.kpiLabel}>
                Note
              </ProDayText>
              <ProDayText variant="section" style={styles.kpiVal}>
                {hourly?.rating_avg ? `${hourly.rating_avg.toFixed(1)}/5` : '—'}
              </ProDayText>
            </View>
            <View style={styles.kpiCard}>
              <ProDayText variant="caption" style={styles.kpiLabel}>
                Revenus
              </ProDayText>
              <ProDayText variant="section" style={styles.kpiVal}>
                {estimatedRevenue} €
              </ProDayText>
            </View>
          </View>
        </View>

        {/* Section 1 : Configuration du Tarif Horaire */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Icon name="bag" size={16} color={tokens.accent} />
            <ProDayText variant="section" style={styles.sectionTitle}>
              Tarif Horaire & Tarification
            </ProDayText>
          </View>
          <ProDayText variant="caption" style={styles.sectionCounter}>
            {currentRate} € / h
          </ProDayText>
        </View>

        <View style={styles.pricingCard}>
          <ProDayText variant="caption" style={styles.pricingDesc}>
            Choisissez un tarif rapide ou saisissez votre montant personnalisé :
          </ProDayText>

          {/* Quick Rate Preset Chips */}
          <View style={styles.presetRow}>
            {RATE_PRESETS.map((p) => {
              const active = Number(rateText) === p;
              return (
                <PressableSpring
                  key={p}
                  onPress={() => void saveRate(p)}
                  scaleTo={0.96}
                  haptic
                  style={[styles.presetChip, active && styles.presetChipActive]}
                >
                  <ProDayText variant="caption" style={[styles.presetText, active && styles.presetTextActive]}>
                    {p} €
                  </ProDayText>
                </PressableSpring>
              );
            })}
          </View>

          {/* Custom Input & Save Button */}
          <View style={styles.customRateRow}>
            <View style={styles.rateInputWrap}>
              <TextInput
                style={styles.rateInput}
                value={rateText}
                onChangeText={setRateText}
                keyboardType="decimal-pad"
                placeholder="30"
                placeholderTextColor={tokens.muted}
                accessibilityLabel="Tarif horaire"
              />
              <ProDayText variant="caption" style={styles.rateUnit}>
                € / h
              </ProDayText>
            </View>

            <PressableSpring
              style={styles.saveRateBtn}
              disabled={busy}
              onPress={() => void saveRate()}
              scaleTo={0.96}
              haptic
            >
              {busy ? (
                <ActivityIndicator size="small" color={tokens.isLight ? '#FFFFFF' : '#000000'} />
              ) : (
                <ProDayText variant="caption" style={styles.saveRateBtnText}>
                  Enregistrer
                </ProDayText>
              )}
            </PressableSpring>
          </View>
        </View>

        {/* Section 2 : Proposer un Créneau à un Joueur */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Icon name="person" size={16} color={tokens.accent} />
            <ProDayText variant="section" style={styles.sectionTitle}>
              Proposer une Séance
            </ProDayText>
          </View>
        </View>

        {!proposeOpen ? (
          <PressableSpring
            onPress={() => setProposeOpen(true)}
            scaleTo={0.98}
            haptic
            style={styles.proposeTriggerBtn}
          >
            <View style={styles.proposeIconWrap}>
              <Icon name="add" size={20} color={tokens.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <ProDayText variant="section" style={styles.proposeTriggerTitle}>
                Proposer un créneau à un joueur du club
              </ProDayText>
              <ProDayText variant="caption" style={styles.proposeTriggerSub}>
                Envoyez une invitation directe qui s’affichera sur son espace Train Hub.
              </ProDayText>
            </View>
            <Icon name="chevron-forward" size={16} color={tokens.muted} />
          </PressableSpring>
        ) : (
          <View style={styles.proposeCard}>
            <View style={styles.proposeHead}>
              <ProDayText variant="section" style={styles.proposeCardTitle}>
                Nouvelle Proposition de Séance
              </ProDayText>
              <PressableSpring onPress={() => setProposeOpen(false)} scaleTo={0.94}>
                <Icon name="close" size={18} color={tokens.muted} />
              </PressableSpring>
            </View>

            <ProDayText variant="caption" style={styles.proposeCardSub}>
              1. Sélectionnez la durée :
            </ProDayText>

            <View style={styles.durationRow}>
              {DURATIONS.map((d) => {
                const active = duration === d;
                const cost = Math.round(currentRate * (d / 60));
                return (
                  <PressableSpring
                    key={d}
                    onPress={() => setDuration(d)}
                    scaleTo={0.96}
                    haptic
                    style={[styles.durationChip, active && styles.durationChipActive]}
                  >
                    <ProDayText variant="caption" style={[styles.durationText, active && styles.durationTextActive]}>
                      {d} min
                    </ProDayText>
                    <ProDayText variant="caption" style={[styles.durationCost, active && styles.durationCostActive]}>
                      {cost} €
                    </ProDayText>
                  </PressableSpring>
                );
              })}
            </View>

            <ProDayText variant="caption" style={styles.proposeCardSub}>
              2. Choisissez le joueur destinataire :
            </ProDayText>

            {players.length === 0 ? (
              <View style={styles.noPlayersBox}>
                <Icon name="people" size={20} color={tokens.muted} />
                <ProDayText variant="caption" style={styles.noPlayersText}>
                  Aucun joueur rattaché au club.
                </ProDayText>
              </View>
            ) : (
              <View style={styles.playerGrid}>
                {players.slice(0, 12).map((p) => {
                  const selected = selectedPlayer?.uid === p.uid;
                  return (
                    <PressableSpring
                      key={p.uid}
                      onPress={() => setSelectedPlayer(p)}
                      scaleTo={0.96}
                      haptic
                      style={[styles.playerChip, selected && styles.playerChipSelected]}
                    >
                      <View style={styles.playerAvatarMini}>
                        <ProDayText variant="caption" style={styles.playerAvatarText}>
                          {p.display_name.charAt(0)}
                        </ProDayText>
                      </View>
                      <ProDayText
                        variant="caption"
                        style={[styles.playerName, selected && styles.playerNameSelected]}
                        numberOfLines={1}
                      >
                        {p.display_name.split(' ')[0]}
                      </ProDayText>
                    </PressableSpring>
                  );
                })}
              </View>
            )}

            <View style={styles.proposeActionsRow}>
              <PressableSpring
                onPress={() => setProposeOpen(false)}
                scaleTo={0.96}
                style={styles.cancelBtn}
              >
                <ProDayText variant="caption" style={styles.cancelBtnText}>
                  Annuler
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                onPress={() => void proposeToPlayer()}
                disabled={busy || !selectedPlayer}
                scaleTo={0.96}
                haptic
                style={[styles.submitProposeBtn, (!selectedPlayer || busy) && { opacity: 0.5 }]}
              >
                {busy ? (
                  <ActivityIndicator size="small" color={tokens.isLight ? '#FFFFFF' : '#000000'} />
                ) : (
                  <ProDayText variant="caption" style={styles.submitProposeBtnText}>
                    Envoyer la proposition
                  </ProDayText>
                )}
              </PressableSpring>
            </View>
          </View>
        )}

        {/* Section 3 : Demandes en Attente */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Icon name="mail" size={16} color={tokens.accent} />
            <ProDayText variant="section" style={styles.sectionTitle}>
              Demandes en Attente
            </ProDayText>
          </View>
          <ProDayText variant="caption" style={styles.sectionCounter}>
            {pending.length} demande{pending.length > 1 ? 's' : ''}
          </ProDayText>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={tokens.accent} />
            <ProDayText variant="caption" style={{ color: tokens.muted }}>
              Chargement des réservations...
            </ProDayText>
          </View>
        ) : pending.length === 0 ? (
          <View style={styles.emptyRequestsCard}>
            <Icon name="chat" size={24} color={tokens.muted} />
            <ProDayText variant="caption" style={styles.emptyRequestsText}>
              Aucune demande de coaching en attente.
            </ProDayText>
          </View>
        ) : (
          <View style={styles.bookingList}>
            {pending.map((b) => (
              <View key={b.id} style={styles.bookingCard}>
                <View style={styles.bookingHead}>
                  <View style={styles.bookingAvatar}>
                    <ProDayText variant="caption" style={styles.bookingAvatarText}>
                      {b.player_name.charAt(0)}
                    </ProDayText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="section" style={styles.bookingPlayerName}>
                      {b.player_name}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.bookingMeta}>
                      {b.duration_min} min · {b.price_eur} €
                    </ProDayText>
                  </View>
                  <View style={styles.pendingBadge}>
                    <ProDayText variant="caption" style={styles.pendingBadgeText}>
                      En attente
                    </ProDayText>
                  </View>
                </View>

                <View style={styles.bookingActionsRow}>
                  <PressableSpring
                    onPress={() => void setBookingStatus(b.id, 'declined')}
                    scaleTo={0.96}
                    style={styles.declineBtn}
                  >
                    <ProDayText variant="caption" style={styles.declineBtnText}>
                      Refuser
                    </ProDayText>
                  </PressableSpring>
                  <PressableSpring
                    onPress={() => void setBookingStatus(b.id, 'accepted')}
                    scaleTo={0.96}
                    haptic
                    style={styles.acceptBtn}
                  >
                    <ProDayText variant="caption" style={styles.acceptBtnText}>
                      Accepter
                    </ProDayText>
                  </PressableSpring>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Section 4 : Séances Confirmées / À Venir */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Icon name="calendar" size={16} color={tokens.accent} />
            <ProDayText variant="section" style={styles.sectionTitle}>
              Séances Confirmées & Planning
            </ProDayText>
          </View>
          <ProDayText variant="caption" style={styles.sectionCounter}>
            {upcoming.length} confirmée{upcoming.length > 1 ? 's' : ''}
          </ProDayText>
        </View>

        {upcoming.length === 0 ? (
          <View style={styles.emptyRequestsCard}>
            <Icon name="calendar" size={24} color={tokens.muted} />
            <ProDayText variant="caption" style={styles.emptyRequestsText}>
              Aucun créneau confirmé pour le moment.
            </ProDayText>
          </View>
        ) : (
          <View style={styles.bookingList}>
            {upcoming.map((b) => (
              <PressableSpring
                key={b.id}
                onPress={() => {
                  const actions: {
                    text: string;
                    style?: 'cancel' | 'destructive';
                    onPress?: () => void;
                  }[] = [{ text: 'Fermer', style: 'cancel' }];
                  if (b.status === 'accepted') {
                    actions.push(
                      {
                        text: 'Marquer payé hors app',
                        onPress: () => void setBookingStatus(b.id, 'paid'),
                      },
                      {
                        text: 'Annuler la séance',
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
                    'Détails de la séance',
                    `Joueur : ${b.player_name}\nDate : ${b.starts_at.toLocaleString('fr-FR')}\nDurée : ${b.duration_min} min\nMontant : ${b.price_eur} €\nStatut : ${STATUS_LABEL[b.status]}`,
                    actions,
                  );
                }}
                scaleTo={0.98}
                haptic
                style={styles.confirmedCard}
              >
                <View style={styles.confirmedIconCircle}>
                  <Icon name="checkmark-circle" size={16} color={tokens.accent} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <ProDayText variant="section" style={styles.confirmedPlayerName}>
                    {b.player_name}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.confirmedMeta}>
                    {b.starts_at.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {b.duration_min} min · {b.price_eur} €
                  </ProDayText>
                </View>
                <View style={styles.statusPill}>
                  <ProDayText variant="caption" style={styles.statusPillText}>
                    {STATUS_LABEL[b.status]}
                  </ProDayText>
                </View>
              </PressableSpring>
            ))}
          </View>
        )}

        {/* Footer info box */}
        <View style={styles.footerNote}>
          <Icon name="alert-circle" size={16} color={tokens.muted} />
          <ProDayText variant="caption" style={styles.footerNoteText}>
            Les réservations payées via Stripe sont créditées automatiquement sur votre compte bancaire lié.
          </ProDayText>
        </View>
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
  elevated?: string;
  isLight?: boolean;
}) {
  return StyleSheet.create({
    heroCard: {
      borderRadius: radius.lg,
      backgroundColor: tokens.elevated || tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.md,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    heroIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.accent,
    },
    heroStatusBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 2,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusDotOpen: {
      backgroundColor: tokens.accent,
    },
    statusDotClosed: {
      backgroundColor: tokens.muted,
    },
    statusText: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.8,
    },
    statusTextOpen: {
      color: tokens.accent,
    },
    statusTextClosed: {
      color: tokens.muted,
    },
    heroTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: tokens.foreground,
    },
    heroSub: {
      fontSize: 11,
      color: tokens.muted,
      lineHeight: 15,
      marginTop: 2,
    },
    kpiRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingTop: 4,
    },
    kpiCard: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      gap: 2,
    },
    kpiLabel: {
      fontSize: 9,
      color: tokens.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    kpiVal: {
      fontSize: 13,
      fontWeight: '900',
      color: tokens.foreground,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
      paddingHorizontal: 2,
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: tokens.foreground,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionCounter: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.accent,
    },
    pricingCard: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated || tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    pricingDesc: {
      fontSize: 11,
      color: tokens.muted,
    },
    presetRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    presetChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    presetChipActive: {
      borderColor: tokens.accent,
      backgroundColor: tokens.soft,
    },
    presetText: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.muted,
    },
    presetTextActive: {
      color: tokens.accent,
      fontWeight: '900',
    },
    customRateRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'center',
      marginTop: 2,
    },
    rateInputWrap: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      minHeight: 44,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    rateInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: '800',
      color: tokens.foreground,
      padding: 0,
    },
    rateUnit: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.muted,
    },
    saveRateBtn: {
      paddingHorizontal: spacing.lg,
      minHeight: 44,
      borderRadius: radius.sm,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveRateBtnText: {
      fontSize: 12,
      fontWeight: '900',
      color: tokens.isLight ? '#FFFFFF' : '#000000',
    },
    proposeTriggerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated || tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: spacing.md,
    },
    proposeIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.accent,
    },
    proposeTriggerTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: tokens.foreground,
    },
    proposeTriggerSub: {
      fontSize: 11,
      color: tokens.muted,
      lineHeight: 15,
    },
    proposeCard: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated || tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    proposeHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    proposeCardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: tokens.foreground,
    },
    proposeCardSub: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.muted,
      marginTop: 2,
    },
    durationRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    durationChip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 2,
    },
    durationChipActive: {
      borderColor: tokens.accent,
      backgroundColor: tokens.soft,
    },
    durationText: {
      fontSize: 12,
      fontWeight: '800',
      color: tokens.muted,
    },
    durationTextActive: {
      color: tokens.accent,
    },
    durationCost: {
      fontSize: 10,
      color: tokens.muted,
    },
    durationCostActive: {
      color: tokens.accent,
      fontWeight: '700',
    },
    noPlayersBox: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      gap: 4,
    },
    noPlayersText: {
      fontSize: 11,
      color: tokens.muted,
    },
    playerGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    playerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    playerChipSelected: {
      borderColor: tokens.accent,
      backgroundColor: tokens.soft,
    },
    playerAvatarMini: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerAvatarText: {
      fontSize: 9,
      fontWeight: '800',
      color: tokens.accent,
    },
    playerName: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.muted,
    },
    playerNameSelected: {
      color: tokens.accent,
      fontWeight: '800',
    },
    proposeActionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: 4,
    },
    cancelBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    cancelBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.muted,
    },
    submitProposeBtn: {
      flex: 2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: radius.sm,
      backgroundColor: tokens.accent,
    },
    submitProposeBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: tokens.isLight ? '#FFFFFF' : '#000000',
    },
    loadingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    emptyRequestsCard: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated || tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: spacing.md,
    },
    emptyRequestsText: {
      fontSize: 11,
      color: tokens.muted,
    },
    bookingList: {
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    bookingCard: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated || tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: spacing.sm,
    },
    bookingHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    bookingAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookingAvatarText: {
      fontSize: 14,
      fontWeight: '800',
      color: tokens.accent,
    },
    bookingPlayerName: {
      fontSize: 13,
      fontWeight: '800',
      color: tokens.foreground,
    },
    bookingMeta: {
      fontSize: 11,
      color: tokens.muted,
    },
    pendingBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: tokens.soft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.accent,
    },
    pendingBadgeText: {
      fontSize: 9,
      fontWeight: '900',
      color: tokens.accent,
      textTransform: 'uppercase',
    },
    bookingActionsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
    },
    declineBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    declineBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.muted,
    },
    acceptBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: tokens.accent,
    },
    acceptBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: tokens.isLight ? '#FFFFFF' : '#000000',
    },
    confirmedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated || tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    confirmedIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmedPlayerName: {
      fontSize: 13,
      fontWeight: '800',
      color: tokens.foreground,
    },
    confirmedMeta: {
      fontSize: 11,
      color: tokens.muted,
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.accent,
    },
    footerNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    footerNoteText: {
      flex: 1,
      fontSize: 10,
      color: tokens.muted,
      lineHeight: 14,
    },
  });
}
