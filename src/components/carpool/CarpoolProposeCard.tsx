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
import { CarpoolSeatPicker } from './CarpoolSeatPicker';
import { CarpoolVehicleTypePicker } from './CarpoolVehicleTypePicker';
import type { CarpoolVehicleType } from '../../models/CarpoolVehicle';
import { defaultSeatsForVehicleType } from '../../models/CarpoolVehicle';
import { openMapsAt } from '../../utils/geoLocation';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
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
          <View style={styles.headerMetaRow}>
            <View style={[styles.badgeKind, { backgroundColor: `${palette.signal}18`, borderColor: `${palette.signal}35` }]}>
              <Text style={[styles.kind, { color: palette.signal }]}>
                {EVENT_TYPE_LABELS[event.event_type]}
              </Text>
            </View>
            {isEditing ? (
              <View style={[styles.activeBadge, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
                <View style={styles.activeDot} />
                <ProDayText variant="caption" style={styles.activeText}>
                  {slot?.seats ?? '?'} places ouvertes
                </ProDayText>
              </View>
            ) : null}
          </View>

          <ProDayText variant="section" style={styles.title}>
            {event.title}
          </ProDayText>
          <ProDayText variant="caption" style={styles.meta}>
            {formatCalendarDate(event.starts_at)} · {destination || event.city}
          </ProDayText>
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#A1A1AA" />
      </PressableSpring>

      {expanded ? (
        <View style={styles.form}>
          <CarpoolSeatPicker
            seats={parseInt(seats, 10) || 3}
            maxSeats={8}
            taken={takenSeats}
            onChange={(n) => setSeats(String(n))}
            label="Places proposées à l'équipe"
          />

          <CarpoolVehicleTypePicker value={vehicleType} onChange={applyVehicleType} disabled={saving} />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Heure de rendez-vous</Text>
            <View style={styles.inputFieldWrap}>
              <Icon name="time" size={15} color={palette.signal} />
              <TextInput
                style={styles.input}
                placeholder="Ex. 13:30 (45 min avant)"
                placeholderTextColor="#71717A"
                value={meetingTime}
                onChangeText={setMeetingTime}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Lieu de prise en charge</Text>
            <View style={styles.inputFieldWrap}>
              <Icon name="location" size={15} color={palette.signal} />
              <TextInput
                style={styles.input}
                placeholder="Ex. Parking du stade, station de métro..."
                placeholderTextColor="#71717A"
                value={meetingPlace}
                onChangeText={setMeetingPlace}
              />
            </View>
          </View>

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
              <ProDayText variant="caption" style={[styles.mapLink, { color: palette.signal }]}>
                Voir le RDV sur Apple/Google Maps
              </ProDayText>
            </PressableSpring>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Consignes pour l'équipage (facultatif)</Text>
            <TextInput
              style={[styles.inputFieldWrap, styles.inputMulti]}
              placeholder="Ex: Coffre dispo pour sacs de sport, départ ponctuel..."
              placeholderTextColor="#71717A"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <PressableSpring
            onPress={() => void publish()}
            disabled={saving}
            scaleTo={0.96}
            haptic
            style={[styles.publishBtn, { backgroundColor: palette.signal }]}
          >
            {saving ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <ProDayText variant="caption" style={styles.publishText}>
                {isEditing ? 'Mettre à jour mon trajet' : 'Ouvrir ma voiture & publier mes places'}
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
            <ProDayText variant="caption" style={[styles.detailLink, { color: palette.signal }]}>
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
      borderWidth: 1,
      borderColor: CARPOOL_SITE.lane,
      backgroundColor: CARPOOL_SITE.surface,
      borderRadius: 18,
      marginBottom: 12,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: 16,
    },
    headerCopy: { flex: 1, gap: 6 },
    headerMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    badgeKind: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    kind: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    activeDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#10B981',
    },
    activeText: {
      fontSize: 10.5,
      fontWeight: '800',
      color: '#10B981',
    },
    title: {
      fontSize: 16,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    meta: {
      fontSize: 12.5,
      color: '#A1A1AA',
      fontWeight: '500',
    },
    form: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: CARPOOL_SITE.lane,
    },
    inputGroup: {
      gap: 5,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: '#A1A1AA',
    },
    inputFieldWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: '#1C1D26',
      borderWidth: 1,
      borderColor: '#282836',
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    inputMulti: {
      minHeight: 70,
      alignItems: 'flex-start',
      paddingVertical: 10,
      height: 'auto',
      color: '#FFFFFF',
      fontSize: 13.5,
    },
    mapLink: {
      fontWeight: '700',
      fontSize: 12.5,
      marginTop: 2,
    },
    publishBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      marginTop: 4,
    },
    publishText: {
      fontWeight: '900',
      fontSize: 14,
      color: '#000000',
    },
    withdrawBtn: {
      alignItems: 'center',
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: '#383848',
      borderRadius: 12,
      backgroundColor: '#1C1D26',
    },
    withdrawText: {
      fontWeight: '700',
      color: '#EF4444',
      fontSize: 12,
    },
    detailLink: {
      fontWeight: '700',
      textAlign: 'center',
      fontSize: 12.5,
      marginTop: 2,
    },
  });
}

