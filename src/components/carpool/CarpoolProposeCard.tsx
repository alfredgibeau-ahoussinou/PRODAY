import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import type { GeoPoint } from '../../models/User';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { carpoolSlotForDriver } from '../../utils/carpoolBalance';
import { teamEventsService } from '../../services/teamEvents.service';
import { CarpoolLocationCapture } from './CarpoolLocationCapture';
import { openMapsAt } from '../../utils/geoLocation';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface CarpoolProposeCardProps {
  event: TeamEvent;
  profile: User;
  expanded: boolean;
  onToggle: () => void;
  onPublished: () => void;
  onOpenDetail: () => void;
}

export const CarpoolProposeCard: React.FC<CarpoolProposeCardProps> = ({
  event,
  profile,
  expanded,
  onToggle,
  onPublished,
  onOpenDetail,
}) => {
  const { colors } = useAppTheme();
  const slot = carpoolSlotForDriver(event, profile.uid);
  const isEditing = Boolean(slot);

  const [seats, setSeats] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingPlace, setMeetingPlace] = useState('');
  const [meetingLocation, setMeetingLocation] = useState<GeoPoint | undefined>();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setSeats(slot?.seats != null ? String(slot.seats) : '');
    setMeetingTime(slot?.meeting_time ?? '');
    setMeetingPlace(slot?.meeting_place ?? '');
    setMeetingLocation(slot?.meeting_location);
    setNotes(slot?.notes ?? '');
  }, [expanded, slot?.driver_uid, slot?.seats, slot?.meeting_time, slot?.meeting_place, slot?.meeting_location, slot?.notes]);

  const destination = [event.location_label, event.city].filter(Boolean).join(' · ');

  const publish = async () => {
    const seatsNum = seats.trim() ? parseInt(seats, 10) : undefined;
    if (!seats.trim() || !Number.isFinite(seatsNum) || (seatsNum ?? 0) < 1) {
      Alert.alert('Places', 'Indiquez le nombre de places disponibles dans votre véhicule.');
      return;
    }
    if (!meetingPlace.trim() && !meetingLocation) {
      Alert.alert('Point de rendez-vous', 'Indiquez où vous récupérez vos coéquipiers.');
      return;
    }

    setSaving(true);
    try {
      await teamEventsService.proposeOrUpdateCarpoolRide(
        event.id,
        profile.uid,
        profile.display_name,
        {
          seats: seatsNum,
          meeting_time: meetingTime.trim() || undefined,
          meeting_place: meetingPlace.trim() || undefined,
          meeting_location: meetingLocation,
          notes: notes.trim() || undefined,
        }
      );
      prodayHaptics.carpoolBook();
      onPublished();
      Alert.alert(
        isEditing ? 'Trajet mis à jour' : 'Trajet publié',
        'Votre proposition est visible par l’équipe convoquée.'
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setSaving(false);
    }
  };

  const withdraw = () => {
    if (!slot?.volunteered) {
      Alert.alert(
        'Trajet assigné',
        'Ce trajet a été assigné par le staff — contactez votre coach pour le modifier.'
      );
      return;
    }
    Alert.alert('Retirer votre trajet ?', 'Les réservations sur votre véhicule seront annulées.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Retirer',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            try {
              await teamEventsService.withdrawCarpoolOffer(event.id, profile.uid);
              onPublished();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Retrait impossible.');
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <ProDaySurface
      variant="module"
      style={[styles.card, { borderColor: colors.border }, shadows.soft]}
    >
      <PressableSpring style={styles.header} onPress={onToggle} scaleTo={0.98} haptic>
        <View style={styles.headerCopy}>
          <View style={[styles.kindPill, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.kindText}>
              {EVENT_TYPE_LABELS[event.event_type]}
            </ProDayText>
          </View>
          <ProDayText variant="section">{event.title}</ProDayText>
          <ProDayText variant="caption" muted>
            {formatCalendarDate(event.starts_at)} · {destination || event.city}
          </ProDayText>
          {isEditing ? (
            <ProDayText variant="caption" accent style={styles.liveBadge}>
              Trajet actif — {slot?.seats ?? '?'} place(s)
            </ProDayText>
          ) : null}
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </PressableSpring>

      {expanded ? (
        <View style={styles.form}>
          <ProDayText variant="caption" muted style={styles.formLead}>
            Destination : {destination || event.city}
          </ProDayText>

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder="Nombre de places (ex. 3)"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={seats}
            onChangeText={setSeats}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder="Heure de départ (ex. 13:00)"
            placeholderTextColor={colors.textMuted}
            value={meetingTime}
            onChangeText={setMeetingTime}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder="Point de rendez-vous (ex. parking du club)"
            placeholderTextColor={colors.textMuted}
            value={meetingPlace}
            onChangeText={setMeetingPlace}
          />
          <CarpoolLocationCapture
            label="Position GPS du point de rendez-vous"
            place={meetingPlace}
            location={meetingLocation}
            onPlaceChange={setMeetingPlace}
            onLocationChange={setMeetingLocation}
            disabled={saving}
            compact
          />

          {slot?.meeting_location ? (
            <PressableSpring onPress={() => openMapsAt(slot.meeting_location!, slot.meeting_place)} scaleTo={0.96} haptic>
              <ProDayText variant="caption" accent style={styles.mapLink}>
                Voir le RDV actuel sur la carte
              </ProDayText>
            </PressableSpring>
          ) : null}

          <TextInput
            style={[styles.input, styles.inputMulti, { borderColor: colors.border, color: colors.ink }]}
            placeholder="Infos utiles (sièges enfants, retour direct…)"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <PressableSpring onPress={() => void publish()} disabled={saving} scaleTo={0.96} haptic>
            <ProDayGradient kind="cta" style={styles.publishBtn}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ProDayText variant="caption" inverse style={styles.publishText}>
                  {isEditing ? 'Mettre à jour mon trajet' : 'Publier mon trajet'}
                </ProDayText>
              )}
            </ProDayGradient>
          </PressableSpring>

          {isEditing && slot?.volunteered ? (
            <PressableSpring
              style={[styles.withdrawBtn, { borderColor: colors.border }]}
              onPress={withdraw}
              disabled={saving}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" muted style={styles.withdrawText}>
                Retirer ma proposition
              </ProDayText>
            </PressableSpring>
          ) : null}

          <PressableSpring onPress={onOpenDetail} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.detailLink}>
              Voir l’événement et les réservations →
            </ProDayText>
          </PressableSpring>
        </View>
      ) : null}
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
  },
  headerCopy: { flex: 1, gap: 4 },
  kindPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  kindText: { fontWeight: '800', fontSize: 10 },
  liveBadge: { fontWeight: '700', marginTop: 4 },
  form: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  formLead: { marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  mapLink: { fontWeight: '700' },
  publishBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.xs,
  },
  publishText: { fontWeight: '800' },
  withdrawBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  withdrawText: { fontWeight: '700' },
  detailLink: { fontWeight: '700', textAlign: 'center', marginTop: spacing.xs },
});
