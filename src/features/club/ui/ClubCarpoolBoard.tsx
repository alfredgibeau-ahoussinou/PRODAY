/**
 * Pôle Club — Covoiturage & Logistique Déplacements.
 * Données réelles uniquement (DATA-01) : offres persistées `carpool_offers`
 * + trajets événement `team_events.carpool_slots`. Aucune donnée de démo.
 *
 * Design System Club (clubDesignSystem / clubUi) : en-tête sur canvas,
 * cartes surface arrondies, pilules de filtre à contour d'accent, boutons
 * pilule. Zéro émoji unicode.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import { carpoolOffersService } from '../../../services/carpoolOffers.service';
import { StandaloneCarpoolForm } from '../../../components/carpool/StandaloneCarpoolForm';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { buildCarpoolVehicles } from '../../../utils/clubHubRealData';
import type { User } from '../../../models/User';
import type { StandaloneCarpoolOffer } from '../../../models/StandaloneCarpoolOffer';
import type { CarpoolPassenger } from '../../../models/TeamEvent';
import {
  isPassengerPending,
  isStandalonePassenger,
  standaloneAvailableSeats,
  standalonePendingCount,
} from '../../../utils/standaloneCarpool';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import type { IconName } from '../../../components/ui/iconNames';
import { useClubTheme } from '../shell/ClubThemeContext';
import { useClubShellNav } from '../shell/ClubShellNavContext';
import {
  ClubButton,
  ClubEmptyState,
  ClubLoading,
  ClubSearchField,
  ClubSectionCard,
  ClubSegmentedControl,
  ClubStatusPill,
  ClubText,
} from './clubUi';
import {
  clubRadius,
  clubSpace,
  clubForm,
  clubSurfaceCard,
} from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';

export type CarpoolVehicle = {
  id: string;
  driverName: string;
  driverRole: string;
  vehicleModel: string;
  totalSeats: number;
  availableSeats: number;
  meetupPoint: string;
  departureTime: string;
  destinationStadium: string;
  passengers: string[];
  contactPhone: string;
};

type Props = {
  vehicles?: CarpoolVehicle[];
  clubId?: string;
  onBookSeat?: (vehicleId: string) => void;
};

type JourneyCardModel = {
  offer: StandaloneCarpoolOffer;
  title: string;
  dayLabel: string;
  timeLabel: string;
  destinationLabel: string;
  vehicleLabel: string;
  meetupLabel: string;
  available: number;
  totalSeats: number;
  confirmed: number;
  pending: number;
  isMine: boolean;
  isBooked: boolean;
  isPending: boolean;
};

const SCOPE_OPTIONS = [
  { id: 'all' as const, label: 'Tous les trajets' },
  { id: 'mine' as const, label: 'Mes trajets' },
  { id: 'past' as const, label: 'Historique' },
];

function dayLabelOf(date: Date): string {
  if (!Number.isFinite(date.getTime())) return 'Date à confirmer';
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function timeLabelOf(date: Date): string {
  if (!Number.isFinite(date.getTime())) return '—';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isPast(offer: StandaloneCarpoolOffer): boolean {
  return (
    offer.status === 'completed' ||
    offer.status === 'cancelled' ||
    offer.departs_at.getTime() < Date.now() - 6 * 60 * 60 * 1000
  );
}

function passengerNames(offer: StandaloneCarpoolOffer): string[] {
  return (offer.passengers ?? [])
    .filter((p) => p.status === 'confirmed' || !p.status)
    .map((p) => p.name);
}

export function ClubCarpoolBoard({ vehicles, clubId, onBookSeat }: Props) {
  const { tokens } = useClubTheme();
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const [serviceOffers, setServiceOffers] = useState<StandaloneCarpoolOffer[] | null>(
    vehicles ? null : [],
  );
  const [loading, setLoading] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [scope, setScope] = useState<(typeof SCOPE_OPTIONS)[number]['id']>('all');
  const [search, setSearch] = useState('');

  const carList = useMemo<JourneyCardModel[]>(() => {
    if (vehicles) {
      return vehicles.map((v) => ({
        offer: {
          id: v.id,
          driver_uid: '',
          driver_name: v.driverName,
          title: v.destinationStadium,
          departs_at: new Date(NaN),
          seats: v.totalSeats,
          status: 'open',
          passengers: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
        title: v.destinationStadium || 'Trajet',
        dayLabel: '—',
        timeLabel: v.departureTime,
        destinationLabel: v.destinationStadium,
        vehicleLabel: v.vehicleModel,
        available: v.availableSeats,
        totalSeats: v.totalSeats,
        confirmed: v.passengers.length,
        pending: 0,
        isMine: false,
        isBooked: false,
        isPending: false,
        meetupLabel: v.meetupPoint,
      }));
    }
    return (serviceOffers ?? []).map((offer) => {
      const myPassenger = profile
        ? (offer.passengers ?? []).find((p) => p.uid === profile.uid)
        : undefined;
      return {
        offer,
        title: offer.title?.trim() || offer.destination_label?.trim() || 'Trajet libre',
        dayLabel: dayLabelOf(offer.departs_at),
        timeLabel: timeLabelOf(offer.departs_at),
        destinationLabel: offer.destination_label?.trim() || 'Destination à préciser',
        vehicleLabel: offer.club_only ? 'Membres du club' : 'Trajet libre',
        meetupLabel: offer.meeting_place?.trim() || offer.city?.trim() || 'RDV à préciser',
        available: standaloneAvailableSeats(offer),
        totalSeats: offer.seats,
        confirmed: passengerNames(offer).length,
        pending: standalonePendingCount(offer),
        isMine: profile ? offer.driver_uid === profile.uid : false,
        isBooked: profile
          ? isStandalonePassenger(offer, profile.uid) && !isPassengerPending(myPassenger ?? { uid: profile.uid, name: '' })
          : false,
        isPending: myPassenger ? isPassengerPending(myPassenger) : false,
      };
    });
  }, [vehicles, serviceOffers, profile]);

  const loadOffers = useCallback(async () => {
    if (vehicles) return; // injection (tests / mocks)
    setLoading(true);
    try {
      const offers = await carpoolOffersService.listOpen(60, clubId);
      setServiceOffers(offers);
    } catch {
      setServiceOffers((prev) => prev ?? []);
    } finally {
      setLoading(false);
    }
  }, [vehicles, clubId]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return carList.filter((card) => {
      if (scope === 'mine' && !(card.isMine || card.isBooked || card.isPending)) return false;
      if (scope === 'past' && !isPast(card.offer)) return false;
      if (scope === 'all' && isPast(card.offer)) return false;
      if (q) {
        const haystack = `${card.title} ${card.destinationLabel} ${card.offer.driver_name} ${card.offer.event_title ?? ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [carList, scope, search]);

  const totalSeatsAvail = useMemo(
    () => filtered.reduce((sum, c) => (isPast(c.offer) ? sum : sum + c.available), 0),
    [filtered],
  );
  const totalPassengers = useMemo(
    () => carList.reduce((sum, c) => sum + c.confirmed, 0),
    [carList],
  );

  const openGps = (address: string) => {
    const url = `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
    void Linking.openURL(url).catch(() => undefined);
  };

  const openLinkedEvent = (eventId: string) => {
    shellNav?.requestNav('calendar');
    void eventId;
  };

  /** Passager — demande une place (dupliqué / complet / mineur gérés par le service). */
  const handleBook = async (card: JourneyCardModel) => {
    const offer = card.offer;
    if (card.available <= 0) {
      Alert.alert('Complet', 'Ce trajet n’a plus de place disponible.');
      return;
    }
    if (!profile) {
      Alert.alert(
        'Connexion requise',
        'Connectez-vous pour réserver une place — aucune réservation simulée n’est effectuée.',
      );
      return;
    }
    try {
      setBusyId(offer.id);
      await carpoolOffersService.requestSeat(
        offer.id,
        profile.uid,
        profile.display_name || 'Passager',
      );
      Alert.alert(
        'Place demandée',
        `Votre demande a été envoyée à ${offer.driver_name}. Elle reste en attente jusqu’à sa confirmation — le point de rendez-vous et l’heure de départ apparaissent sur le trajet.`,
      );
      onBookSeat?.(offer.id);
      await loadOffers();
    } catch (e) {
      Alert.alert(
        'Réservation impossible',
        e instanceof Error ? e.message : 'Le trajet n’est plus disponible.',
      );
    } finally {
      setBusyId(null);
    }
  };

  /** Passager — annule sa réservation / sa demande. */
  const handleCancelBooking = (card: JourneyCardModel) => {
    Alert.alert('Annuler ma place', `Retirer votre réservation chez ${card.offer.driver_name} ?`, [
      { text: 'Non', style: 'cancel' },
      {
        text: 'Oui, annuler',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusyId(card.offer.id);
            try {
              await carpoolOffersService.cancelSeat(card.offer.id, profile?.uid ?? '');
              await loadOffers();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Annulation impossible.');
            } finally {
              setBusyId(null);
            }
          })();
        },
      },
    ]);
  };

  /** Conducteur — accepte ou refuse une demande. */
  const handleRespond = (card: JourneyCardModel, passenger: CarpoolPassenger, accept: boolean) => {
    void (async () => {
      setBusyId(card.offer.id);
      try {
        await carpoolOffersService.respondToSeat(card.offer.id, profile?.uid ?? '', passenger.uid, accept);
        await loadOffers();
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
      } finally {
        setBusyId(null);
      }
    })();
  };

  /** Conducteur — annule tout le trajet, prévient les passagers. */
  const handleCancelJourney = (card: JourneyCardModel) => {
    const passengerCount = card.confirmed + card.pending;
    Alert.alert(
      'Annuler le trajet',
      passengerCount > 0
        ? `${passengerCount} passager(s) inscrit(s) recevront une notification d’annulation.`
        : 'Le trajet sera retiré des propositions du club.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Annuler le trajet',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyId(card.offer.id);
              try {
                await carpoolOffersService.cancelJourney(card.offer.id, profile?.uid ?? '');
                await loadOffers();
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Annulation impossible.');
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ],
    );
  };

  if (loading && serviceOffers?.length === 0) {
    return <ClubLoading />;
  }
  return (
    <View style={styles.container}>
      {/* Synthèse réelle des offres persistées — aucun faux trajet */}
      <View style={StyleSheet.flatten([styles.summaryCard, clubSurfaceCard(tokens)])}>
        <View style={styles.summaryTop}>
          <ClubStatusPill
            label={`${carList.filter((c) => !isPast(c.offer)).length} trajet(s) actif(s)`}
            tone="accent"
          />
          <ClubText variant="caption" muted>
            {totalSeatsAvail} place{totalSeatsAvail > 1 ? 's' : ''} libre{totalSeatsAvail > 1 ? 's' : ''}
            {' · '}
            {totalPassengers} inscrit{totalPassengers > 1 ? 's' : ''}
          </ClubText>
        </View>
        <ClubText variant="caption" muted>
          Les destinations réelles saisies par les conducteurs apparaissent ci-dessous. Les demandes
          restent en attente jusqu’à la confirmation du conducteur — aucune réservation automatique.
        </ClubText>
      </View>

      <ClubButton
        label="Proposer mon véhicule"
        icon="add"
        variant="primary"
        onPress={() => setProposeOpen(true)}
      />

      <ClubSearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher par destination, conducteur, événement…"
      />

      <ClubSegmentedControl
        options={SCOPE_OPTIONS}
        value={scope}
        onChange={setScope}
      />

      {/* Liste des trajets */}
      <View style={styles.list}>
        {filtered.length === 0 ? (
          <ClubEmptyState
            title={scope === 'mine' ? 'Aucun trajet pour vous' : 'Aucun trajet proposé'}
            body={
              scope === 'mine'
                ? 'Vos réservations et vos propositions apparaîtront ici.'
                : 'Les véhicules et places disponibles pour les déplacements du club apparaissent dès qu’un conducteur se propose — aucune donnée de démonstration n’est affichée.'
            }
            actionLabel={scope === 'all' ? 'Proposer un trajet' : undefined}
            onAction={scope === 'all' ? () => setProposeOpen(true) : undefined}
            icon="car"
          />
        ) : (
          filtered.map((card) => {
            const driverControls = card.isMine && !isPast(card.offer);
            const requestable =
              !card.isMine &&
              !card.isBooked &&
              !card.isPending &&
              card.available > 0 &&
              card.offer.status === 'open' &&
              !isPast(card.offer);
            const linkedEventLabel = card.offer.event_title?.trim();
            return (
              <View key={card.offer.id} style={StyleSheet.flatten([styles.vehicleCard, clubSurfaceCard(tokens)])}>
                <View style={styles.vehicleHeader}>
                  <View style={styles.driverInfo}>
                    <View style={[styles.carIconBox, { backgroundColor: tokens.accentSoft }]}>
                      <Icon name="car" size={18} color={tokens.accent} />
                    </View>
                    <View style={styles.driverCopy}>
                      <ClubText variant="h3" numberOfLines={1}>
                        {card.offer.driver_name || 'Conducteur'}
                      </ClubText>
                      <ClubText variant="caption" muted numberOfLines={1}>
                        {card.vehicleLabel} · {card.dayLabel} · départ {card.timeLabel}
                      </ClubText>
                    </View>
                  </View>
                  <ClubStatusPill
                    label={
                      card.available > 0
                        ? `${card.available}/${card.totalSeats} libre${card.totalSeats > 1 ? 's' : ''}`
                        : 'Complet'
                    }
                    tone={card.available > 0 ? 'ok' : 'alert'}
                  />
                </View>

                <ClubText variant="body" numberOfLines={1}>
                  {card.title}
                </ClubText>

                <View style={[styles.routeBox, { backgroundColor: tokens.elevated }]}>
                  <View style={styles.routeItem}>
                    <Icon name="flag" size={13} color={tokens.accent} />
                    <ClubText variant="caption" numberOfLines={1} style={styles.routeDestination}>
                      Départ {card.timeLabel} : {card.meetupLabel}
                    </ClubText>
                  </View>
                  {card.destinationLabel !== 'Destination à préciser' ? (
                    <View style={styles.routeItem}>
                      <Icon name="location" size={13} color={tokens.accent} />
                      <ClubText variant="caption" numberOfLines={1} style={styles.routeDestination}>
                        {card.destinationLabel}
                      </ClubText>
                    </View>
                  ) : null}
                  {card.offer.notes?.trim() ? (
                    <View style={styles.routeItem}>
                      <Icon name="document" size={13} color={tokens.muted} />
                      <ClubText variant="caption" muted numberOfLines={2} style={styles.routeDestination}>
                        {card.offer.notes.trim()}
                      </ClubText>
                    </View>
                  ) : null}
                </View>

                {linkedEventLabel ? (
                  <PressableSpring
                    onPress={() => openLinkedEvent(card.offer.event_id ?? '')}
                    scaleTo={0.97}
                    haptic
                    style={styles.eventLink}
                  >
                    <Icon name="calendar" size={14} color={tokens.accent} />
                    <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }} numberOfLines={1}>
                      {linkedEventLabel}
                    </ClubText>
                    <Icon name="chevron-forward" size={12} color={tokens.accent} />
                  </PressableSpring>
                ) : null}

                {/* Passagers confirmés + capacité restante */}
                {card.confirmed > 0 ? (
                  <View style={styles.passengersSection}>
                    <ClubText variant="label" muted>
                      Passagers confirmés ({card.confirmed}/{card.totalSeats})
                    </ClubText>
                    <View style={styles.passengersWrap}>
                      {passengerNames(card.offer).map((p, idx) => (
                        <View key={`${card.offer.id}-p-${idx}`} style={[styles.passengerPill, { backgroundColor: tokens.elevated }]}>
                          <ClubText variant="caption">{p}</ClubText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Demandes en attente côté conducteur : accepter / refuser */}
                {driverControls && card.pending > 0 ? (
                  <ClubSectionCard title={`Demandes en attente (${card.pending})`}>
                    {(card.offer.passengers ?? [])
                      .filter((p) => isPassengerPending(p))
                      .map((p) => (
                        <View key={p.uid} style={styles.pendingRow}>
                          <ClubText variant="body" style={{ flex: 1 }} numberOfLines={1}>
                            {p.name}
                            {p.pickup_place?.trim() ? ` · récupère à ${p.pickup_place.trim()}` : ''}
                          </ClubText>
                          <ClubButton
                            label="Accepter"
                            icon="checkmark-circle"
                            variant="secondary"
                            onPress={() => handleRespond(card, p, true)}
                            disabled={busyId === card.offer.id || card.available <= 0}
                          />
                          <ClubButton
                            label="Refuser"
                            icon="close"
                            variant="outline"
                            onPress={() => handleRespond(card, p, false)}
                            disabled={busyId === card.offer.id}
                          />
                        </View>
                      ))}
                    {card.available <= 0 ? (
                      <ClubText variant="caption" muted>
                        Toutes les places sont confirmées — refusez ou annulez une réservation pour libérer une place.
                      </ClubText>
                    ) : null}
                  </ClubSectionCard>
                ) : null}

                {/* Mon statut passager */}
                {card.isPending ? (
                  <View style={[styles.myStatus, { backgroundColor: tokens.warningSoft }]}>
                    <Icon name="time" size={14} color={tokens.warning} />
                    <ClubText variant="caption" style={{ color: tokens.warning, fontWeight: '700' }}>
                      Demande envoyée — en attente de la réponse du conducteur.
                    </ClubText>
                  </View>
                ) : null}
                {card.isBooked && !driverControls ? (
                  <View style={[styles.myStatus, { backgroundColor: tokens.successSoft }]}>
                    <Icon name="checkmark-circle" size={14} color={tokens.success} />
                    <ClubText variant="caption" style={{ color: tokens.success, fontWeight: '700' }}>
                      Place confirmée chez {card.offer.driver_name}.
                    </ClubText>
                  </View>
                ) : null}

                <View style={[styles.vehicleFooter, { borderTopColor: tokens.border }]}>
                  {!card.isMine && card.offer.meeting_place?.trim() ? (
                    <PressableSpring
                      onPress={() => openGps(card.offer.meeting_place!)}
                      style={styles.gpsBtn}
                      scaleTo={0.96}
                    >
                      <Icon name="location" size={14} color={tokens.accent} />
                      <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
                        Itinéraire
                      </ClubText>
                    </PressableSpring>
                  ) : null}

                  {card.isBooked || card.isPending ? (
                    <ClubButton
                      label={card.isPending ? 'Retirer ma demande' : 'Annuler ma place'}
                      icon="close"
                      variant="outline"
                      onPress={() => handleCancelBooking(card)}
                      disabled={busyId === card.offer.id}
                    />
                  ) : requestable ? (
                    <ClubButton
                      label="Demander une place"
                      icon="handshake"
                      variant="primary"
                      onPress={() => void handleBook(card)}
                      disabled={busyId === card.offer.id}
                    />
                  ) : null}

                  {driverControls ? (
                    <ClubButton
                      label="Annuler le trajet"
                      icon="trash"
                      variant="outline"
                      onPress={() => handleCancelJourney(card)}
                      disabled={busyId === card.offer.id}
                    />
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>

      {proposeOpen ? (
        <CarpoolProposeModal
          profile={profile}
          clubId={clubId}
          onClose={() => setProposeOpen(false)}
          onSaved={() => {
            setProposeOpen(false);
            void loadOffers();
          }}
        />
      ) : null}
    </View>
  );
}

/** Modal de proposition — formulaire partagé Pôle Covoiturage. */
function CarpoolProposeModal({
  profile,
  clubId,
  onClose,
  onSaved,
}: {
  profile: User | null;
  clubId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  if (!profile) {
    return (
      <ClubEmptyState
        title="Connexion requise"
        body="Connectez-vous pour proposer un trajet réel — aucune offre simulée n’est créée."
        icon="lock"
      />
    );
  }
  return (
    <View style={styles.modalBackdrop}>
      <View style={[styles.modalSheet, { backgroundColor: tokens.raised }]}>
        <View style={styles.modalHeader}>
          <ClubText variant="h3">Proposer un trajet</ClubText>
          <PressableSpring onPress={onClose} scaleTo={0.94} hitSlop={8}>
            <Icon name="close" size={22} color={tokens.muted} />
          </PressableSpring>
        </View>
        <StandaloneCarpoolForm
          profile={{ ...profile, profile: { ...profile.profile, club_id: clubId ?? profile.profile.club_id } }}
          offer={null}
          expanded
          onToggle={onClose}
          onSaved={onSaved}
        />
      </View>
    </View>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    container: {
      gap: clubSpace.md,
    },
    summaryCard: {
      padding: clubSpace.lg,
      gap: clubSpace.sm,
    },
    summaryTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    list: { gap: clubSpace.md },
    vehicleCard: {
      padding: clubSpace.lg,
      gap: clubSpace.md,
    },
    vehicleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    driverInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubForm.rowGap,
      flex: 1,
      minWidth: 0,
    },
    carIconBox: {
      width: 38,
      height: 38,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    driverCopy: { flex: 1, minWidth: 0, gap: 2 },
    routeBox: {
      borderRadius: clubRadius.sm,
      padding: clubSpace.md,
      gap: 6,
    },
    routeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    routeDestination: { flex: 1 },
    eventLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 2,
    },
    passengersSection: { gap: clubSpace.xs },
    passengersWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    passengerPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: clubRadius.pill,
    },
    pendingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.xs,
      flexWrap: 'wrap',
    },
    myStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: clubSpace.md,
      borderRadius: clubRadius.sm,
    },
    vehicleFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
      paddingTop: clubSpace.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      flexWrap: 'wrap',
    },
    gpsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
    },
    modalBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.72)',
      justifyContent: 'flex-end',
      zIndex: 20,
    },
    modalSheet: {
      maxHeight: '88%',
      borderTopLeftRadius: clubRadius.xxl,
      borderTopRightRadius: clubRadius.xxl,
      padding: clubSpace.lg,
      paddingBottom: clubSpace.xxl,
      gap: clubSpace.sm,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
  });
}
