import React, { useEffect, useMemo, useState } from 'react';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
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
import { spacing, radius } from '../../theme/designTokens';

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
  const styles = useMemo(() => createStyles(c), [c]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [messageDraft, setMessageDraft] = useState('');
  const [editSeats, setEditSeats] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPlace, setEditPlace] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const slots = event.carpool_slots ?? [];
  const mySlot = carpoolSlotForDriver(event, profile.uid);
  const isDriver = isCarpoolDriver(event, profile.uid);
  const myBooking = findCarpoolBooking(event, profile.uid);
  const canManage = isStaff || profile.uid === event.organizer_uid;
  const canParticipate =
    profile.uid === event.organizer_uid || event.invitee_uids.includes(profile.uid);
  const candidateUids = useMemo(
    () => [...new Set([...event.invitee_uids, event.organizer_uid, profile.uid])],
    [event.invitee_uids, event.organizer_uid, profile.uid]
  );

  const destination = [event.location_label, event.city].filter(Boolean).join(' · ');

  useEffect(() => {
    void (async () => {
      const map: Record<string, string> = {};
      for (const uid of candidateUids) {
        const u = await usersService.getById(uid);
        map[uid] = u?.display_name ?? uid.slice(0, 8);
      }
      setNames(map);
    })();
  }, [candidateUids]);

  useEffect(() => {
    if (mySlot) {
      setEditSeats(mySlot.seats != null ? String(mySlot.seats) : '');
      setEditTime(mySlot.meeting_time ?? '');
      setEditPlace(mySlot.meeting_place ?? '');
      setEditNotes(mySlot.notes ?? '');
    }
  }, [mySlot?.driver_uid, mySlot?.seats, mySlot?.meeting_time, mySlot?.meeting_place, mySlot?.notes]);

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
      await teamEventsService.setCarpoolDrivers(event.id, drivers);
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
        meeting_time: editTime.trim() || undefined,
        meeting_place: editPlace.trim() || undefined,
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
    setSaving(true);
    try {
      await teamEventsService.requestCarpoolSeat(
        event.id,
        driverUid,
        profile.uid,
        profile.display_name
      );
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

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Icon name="walk" size={20} color={c.accent} />
        <Text style={styles.title}>Covoiturage équipe</Text>
      </View>
      <Text style={styles.sub}>
        Comme BlaBlaCar : proposez un trajet ou réservez une place chez un coéquipier ou votre
        coach.
      </Text>

      {canParticipate && !isDriver ? (
        <TouchableOpacity
          style={styles.offerBtn}
          onPress={() => void volunteerAsDriver()}
          disabled={saving}
        >
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.offerBtnText}>Je peux emmener des coéquipiers</Text>
        </TouchableOpacity>
      ) : null}

      {myBooking && myBooking.driverUid !== profile.uid ? (
        <View style={styles.bookingBanner}>
          <Icon name="checkmark-circle" size={18} color={c.accent} />
          <Text style={styles.bookingBannerText}>
            Vous montez avec {myBooking.slot.driver_name}
          </Text>
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
          {slots.map((slot) => {
            const available = carpoolAvailableSeats(slot);
            const bookedHere = isCarpoolPassenger(slot, profile.uid);
            const isMine = slot.driver_uid === profile.uid;
            const canBook =
              canParticipate &&
              !isMine &&
              !myBooking &&
              (available === null || available > 0);

            return (
              <View key={slot.driver_uid} style={styles.rideCard}>
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

                {slot.meeting_time ? (
                  <Text style={styles.slotLine}>Départ {slot.meeting_time}</Text>
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
                  <Text style={styles.passengersLine}>
                    Passagers : {(slot.passengers ?? []).map((p) => p.name).join(', ')}
                  </Text>
                ) : null}

                {slot.notes ? <Text style={styles.slotNotes}>{slot.notes}</Text> : null}

                {bookedHere ? (
                  <TouchableOpacity
                    style={styles.cancelBookBtn}
                    onPress={() => void cancelBooking(slot.driver_uid)}
                    disabled={saving}
                  >
                    <Text style={styles.cancelBookText}>Annuler ma réservation</Text>
                  </TouchableOpacity>
                ) : canBook ? (
                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => void bookSeat(slot.driver_uid)}
                    disabled={saving}
                  >
                    <Text style={styles.bookBtnText}>Réserver une place</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={styles.empty}>
          Aucun trajet pour l’instant — proposez le vôtre ou attendez les coéquipiers.
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
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Infos utiles (sièges enfants, retour direct…)"
            placeholderTextColor={c.textMuted}
            value={editNotes}
            onChangeText={setEditNotes}
            multiline
          />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => void saveMySlot()}
            disabled={saving}
          >
            <Text style={styles.primaryBtnText}>Publier mon trajet</Text>
          </TouchableOpacity>
          {mySlot.volunteered ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => void withdrawOffer()}
              disabled={saving}
            >
              <Text style={styles.secondaryBtnText}>Retirer ma proposition</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {canManage ? (
        <View style={styles.staffBox}>
          <Text style={styles.staffTitle}>Staff — assignation rapide</Text>
          {!pickMode ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPickMode(true)}>
              <Text style={styles.secondaryBtnText}>
                {slots.length > 0 ? 'Modifier les chauffeurs assignés' : 'Assigner des chauffeurs'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pickBox}>
              <Text style={styles.pickLabel}>Sélectionnez les conducteurs</Text>
              <ScrollView style={styles.pickList} nestedScrollEnabled>
                {candidateUids.map((uid) => (
                  <TouchableOpacity
                    key={uid}
                    style={[styles.pickRow, selectedUids.has(uid) && styles.pickRowActive]}
                    onPress={() => togglePick(uid)}
                  >
                    <Text style={styles.pickName}>{names[uid] ?? '…'}</Text>
                    <Text style={styles.pickCheck}>{selectedUids.has(uid) ? '✓' : ''}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.pickActions}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setPickMode(false)}>
                  <Text style={styles.secondaryBtnText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, styles.pickSaveBtn]}
                  onPress={() => void saveDrivers()}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Valider</Text>
                  )}
                </TouchableOpacity>
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
          (event.carpool_messages ?? []).map((m) => (
            <View key={m.id} style={styles.msgRow}>
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
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => void postMessage()}
          disabled={saving || !messageDraft.trim()}
        >
          <Text style={styles.secondaryBtnText}>Publier</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: c.ink,
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
  slotNotes: { fontSize: 12, color: c.textMuted, marginTop: 4 },
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
  });
}
