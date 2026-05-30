import React, { useEffect, useMemo, useState } from 'react';
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
  carpoolSlotForDriver,
  isCarpoolDriver,
  totalCarpoolSeats,
} from '../../utils/carpoolBalance';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

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
  const canManage = isStaff || profile.uid === event.organizer_uid;
  const candidateUids = useMemo(
    () => [...new Set([...event.invitee_uids, profile.uid])],
    [event.invitee_uids, profile.uid]
  );

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
      Alert.alert('Enregistré', 'Vos infos de covoiturage sont visibles par l’équipe.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
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

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Icon name="people" size={20} color={colors.accent} />
        <Text style={styles.title}>Covoiturage</Text>
      </View>
      <Text style={styles.sub}>
        Le coach désigne les chauffeurs ; l’équipe précise places et point de rendez-vous.
      </Text>

      {canManage ? (
        <>
          {!pickMode ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setPickMode(true)}>
              <Text style={styles.primaryBtnText}>
                {slots.length > 0 ? 'Modifier les chauffeurs' : 'Assigner des chauffeurs'}
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
        </>
      ) : null}

      {slots.length > 0 ? (
        <View style={styles.slotsBox}>
          <Text style={styles.slotsTitle}>
            Chauffeurs · {seatTotal > 0 ? `${seatTotal} place(s) déclarée(s)` : 'places à préciser'}
          </Text>
          {slots.map((slot) => (
            <View key={slot.driver_uid} style={styles.slotCard}>
              <Text style={styles.slotName}>{slot.driver_name}</Text>
              {slot.seats != null ? (
                <Text style={styles.slotLine}>{slot.seats} place(s) disponible(s)</Text>
              ) : (
                <Text style={styles.slotMuted}>Places non renseignées</Text>
              )}
              {slot.meeting_time || slot.meeting_place ? (
                <Text style={styles.slotLine}>
                  RDV {slot.meeting_time ?? '—'}
                  {slot.meeting_place ? ` · ${slot.meeting_place}` : ''}
                </Text>
              ) : null}
              {slot.notes ? <Text style={styles.slotNotes}>{slot.notes}</Text> : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.empty}>Aucun chauffeur désigné pour cet événement.</Text>
      )}

      {isDriver && mySlot ? (
        <View style={styles.driverForm}>
          <Text style={styles.formTitle}>Votre véhicule</Text>
          <TextInput
            style={styles.input}
            placeholder="Nombre de places (ex. 3)"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={editSeats}
            onChangeText={setEditSeats}
          />
          <TextInput
            style={styles.input}
            placeholder="Heure RDV (ex. 13:00)"
            placeholderTextColor={colors.textMuted}
            value={editTime}
            onChangeText={setEditTime}
          />
          <TextInput
            style={styles.input}
            placeholder="Lieu RDV (ex. parking du club)"
            placeholderTextColor={colors.textMuted}
            value={editPlace}
            onChangeText={setEditPlace}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Notes (ex. siège enfant, retour direct…)"
            placeholderTextColor={colors.textMuted}
            value={editNotes}
            onChangeText={setEditNotes}
            multiline
          />
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => void saveMySlot()}
            disabled={saving}
          >
            <Text style={styles.primaryBtnText}>Enregistrer mes infos</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.forum}>
        <Text style={styles.formTitle}>Coordination équipe</Text>
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
          placeholderTextColor={colors.textMuted}
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

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  title: { fontSize: 16, fontWeight: '900', color: colors.text },
  sub: { fontSize: 12, lineHeight: 18, color: colors.textMuted, marginBottom: spacing.md },
  primaryBtn: {
    backgroundColor: colors.accent,
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
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  secondaryBtnText: { fontWeight: '800', color: colors.text, fontSize: 13 },
  pickBox: { marginBottom: spacing.md },
  pickLabel: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, marginBottom: spacing.sm },
  pickList: { maxHeight: 160, marginBottom: spacing.sm },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  pickRowActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  pickName: { fontWeight: '700', color: colors.text },
  pickCheck: { fontWeight: '900', color: colors.accent },
  pickActions: { flexDirection: 'row', gap: spacing.sm },
  pickSaveBtn: { flex: 1 },
  slotsBox: { marginTop: spacing.sm },
  slotsTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  slotCard: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotName: { fontWeight: '900', color: colors.text },
  slotLine: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  slotMuted: { fontSize: 12, color: colors.textMuted, fontStyle: 'italic', marginTop: 2 },
  slotNotes: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  empty: { fontSize: 13, color: colors.textMuted, fontStyle: 'italic' },
  driverForm: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  formTitle: { fontSize: 13, fontWeight: '900', color: colors.text, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputMultiline: { minHeight: 64, textAlignVertical: 'top' },
  forum: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  msgRow: { marginBottom: spacing.sm },
  msgAuthor: { fontSize: 12, fontWeight: '800', color: colors.accent },
  msgBody: { fontSize: 14, color: colors.text, marginTop: 2 },
  msgTime: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
