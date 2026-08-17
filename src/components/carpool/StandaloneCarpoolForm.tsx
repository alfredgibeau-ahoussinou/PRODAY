import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator, Alert, Switch } from 'react-native';
import type { User } from '../../models/User';
import type { GeoPoint } from '../../models/User';
import type { StandaloneCarpoolOffer } from '../../models/StandaloneCarpoolOffer';
import { carpoolOffersService } from '../../services/carpoolOffers.service';
import { CarpoolLocationCapture } from './CarpoolLocationCapture';
import { openMapsAt } from '../../utils/geoLocation';
import {
  formatFrenchDepartureDate,
  formatFrenchDepartureTime,
  parseFrenchDeparture,
  standaloneAvailableSeats,
  standalonePassengerCount,
} from '../../utils/standaloneCarpool';
import { CarpoolSeatPicker } from './CarpoolSeatPicker';
import { CarpoolVehicleTypePicker } from './CarpoolVehicleTypePicker';
import type { CarpoolVehicleType } from '../../models/CarpoolVehicle';
import {
  defaultSeatsForVehicleType,
  seatPickerMaxForVehicleType,
} from '../../models/CarpoolVehicle';
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

interface StandaloneCarpoolFormProps {
  profile: User;
  offer?: StandaloneCarpoolOffer | null;
  expanded: boolean;
  onToggle: () => void;
  onSaved: () => void;
}

export const StandaloneCarpoolForm: React.FC<StandaloneCarpoolFormProps> = ({
  profile,
  offer,
  expanded,
  onToggle,
  onSaved,
}) => {
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);
  const isEditing = Boolean(offer);

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingPlace, setMeetingPlace] = useState('');
  const [meetingLocation, setMeetingLocation] = useState<GeoPoint | undefined>();
  const [seats, setSeats] = useState(String(defaultSeatsForVehicleType('berline')));
  const [vehicleType, setVehicleType] = useState<CarpoolVehicleType | undefined>('berline');
  const [notes, setNotes] = useState('');
  const [clubOnly, setClubOnly] = useState(false);
  const [saving, setSaving] = useState(false);

  const takenSeats = offer ? standalonePassengerCount(offer) : 0;

  const applyVehicleType = (type: CarpoolVehicleType) => {
    setVehicleType(type);
    setSeats(String(defaultSeatsForVehicleType(type, takenSeats)));
  };

  useEffect(() => {
    if (!expanded) return;
    if (offer) {
      setTitle(offer.title);
      setDestination(offer.destination_label ?? '');
      setDepartureDate(formatFrenchDepartureDate(offer.departs_at));
      setMeetingTime(offer.meeting_time ?? formatFrenchDepartureTime(offer.departs_at));
      setMeetingPlace(offer.meeting_place ?? '');
      setMeetingLocation(offer.meeting_location);
      setSeats(String(offer.seats));
      setVehicleType(offer.vehicle_type);
      setNotes(offer.notes ?? '');
      setClubOnly(offer.club_only === true);
    } else {
      setTitle('');
      setDestination('');
      setDepartureDate('');
      setMeetingTime('');
      setMeetingPlace('');
      setMeetingLocation(undefined);
      setVehicleType('berline');
      setSeats(String(defaultSeatsForVehicleType('berline')));
      setNotes('');
      setClubOnly(false);
    }
  }, [expanded, offer?.id, offer?.updated_at?.getTime()]);

  const publish = async () => {
    const seatsNum = seats.trim() ? parseInt(seats, 10) : NaN;
    if (!title.trim()) {
      Alert.alert(t('carpool.standalone.form.titleRequired'), t('carpool.standalone.form.titleRequiredBody'));
      return;
    }
    if (!Number.isFinite(seatsNum) || seatsNum < 1) {
      Alert.alert(t('carpool.standalone.form.seatsRequired'), t('carpool.standalone.form.seatsRequiredBody'));
      return;
    }
    if (!vehicleType) {
      Alert.alert(t('carpool.vehicle.required'), t('carpool.vehicle.requiredBody'));
      return;
    }
    const departsAt = parseFrenchDeparture(departureDate, meetingTime);
    if (!departsAt) {
      Alert.alert(t('carpool.standalone.form.dateInvalid'), t('carpool.standalone.form.dateInvalidBody'));
      return;
    }
    if (!meetingPlace.trim() && !meetingLocation) {
      Alert.alert(t('carpool.standalone.form.pickupRequired'), t('carpool.standalone.form.pickupRequiredBody'));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        destination_label: destination.trim() || undefined,
        departs_at: departsAt,
        meeting_time: meetingTime.trim() || undefined,
        meeting_place: meetingPlace.trim() || undefined,
        meeting_location: meetingLocation,
        seats: seatsNum,
        vehicle_type: vehicleType,
        notes: notes.trim() || undefined,
        city: profile.city,
        club_id: profile.profile.club_id,
        club_only: clubOnly && Boolean(profile.profile.club_id),
      };
      if (offer) {
        await carpoolOffersService.update(offer.id, profile.uid, payload);
      } else {
        await carpoolOffersService.create(profile.uid, profile.display_name, payload);
      }
      prodayHaptics.carpoolBook();
      onSaved();
      Alert.alert(
        isEditing ? t('carpool.standalone.form.updated') : t('carpool.standalone.form.published'),
        t('carpool.standalone.form.publishedBody')
      );
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.publishFailed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!offer) return;
    Alert.alert(t('carpool.standalone.form.delete.title'), t('carpool.standalone.form.delete.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setSaving(true);
            try {
              await carpoolOffersService.delete(offer.id, profile.uid);
              onSaved();
            } catch (e) {
              Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.deleteFailed'));
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
          <ProDayText variant="caption" style={styles.kindText}>
            Trajet libre
          </ProDayText>
          <ProDayText variant="section" style={styles.title}>
            {isEditing ? offer!.title : t('carpool.standalone.form.editTitle')}
          </ProDayText>
          <ProDayText variant="caption" style={styles.meta}>
            {isEditing
              ? `${formatFrenchDepartureDate(offer!.departs_at)} · ${standaloneAvailableSeats(offer!)} place(s) restante(s)`
              : 'Places, horaire, RDV et destination. Sans convocation'}
          </ProDayText>
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={palette.inkDim} />
      </PressableSpring>

      {expanded ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder={t('carpool.standalone.form.titlePlaceholder')}
            placeholderTextColor={palette.inkDim}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.input}
            placeholder={t('carpool.standalone.form.destinationPlaceholder')}
            placeholderTextColor={palette.inkDim}
            value={destination}
            onChangeText={setDestination}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half]}
              placeholder={t('carpool.standalone.form.datePlaceholder')}
              placeholderTextColor={palette.inkDim}
              value={departureDate}
              onChangeText={setDepartureDate}
            />
            <TextInput
              style={[styles.input, styles.half]}
              placeholder={t('carpool.standalone.form.timePlaceholder')}
              placeholderTextColor={palette.inkDim}
              value={meetingTime}
              onChangeText={setMeetingTime}
            />
          </View>
          <CarpoolVehicleTypePicker
            value={vehicleType}
            onChange={applyVehicleType}
            disabled={saving}
          />
          <CarpoolSeatPicker
            seats={parseInt(seats, 10) || 0}
            maxSeats={seatPickerMaxForVehicleType(vehicleType, takenSeats)}
            taken={takenSeats}
            onChange={(n) => setSeats(String(n))}
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
          {offer?.meeting_location ? (
            <PressableSpring
              onPress={() => openMapsAt(offer.meeting_location!, offer.meeting_place)}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" style={styles.mapLink}>
                Voir le RDV sur la carte
              </ProDayText>
            </PressableSpring>
          ) : null}
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder={t('carpool.standalone.form.detailsPlaceholder')}
            placeholderTextColor={palette.inkDim}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {profile.profile.club_id ? (
            <View style={styles.clubRow}>
              <ProDayText variant="caption" style={[styles.meta, { flex: 1 }]}>
                Trajet visible uniquement par mon club
              </ProDayText>
              <Switch
                value={clubOnly}
                onValueChange={setClubOnly}
                trackColor={{ false: palette.lane, true: palette.signalSoft }}
                thumbColor={clubOnly ? palette.signal : palette.inkDim}
              />
            </View>
          ) : null}

          <PressableSpring onPress={() => void publish()} disabled={saving} scaleTo={0.96} haptic style={styles.publishBtn}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ProDayText variant="caption" style={styles.publishText}>
                {isEditing ? t('common.update') : t('carpool.standalone.form.publish')}
              </ProDayText>
            )}
          </PressableSpring>

          {isEditing ? (
            <PressableSpring
              style={styles.withdrawBtn}
              onPress={remove}
              disabled={saving}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" style={styles.withdrawText}>
                Supprimer ce trajet
              </ProDayText>
            </PressableSpring>
          ) : null}
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
    kindText: {
      fontWeight: '800',
      fontSize: 10,
      letterSpacing: 1,
      textTransform: 'uppercase',
      color: palette.signal,
    },
    title: { color: palette.ink, fontFamily: CARPOOL_SITE.display },
    meta: { color: palette.inkMuted },
    form: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: palette.fog,
    },
    row: { flexDirection: 'row', gap: spacing.sm },
    half: { flex: 1 },
    input: {
      borderWidth: 1.5,
      borderColor: palette.fog,
      backgroundColor: palette.surfaceMuted,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      fontSize: 14,
      color: palette.ink,
    },
    inputMulti: { minHeight: 72, textAlignVertical: 'top' },
    mapLink: { fontWeight: '700', color: palette.signalDeep },
    clubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
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
  });
}
