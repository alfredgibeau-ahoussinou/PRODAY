import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
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
import { CarpoolVehicleTypePicker } from './CarpoolVehicleTypePicker';
import type { CarpoolVehicleType } from '../../models/CarpoolVehicle';
import { defaultSeatsForVehicleType } from '../../models/CarpoolVehicle';
import { openMapsAt } from '../../utils/geoLocation';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { CARPOOL_SITE } from '../../content/carpoolSite';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';

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
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);
  const slot = carpoolSlotForDriver(event, profile.uid);
  const isEditing = Boolean(slot);

  const [seats, setSeats] = useState(String(defaultSeatsForVehicleType('berline')));
  const [vehicleType, setVehicleType] = useState<CarpoolVehicleType | undefined>('berline');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingPlace, setMeetingPlace] = useState('');
  const [meetingLocation, setMeetingLocation] = useState<GeoPoint | undefined>();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const takenSeats = slot?.passengers?.length ?? 0;

  const applyVehicleType = (type: CarpoolVehicleType) => {
    setVehicleType(type);
    setSeats(String(defaultSeatsForVehicleType(type, takenSeats)));
  };

  useEffect(() => {
    if (!expanded) return;
    setSeats(slot?.seats != null ? String(slot.seats) : String(defaultSeatsForVehicleType('berline')));
    setVehicleType(slot?.vehicle_type ?? 'berline');
    setMeetingTime(slot?.meeting_time ?? '');
    setMeetingPlace(slot?.meeting_place ?? '');
    setMeetingLocation(slot?.meeting_location);
    setNotes(slot?.notes ?? '');
  }, [
    expanded,
    slot?.driver_uid,
    slot?.seats,
    slot?.vehicle_type,
    slot?.meeting_time,
    slot?.meeting_place,
    slot?.meeting_location,
    slot?.notes,
  ]);

  const destination = [event.location_label, event.city].filter(Boolean).join(' · ');

  const publish = async () => {
    const seatsNum = seats.trim() ? parseInt(seats, 10) : undefined;
    if (!seats.trim() || !Number.isFinite(seatsNum) || (seatsNum ?? 0) < 1) {
      Alert.alert(t('carpool.propose.seatsRequired'), t('carpool.propose.seatsRequiredBody'));
      return;
    }
    if (!vehicleType) {
      Alert.alert(t('carpool.vehicle.required'), t('carpool.vehicle.requiredBody'));
      return;
    }
    if (!meetingPlace.trim() && !meetingLocation) {
      Alert.alert(t('carpool.standalone.form.pickupRequired'), t('carpool.propose.meetingRequired'));
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
          vehicle_type: vehicleType,
          meeting_time: meetingTime.trim() || undefined,
          meeting_place: meetingPlace.trim() || undefined,
          meeting_location: meetingLocation,
          notes: notes.trim() || undefined,
        }
      );
      prodayHaptics.carpoolBook();
      onPublished();
      Alert.alert(
        isEditing ? t('carpool.propose.updated') : t('carpool.propose.published'),
        t('carpool.propose.publishedBody')
      );
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.publishFailed'));
    } finally {
      setSaving(false);
    }
  };

  const withdraw = () => {
    if (!slot?.volunteered) {
      Alert.alert(t('carpool.propose.assignedTitle'), t('carpool.propose.assignedWarning'));
      return;
    }
    Alert.alert(t('carpool.propose.remove.title'), t('carpool.propose.remove.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('carpool.propose.remove.cta'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            try {
              await teamEventsService.withdrawCarpoolOffer(event.id, profile.uid);
              onPublished();
            } catch (e) {
              Alert.alert(t('common.error'), e instanceof Error ? e.message : t('carpool.propose.remove.failed'));
            } finally {
              setSaving(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <PressableSpring style={styles.header} onPress={onToggle} scaleTo={0.98} haptic>
        <View style={styles.headerCopy}>
          <Text style={styles.kind}>{EVENT_TYPE_LABELS[event.event_type]}</Text>
          <ProDayText variant="section" style={styles.title}>
            {event.title}
          </ProDayText>
          <ProDayText variant="caption" style={styles.meta}>
            {formatCalendarDate(event.starts_at)} · {destination || event.city}
          </ProDayText>
          {isEditing ? (
            <ProDayText variant="caption" style={styles.liveBadge}>
              {t('carpool.propose.activeTrip', { n: slot?.seats ?? '?' })}
            </ProDayText>
          ) : null}
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={palette.inkDim} />
      </PressableSpring>

      {expanded ? (
        <View style={styles.form}>
          <ProDayText variant="caption" style={styles.formLead}>
            {t('carpool.propose.destination', { dest: destination || event.city })}
          </ProDayText>

          <TextInput
            style={styles.input}
            placeholder={t('carpool.propose.seatsPlaceholder')}
            placeholderTextColor={palette.inkDim}
            keyboardType="number-pad"
            value={seats}
            onChangeText={setSeats}
          />
          <CarpoolVehicleTypePicker value={vehicleType} onChange={applyVehicleType} disabled={saving} />
          <TextInput
            style={styles.input}
            placeholder={t('carpool.propose.departurePlaceholder')}
            placeholderTextColor={palette.inkDim}
            value={meetingTime}
            onChangeText={setMeetingTime}
          />
          <TextInput
            style={styles.input}
            placeholder={t('carpool.propose.meetingPlaceholder')}
            placeholderTextColor={palette.inkDim}
            value={meetingPlace}
            onChangeText={setMeetingPlace}
          />
          <CarpoolLocationCapture
            label={t('carpool.location.gpsLabel')}
            place={meetingPlace}
            location={meetingLocation}
            onPlaceChange={setMeetingPlace}
            onLocationChange={setMeetingLocation}
            disabled={saving}
            compact
          />

          {slot?.meeting_location ? (
            <PressableSpring onPress={() => openMapsAt(slot.meeting_location!, slot.meeting_place)} scaleTo={0.96} haptic>
              <ProDayText variant="caption" style={styles.mapLink}>
                {t('carpool.propose.viewMeetingMap')}
              </ProDayText>
            </PressableSpring>
          ) : null}

          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder={t('carpool.propose.notesPlaceholder')}
            placeholderTextColor={palette.inkDim}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <PressableSpring onPress={() => void publish()} disabled={saving} scaleTo={0.96} haptic style={styles.publishBtn}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ProDayText variant="caption" style={styles.publishText}>
                {isEditing ? t('carpool.propose.updateTrip') : t('carpool.propose.publishTrip')}
              </ProDayText>
            )}
          </PressableSpring>

          {isEditing && slot?.volunteered ? (
            <PressableSpring
              style={styles.withdrawBtn}
              onPress={withdraw}
              disabled={saving}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" style={styles.withdrawText}>
                {t('carpool.propose.withdraw')}
              </ProDayText>
            </PressableSpring>
          ) : null}

          <PressableSpring onPress={onOpenDetail} scaleTo={0.96} haptic>
            <ProDayText variant="caption" style={styles.detailLink}>
              {t('carpool.propose.viewEvent')}
            </ProDayText>
          </PressableSpring>
        </View>
      ) : null}
    </View>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    card: {
      borderWidth: 1.5,
      borderColor: palette.fog,
      backgroundColor: palette.surface,
      borderRadius: 18,
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
    kind: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: palette.signal,
    },
    title: { color: palette.ink, fontFamily: CARPOOL_SITE.display },
    meta: { color: palette.inkMuted },
    liveBadge: { fontWeight: '700', marginTop: 4, color: palette.signal },
    form: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: palette.fog,
    },
    formLead: { marginBottom: spacing.xs, color: palette.inkMuted },
    input: {
      borderWidth: 1.5,
      borderColor: palette.fog,
      backgroundColor: palette.surfaceMuted,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      color: palette.ink,
    },
    inputMulti: { minHeight: 72, textAlignVertical: 'top' },
    mapLink: { fontWeight: '700', color: palette.signalDeep },
    publishBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      marginTop: spacing.xs,
      backgroundColor: palette.signal,
      borderRadius: 999,
    },
    publishText: { fontWeight: '800', color: palette.onSignal },
    withdrawBtn: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderWidth: 1.5,
      borderColor: palette.fog,
      borderRadius: 999,
    },
    withdrawText: { fontWeight: '700', color: palette.inkMuted },
    detailLink: {
      fontWeight: '700',
      textAlign: 'center',
      marginTop: spacing.xs,
      color: palette.signalDeep,
    },
  });
}
