import React, { useEffect, useMemo, useState } from 'react';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import type { TeamEvent } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import { usersService } from '../../services/users.service';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  carpoolAvailableSeats,
  carpoolSlotForDriver,
  findCarpoolBooking,
  isCarpoolDriver,
  isCarpoolPassenger,
  totalCarpoolAvailableSeats,
  totalCarpoolSeats,
} from '../../utils/carpoolBalance';
import { Icon } from '../ui/Icon';
import { CarpoolLocationCapture } from '../carpool/CarpoolLocationCapture';
import { CarpoolVehicleTypePicker } from '../carpool/CarpoolVehicleTypePicker';
import type { CarpoolVehicleType } from '../../models/CarpoolVehicle';
import { defaultSeatsForVehicleType } from '../../models/CarpoolVehicle';
import { CarpoolLiveTripPanel } from '../carpool/CarpoolLiveTripPanel';
import { openMapsAt } from '../../utils/geoLocation';
import { pickupDistanceFromMeeting } from '../../utils/carpoolGeo';
import {
  eventTripId,
  slotTripStatus,
} from '../../utils/carpoolLiveTrip';
import { spacing, radius } from '../../theme/designTokens';
import { useTranslation } from '../../context/LocaleContext';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { transportLogisticsService } from '../../services/transportLogistics.service';
import { TransportModeSelector } from '../transport/TransportModeSelector';
import { ClubBusCard } from '../transport/ClubBusCard';
import { AddBusModal } from '../transport/AddBusModal';
import { PassengerTransportTicket } from '../transport/PassengerTransportTicket';

interface EventCarpoolPanelProps {
  event: TeamEvent;
  profile: User;
  isStaff: boolean;
  onUpdated: () => void;
}

export const EventCarpoolPanel: React.FC<EventCarpoolPanelProps> = ({
  event,
  profile,
  isStaff,
  onUpdated,
}) => {
  const { colors: c } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(c), [c]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [messageDraft, setMessageDraft] = useState('');
  const [editSeats, setEditSeats] = useState(String(defaultSeatsForVehicleType('berline')));
  const [editVehicleType, setEditVehicleType] = useState<CarpoolVehicleType | undefined>('berline');
  const [editTime, setEditTime] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [editMeetingLocation, setEditMeetingLocation] = useState<
    import('../../models/User').GeoPoint | undefined
  >();
  const [editNotes, setEditNotes] = useState('');
  const [pickupPlace, setPickupPlace] = useState('');
  const [pickupLocation, setPickupLocation] = useState<
    import('../../models/User').GeoPoint | undefined
  >();

  const slots = event.carpool_slots ?? [];
  const mySlot = carpoolSlotForDriver(event, profile.uid);
  const isDriver = isCarpoolDriver(event, profile.uid);
  const myBooking = findCarpoolBooking(event, profile.uid);
  const canManage = isStaff || profile.uid === event.organizer_uid;
  const canParticipate =
    profile.uid === event.organizer_uid || event.invitee_uids.includes(profile.uid);

  const transportPlan = useMemo(
    () => transportLogisticsService.resolveTransportPlan(event),
    [event]
  );
  const userTransportSummary = useMemo(
    () => transportLogisticsService.getPassengerTransportSummary(event, profile.uid),
    [event, profile.uid]
  );
  const [addBusModalOpen, setAddBusModalOpen] = useState(false);

  const isIndependent = Boolean(
    transportPlan.independent_traveler_uids?.includes(profile.uid)
  );

  const toggleIndependent = async () => {
    setSaving(true);
    try {
      await transportLogisticsService.setIndependentTravel(
        event.id,
        profile.uid,
        !isIndependent
      );
      onUpdated();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const applyEditVehicleType = (type: CarpoolVehicleType) => {
    const taken = mySlot?.passengers?.length ?? 0;
    setEditVehicleType(type);
    setEditSeats(String(defaultSeatsForVehicleType(type, taken)));
  };

  const candidateUids = useMemo(
    () => [...new Set([...event.invitee_uids, event.organizer_uid, profile.uid])],
    [event.invitee_uids, event.organizer_uid, profile.uid]
  );

  const destination = [event.location_label, event.city].filter(Boolean).join(' · ');

  useEffect(() => {
    void (async () => {
      const map: Record<string, string> = {};
      for (const uid of candidateUids) {
        const u = await usersService.getPublicById(uid);
        map[uid] = u?.display_name ?? uid.slice(0, 8);
      }
      setNames(map);
    })();
  }, [candidateUids]);

  useEffect(() => {
    if (mySlot) {
      setEditSeats(mySlot.seats != null ? String(mySlot.seats) : '');
      setEditVehicleType(mySlot.vehicle_type ?? 'berline');
      setEditTime(mySlot.meeting_time ?? '');
      setEditPlace(mySlot.meeting_place ?? '');
      setEditMeetingLocation(mySlot.meeting_location);
      setEditNotes(mySlot.notes ?? '');
    }
  }, [
    mySlot?.driver_uid,
    mySlot?.seats,
    mySlot?.vehicle_type,
    mySlot?.meeting_time,
    mySlot?.meeting_place,
    mySlot?.meeting_location,
    mySlot?.notes,
  ]);

  useEffect(() => {
    if (!myBooking) {
      setPickupPlace('');
      setPickupLocation(undefined);
      return;
    }
    const passenger = (myBooking.slot.passengers ?? []).find((p) => p.uid === profile.uid);
    setPickupPlace(passenger?.pickup_place ?? '');
    setPickupLocation(passenger?.pickup_location);
  }, [myBooking?.driverUid, myBooking?.slot.passengers, profile.uid]);

  useEffect(() => {
    setSelectedUids(new Set(slots.map((s) => s.driver_uid)));
  }, [event.id, slots.length]);

  const togglePick = (uid: string) => {
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const saveDrivers = async () => {
    setSaving(true);
    try {
      const drivers = [...selectedUids].map((uid) => ({
        uid,
        name: names[uid] ?? uid.slice(0, 8),
      }));
      await teamEventsService.setCarpoolDrivers(event.id, drivers, { user: profile });
      setPickMode(false);
      onUpdated();
      Alert.alert(
        'Chauffeurs désignés',
        drivers.length > 0
          ? 'Les conducteurs recevront une notification push.'
          : 'Aucun chauffeur assigné.'
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Assignation impossible.');
    } finally {
      setSaving(false);
    }
  };

  const volunteerAsDriver = async () => {
    setSaving(true);
    try {
      await teamEventsService.volunteerAsCarpoolDriver(
        event.id,
        profile.uid,
        profile.display_name
      );
      onUpdated();
      Alert.alert(
        'Trajet proposé',
        'Indiquez vos places et le point de rendez-vous pour que l’équipe puisse réserver.'
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Proposition impossible.');
    } finally {
      setSaving(false);
    }
  };

  const withdrawOffer = async () => {
    Alert.alert(
      'Retirer votre trajet ?',
      'Les réservations sur votre véhicule seront annulées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setSaving(true);
              try {
                await teamEventsService.withdrawCarpoolOffer(event.id, profile.uid);
                onUpdated();
              } catch (e) {
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Retrait impossible.');
              } finally {
                setSaving(false);
              }
            })();
          },
        },
      ]
    );
  };

  const saveMySlot = async () => {
    setSaving(true);
    try {
      const seats = editSeats.trim() ? parseInt(editSeats, 10) : undefined;
      if (editSeats.trim() && (!Number.isFinite(seats) || (seats ?? 0) < 1)) {
        throw new Error('Indiquez un nombre de places valide.');
      }
      await teamEventsService.updateCarpoolSlot(event.id, profile.uid, {
        seats,
        vehicle_type: editVehicleType,
        meeting_time: editTime.trim() || undefined,
        meeting_place: editPlace.trim() || undefined,
        meeting_location: editMeetingLocation,
        notes: editNotes.trim() || undefined,
      });
      onUpdated();
      Alert.alert('Enregistré', 'Votre trajet est visible par l’équipe.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
    } finally {
      setSaving(false);
    }
  };

  const bookSeat = async (driverUid: string) => {
    if (!pickupPlace.trim() && !pickupLocation) {
      Alert.alert(
        'Point de prise en charge',
        'Indiquez où vous souhaitez être récupéré(e). Adresse ou position GPS.'
      );
      return;
    }
    setSaving(true);
    try {
      await teamEventsService.requestCarpoolSeat(
        event.id,
        driverUid,
        profile.uid,
        profile.display_name,
        {
          pickup_place: pickupPlace.trim() || undefined,
          pickup_location: pickupLocation,
        }
      );
      prodayHaptics.carpoolBook();
      onUpdated();
      Alert.alert('Place réservée', 'Le conducteur est notifié dans le fil de coordination.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Réservation impossible.');
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async (driverUid: string) => {
    setSaving(true);
    try {
      await teamEventsService.cancelCarpoolSeat(event.id, driverUid, profile.uid);
      onUpdated();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Annulation impossible.');
    } finally {
      setSaving(false);
    }
  };

  const postMessage = async () => {
    if (!messageDraft.trim()) return;
    setSaving(true);
    try {
      await teamEventsService.addCarpoolMessage(
        event.id,
        profile.uid,
        profile.display_name,
        messageDraft
      );
      setMessageDraft('');
      onUpdated();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Envoi impossible.');
    } finally {
      setSaving(false);
    }
  };

  const seatTotal = totalCarpoolSeats(slots);
  const availableTotal = totalCarpoolAvailableSeats(slots);

  const showCarpool =
    transportPlan.mode === 'carpool_only' ||
    transportPlan.mode === 'mixed' ||
    slots.length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Icon name="bus" size={20} color={c.accent} />
        <Text style={styles.title}>Transport & Logistique</Text>
      </View>
      <Text style={styles.sub}>
        Déplacements de l'équipe : bus du club, covoiturage entre coéquipiers ou déplacement individuel.
      </Text>

      {canManage && (
        <TransportModeSelector
          currentMode={transportPlan.mode}
          eventId={event.id}
          editorUid={profile.uid}
          onUpdated={onUpdated}
        />
      )}

      {/* Titre de transport / Pass personnel */}
      <PassengerTransportTicket
        summary={userTransportSummary}
        eventTitle={event.title}
        eventDate={event.date ? String(event.date) : event.city}
        onDeclareIndependent={toggleIndependent}
      />

      {/* Déclaration déplacement autonome */}
      <PressableSpring
        style={[styles.independentBtn, isIndependent && styles.independentBtnActive]}
        onPress={toggleIndependent}
        disabled={saving}
        scaleTo={0.96}
        haptic
      >
        <Icon name="person" size={16} color={isIndependent ? '#38BDF8' : c.textMuted} />
        <Text style={[styles.independentBtnText, isIndependent && styles.independentBtnTextActive]}>
          {isIndependent
            ? '✓ Déplacement individuel enregistré (par vos propres moyens)'
            : 'Je me déplace par mes propres moyens'}
        </Text>
      </PressableSpring>

      {/* Section Déplacement Individuel si mode actif */}
      {transportPlan.mode === 'individual' && (
        <View style={styles.individualBanner}>
          <Icon name="person" size={22} color="#94A3B8" />
          <View style={styles.individualBannerText}>
            <Text style={styles.individualBannerTitle}>Déplacement individuel</Text>
            <Text style={styles.individualBannerSub}>
              Le club n'organise pas de transport collectif pour cet événement. Chaque participant se rend directement sur place.
            </Text>
          </View>
        </View>
      )}

      {/* Section Bus Club */}
      {(transportPlan.mode === 'bus_only' ||
        transportPlan.mode === 'mixed' ||
        (transportPlan.buses && transportPlan.buses.length > 0)) && (
        <View style={styles.busSection}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Icon name="bus" size={18} color={c.accent} />
              <Text style={styles.sectionHeaderTitle}>Bus & Minibus du Club</Text>
            </View>
            {canManage && (
              <PressableSpring
                style={styles.addBusBtn}
                onPress={() => setAddBusModalOpen(true)}
                scaleTo={0.96}
                haptic
              >
                <Icon name="add" size={14} color="#0F172A" />
                <Text style={styles.addBusBtnText}>Ajouter un bus</Text>
              </PressableSpring>
            )}
          </View>

          {transportPlan.buses.length === 0 ? (
            <View style={styles.emptyBusBox}>
              <Text style={styles.emptyBusText}>
                Aucun bus ou navette n'a encore été configuré pour cet événement.
              </Text>
            </View>
          ) : (
            transportPlan.buses.map((bus) => (
              <ClubBusCard
                key={bus.id}
                bus={bus}
                eventId={event.id}
                currentUid={profile.uid}
                currentUserName={profile.display_name}
                isStaff={canManage}
                onUpdated={onUpdated}
              />
            ))
          )}
        </View>
      )}

      {/* Section Covoiturage */}
      {showCarpool && (
        <View style={styles.carpoolSectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Icon name="car" size={18} color={c.accent} />
              <Text style={styles.sectionHeaderTitle}>Covoiturage entre coéquipiers</Text>
            </View>
          </View>

      {canParticipate && !isDriver ? (
        <PressableSpring
          style={styles.offerBtn}
          onPress={() => void volunteerAsDriver()}
          disabled={saving}
          scaleTo={0.96}
          haptic
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.offerBtnText}>Je peux emmener des coéquipiers</Text>
        </PressableSpring>
      ) : null}

      {myBooking && myBooking.driverUid !== profile.uid ? (
        <View style={styles.bookingBanner}>
          <Icon name="checkmark-circle" size={18} color={c.accent} />
          <Text style={styles.bookingBannerText}>
            Vous montez avec {myBooking.slot.driver_name}
          </Text>
          <CarpoolLocationCapture
            label="Votre point de prise en charge"
            place={pickupPlace}
            location={pickupLocation}
            onPlaceChange={setPickupPlace}
            onLocationChange={setPickupLocation}
            disabled={saving}
            compact
          />
          <PressableSpring
            style={styles.secondaryBtn}
            onPress={() => {
              void (async () => {
                if (!pickupPlace.trim() && !pickupLocation) {
                  Alert.alert('Prise en charge', 'Indiquez votre adresse ou position GPS.');
                  return;
                }
                setSaving(true);
                try {
                  await teamEventsService.updatePassengerPickup(
                    event.id,
                    myBooking.driverUid,
                    profile.uid,
                    {
                      pickup_place: pickupPlace.trim() || undefined,
                      pickup_location: pickupLocation,
                    }
                  );
                  onUpdated();
                  Alert.alert('Enregistré', 'Le conducteur voit votre point de prise en charge.');
                } catch (e) {
                  Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
                } finally {
                  setSaving(false);
                }
              })();
            }}
            disabled={saving}
            scaleTo={0.96}
            haptic
          >
            <Text style={styles.secondaryBtnText}>Mettre à jour ma position</Text>
          </PressableSpring>
          <CarpoolLiveTripPanel
            tripId={eventTripId(event.id, myBooking.driverUid)}
            viewerUid={profile.uid}
            driverUid={myBooking.driverUid}
            driverName={myBooking.slot.driver_name}
            passengers={myBooking.slot.passengers}
            tripStatus={slotTripStatus(myBooking.slot)}
            onStartTrip={() => teamEventsService.startCarpoolTrip(event.id, profile.uid)}
            onEndTrip={() => teamEventsService.endCarpoolTrip(event.id, profile.uid)}
            onTripChanged={onUpdated}
          />
        </View>
      ) : null}

      {slots.length > 0 ? (
        <View style={styles.slotsBox}>
          <Text style={styles.slotsTitle}>
            Trajets proposés
            {seatTotal > 0
              ? ` · ${availableTotal ?? seatTotal} place(s) dispo`
              : ' · places à préciser'}
          </Text>
          {slots.map((slot, slotIndex) => {
            const available = carpoolAvailableSeats(slot);
            const bookedHere = isCarpoolPassenger(slot, profile.uid);
            const isMine = slot.driver_uid === profile.uid;
            const canBook =
              canParticipate &&
              !isMine &&
              !myBooking &&
              (available === null || available > 0);

            return (
              <StaggerReveal key={slot.driver_uid} index={slotIndex} delayStep={50}>
              <View style={styles.rideCard}>
                <View style={styles.rideTop}>
                  <View style={styles.rideAvatar}>
                    <Icon name="person" size={18} color={c.ink} />
                  </View>
                  <View style={styles.rideMeta}>
                    <Text style={styles.slotName}>{slot.driver_name}</Text>
                    <Text style={styles.rideBadge}>
                      {slot.volunteered ? 'Proposition spontanée' : 'Assigné par le staff'}
                    </Text>
                  </View>
                </View>

                <View style={styles.routeRow}>
                  <Text style={styles.routeFrom}>
                    {slot.meeting_place?.trim() || 'Point RDV à préciser'}
                  </Text>
                  <Icon name="chevron-forward" size={14} color={c.textMuted} />
                  <Text style={styles.routeTo}>{destination || event.city}</Text>
                </View>
                {slot.meeting_location ? (
                  <PressableSpring
                    onPress={() => openMapsAt(slot.meeting_location!, slot.meeting_place)}
                    scaleTo={0.96}
                    haptic
                  >
                    <Text style={styles.mapLink}>Voir le RDV conducteur sur la carte</Text>
                  </PressableSpring>
                ) : null}

                {slot.meeting_time ? (
                  <Text style={styles.slotLine}>Départ {slot.meeting_time}</Text>
                ) : null}

                {slot.vehicle_type ? (
                  <Text style={styles.slotLine}>
                    {t('carpool.vehicle.label')} · {t(`carpool.vehicle.${slot.vehicle_type}`)}
                  </Text>
                ) : null}

                {slot.seats != null ? (
                  <Text style={styles.slotLine}>
                    {available === 0
                      ? 'Complet'
                      : `${available ?? slot.seats} place(s) restante(s) sur ${slot.seats}`}
                  </Text>
                ) : (
                  <Text style={styles.slotMuted}>Places non renseignées par le conducteur</Text>
                )}

                {(slot.passengers ?? []).length > 0 ? (
                  <View style={styles.passengersBox}>
                    <Text style={styles.passengersLine}>
                      Passagers : {(slot.passengers ?? []).map((p) => p.name).join(', ')}
                    </Text>
                    {(slot.passengers ?? []).map((p) => {
                      const dist = pickupDistanceFromMeeting(slot, p);
                      if (!p.pickup_place && !p.pickup_location) return null;
                      return (
                        <View key={p.uid} style={styles.pickupRow}>
                          <Text style={styles.pickupName}>
                            {p.name}. {p.pickup_place?.trim() || 'Position GPS'}
                            {dist ? ` · ${dist} du RDV` : ''}
                          </Text>
                          {p.pickup_location ? (
                            <PressableSpring
                              onPress={() => openMapsAt(p.pickup_location!, p.pickup_place)}
                              scaleTo={0.96}
                              haptic
                            >
                              <Text style={styles.mapLink}>Carte prise en charge</Text>
                            </PressableSpring>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : null}

                {slot.notes ? <Text style={styles.slotNotes}>{slot.notes}</Text> : null}

                {bookedHere ? (
                  <PressableSpring
                    style={styles.cancelBookBtn}
                    onPress={() => void cancelBooking(slot.driver_uid)}
                    disabled={saving}
                    scaleTo={0.96}
                    haptic
                  >
                    <Text style={styles.cancelBookText}>Annuler ma réservation</Text>
                  </PressableSpring>
                ) : canBook ? (
                  <View style={styles.bookBlock}>
                    <CarpoolLocationCapture
                      label="Où souhaitez-vous être récupéré(e) ?"
                      place={pickupPlace}
                      location={pickupLocation}
                      onPlaceChange={setPickupPlace}
                      onLocationChange={setPickupLocation}
                      disabled={saving}
                      compact
                    />
                    <PressableSpring
                      style={styles.bookBtn}
                      onPress={() => void bookSeat(slot.driver_uid)}
                      disabled={saving}
                      scaleTo={0.96}
                      haptic
                    >
                      <Text style={styles.bookBtnText}>Réserver une place</Text>
                    </PressableSpring>
                  </View>
                ) : null}
              </View>
              </StaggerReveal>
            );
          })}
        </View>
      ) : (
        <Text style={styles.empty}>
          Aucun trajet pour l’instant. Proposez le vôtre ou attendez les coéquipiers.
        </Text>
      )}

      {isDriver && mySlot ? (
        <View style={styles.driverForm}>
          <Text style={styles.formTitle}>Votre trajet</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de places (ex. 3)"
            placeholderTextColor={c.textMuted}
            keyboardType="number-pad"
            value={editSeats}
            onChangeText={setEditSeats}
          />
          <CarpoolVehicleTypePicker
            value={editVehicleType}
            onChange={applyEditVehicleType}
            disabled={saving}
          />
          <TextInput
            style={styles.input}
            placeholder="Heure de départ (ex. 13:00)"
            placeholderTextColor={c.textMuted}
            value={editTime}
            onChangeText={setEditTime}
          />
          <TextInput
            style={styles.input}
            placeholder="Point de rendez-vous (ex. parking du club)"
            placeholderTextColor={c.textMuted}
            value={editPlace}
            onChangeText={setEditPlace}
          />
          <CarpoolLocationCapture
            label="Position GPS du point de rendez-vous"
            place={editPlace}
            location={editMeetingLocation}
            onPlaceChange={setEditPlace}
            onLocationChange={setEditMeetingLocation}
            disabled={saving}
            compact
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Infos utiles (sièges enfants, retour direct…)"
            placeholderTextColor={c.textMuted}
            value={editNotes}
            onChangeText={setEditNotes}
            multiline
          />
          <PressableSpring
            style={styles.primaryBtn}
            onPress={() => void saveMySlot()}
            disabled={saving}
            scaleTo={0.96}
            haptic
          >
            <Text style={styles.primaryBtnText}>Publier mon trajet</Text>
          </PressableSpring>
          {mySlot.volunteered ? (
            <PressableSpring
              style={styles.secondaryBtn}
              onPress={() => void withdrawOffer()}
              disabled={saving}
              scaleTo={0.96}
              haptic
            >
              <Text style={styles.secondaryBtnText}>Retirer ma proposition</Text>
            </PressableSpring>
          ) : null}
          <CarpoolLiveTripPanel
            tripId={eventTripId(event.id, mySlot.driver_uid)}
            viewerUid={profile.uid}
            driverUid={mySlot.driver_uid}
            driverName={mySlot.driver_name}
            passengers={mySlot.passengers}
            tripStatus={slotTripStatus(mySlot)}
            onStartTrip={() => teamEventsService.startCarpoolTrip(event.id, profile.uid)}
            onEndTrip={() => teamEventsService.endCarpoolTrip(event.id, profile.uid)}
            onTripChanged={onUpdated}
          />
        </View>
      ) : null}

      {canManage ? (
        <View style={styles.staffBox}>
          <Text style={styles.staffTitle}>Staff. Assignation rapide</Text>
          {!pickMode ? (
            <PressableSpring
              style={styles.secondaryBtn}
              onPress={() => setPickMode(true)}
              scaleTo={0.96}
              haptic
            >
              <Text style={styles.secondaryBtnText}>
                {slots.length > 0 ? 'Modifier les chauffeurs assignés' : 'Assigner des chauffeurs'}
              </Text>
            </PressableSpring>
          ) : (
            <View style={styles.pickBox}>
              <Text style={styles.pickLabel}>Sélectionnez les conducteurs</Text>
              <ScrollView style={styles.pickList} nestedScrollEnabled>
                {candidateUids.map((uid, pickIndex) => (
                  <StaggerReveal key={uid} index={pickIndex} delayStep={35}>
                    <PressableSpring
                      style={[styles.pickRow, selectedUids.has(uid) && styles.pickRowActive]}
                      onPress={() => togglePick(uid)}
                      scaleTo={0.98}
                      haptic
                    >
                      <Text style={styles.pickName}>{names[uid] ?? '…'}</Text>
                      <Text style={styles.pickCheck}>{selectedUids.has(uid) ? '✓' : ''}</Text>
                    </PressableSpring>
                  </StaggerReveal>
                ))}
              </ScrollView>
              <View style={styles.pickActions}>
                <PressableSpring
                  style={styles.secondaryBtn}
                  onPress={() => setPickMode(false)}
                  scaleTo={0.96}
                  haptic
                >
                  <Text style={styles.secondaryBtnText}>Annuler</Text>
                </PressableSpring>
                <PressableSpring
                  style={[styles.primaryBtn, styles.pickSaveBtn]}
                  onPress={() => void saveDrivers()}
                  disabled={saving}
                  scaleTo={0.96}
                  haptic
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Valider</Text>
                  )}
                </PressableSpring>
              </View>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.forum}>
        <Text style={styles.formTitle}>Coordination</Text>
        {(event.carpool_messages ?? []).length === 0 ? (
          <Text style={styles.slotMuted}>
            Précisez ici le RDV, les places restantes ou qui monte dans quelle voiture.
          </Text>
        ) : (
          (event.carpool_messages ?? []).map((m, msgIndex) => (
            <StaggerReveal key={m.id} index={msgIndex} delayStep={40}>
              <View style={styles.msgRow}>
                <Text style={styles.msgAuthor}>{m.author_name}</Text>
                <Text style={styles.msgBody}>{m.body}</Text>
                <Text style={styles.msgTime}>
                  {m.created_at.toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </StaggerReveal>
          ))
        )}
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          placeholder="Message pour l’équipe…"
          placeholderTextColor={c.textMuted}
          value={messageDraft}
          onChangeText={setMessageDraft}
          multiline
        />
        <PressableSpring
          style={styles.secondaryBtn}
          onPress={() => void postMessage()}
          disabled={saving || !messageDraft.trim()}
          scaleTo={0.96}
          haptic
        >
          <Text style={styles.secondaryBtnText}>Publier</Text>
        </PressableSpring>
      </View>
      </View>
      )}

      {addBusModalOpen && (
        <AddBusModal
          visible={addBusModalOpen}
          eventId={event.id}
          defaultDeparturePlace={event.club_name ? `Stade ${event.club_name}` : 'Stade du club'}
          defaultArrivalPlace={[event.location_label, event.city].filter(Boolean).join(' · ')}
          editorUid={profile.uid}
          editorName={profile.display_name}
          onClose={() => setAddBusModalOpen(false)}
          onAdded={onUpdated}
        />
      )}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  title: { fontSize: 16, fontWeight: '900', color: c.text },
  sub: { fontSize: 12, lineHeight: 18, color: c.textMuted, marginBottom: spacing.md },
  offerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: c.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  offerBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  bookingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: c.accentSoft,
    borderWidth: 1,
    borderColor: c.accentMuted,
  },
  bookingBannerText: { flex: 1, fontSize: 13, fontWeight: '700', color: c.text },
  primaryBtn: {
    backgroundColor: c.accent,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  primaryBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  secondaryBtn: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.background,
    marginBottom: spacing.sm,
  },
  secondaryBtnText: { fontWeight: '800', color: c.text, fontSize: 13 },
  pickBox: { marginBottom: spacing.md },
  pickLabel: { fontSize: 12, fontWeight: '800', color: c.textSecondary, marginBottom: spacing.sm },
  pickList: { maxHeight: 160, marginBottom: spacing.sm },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 4,
  },
  pickRowActive: { borderColor: c.accent, backgroundColor: c.accentSoft },
  pickName: { fontWeight: '700', color: c.text },
  pickCheck: { fontWeight: '900', color: c.accent },
  pickActions: { flexDirection: 'row', gap: spacing.sm },
  pickSaveBtn: { flex: 1 },
  slotsBox: { marginTop: spacing.xs },
  slotsTitle: { fontSize: 13, fontWeight: '800', color: c.text, marginBottom: spacing.sm },
  rideCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: c.background,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
  },
  rideTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  rideAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rideMeta: { flex: 1 },
  slotName: { fontWeight: '900', color: c.text, fontSize: 15 },
  rideBadge: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  routeFrom: { fontSize: 13, fontWeight: '700', color: c.textSecondary, flexShrink: 1 },
  routeTo: { fontSize: 13, fontWeight: '700', color: c.text, flexShrink: 1 },
  slotLine: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  slotMuted: { fontSize: 12, color: c.textMuted, fontStyle: 'italic', marginTop: 2 },
  passengersLine: { fontSize: 12, color: c.accent, fontWeight: '700', marginTop: spacing.xs },
  passengersBox: { marginTop: spacing.xs, gap: 4 },
  pickupRow: { marginTop: 2 },
  pickupName: { fontSize: 11, color: c.textSecondary },
  mapLink: { fontSize: 11, fontWeight: '700', color: c.accent, marginTop: 2 },
  slotNotes: { fontSize: 12, color: c.textMuted, marginTop: 4 },
  bookBlock: { marginTop: spacing.sm, gap: spacing.xs },
  bookBtn: {
    marginTop: spacing.sm,
    backgroundColor: c.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  bookBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  cancelBookBtn: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  cancelBookText: { fontWeight: '800', color: c.textSecondary, fontSize: 13 },
  empty: { fontSize: 13, color: c.textMuted, fontStyle: 'italic' },
  driverForm: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  staffBox: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  staffTitle: { fontSize: 12, fontWeight: '800', color: c.textMuted, marginBottom: spacing.sm },
  formTitle: { fontSize: 13, fontWeight: '900', color: c.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 14,
    color: c.text,
    marginBottom: spacing.sm,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  forum: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  msgRow: { marginBottom: spacing.sm },
  msgAuthor: { fontSize: 12, fontWeight: '800', color: c.accent },
  msgBody: { fontSize: 14, color: c.text, marginTop: 2 },
  msgTime: { fontSize: 10, color: c.textMuted, marginTop: 2 },
  independentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  independentBtnActive: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  independentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
  },
  independentBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  individualBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
    padding: 14,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  individualBannerText: {
    flex: 1,
  },
  individualBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  individualBannerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16,
  },
  busSection: {
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: c.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  addBusBtnText: {
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyBusBox: {
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: 16,
    alignItems: 'center',
  },
  emptyBusText: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'center',
  },
  carpoolSectionWrap: {
    marginTop: spacing.xs,
  },
  });
}
