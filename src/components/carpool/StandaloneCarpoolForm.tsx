import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, Switch } from 'react-native';
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
          <View style={styles.headerMetaRow}>
            <View style={[styles.badgeKind, { backgroundColor: `${palette.signal}18`, borderColor: `${palette.signal}35` }]}>
              <Text style={[styles.kindText, { color: palette.signal }]}>
                Trajet libre
              </Text>
            </View>
            {isEditing ? (
              <View style={[styles.activeBadge, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
                <View style={styles.activeDot} />
                <ProDayText variant="caption" style={styles.activeText}>
                  {standaloneAvailableSeats(offer!)} places restantes
                </ProDayText>
              </View>
            ) : null}
          </View>

          <ProDayText variant="section" style={styles.title}>
            {isEditing ? offer!.title : t('carpool.standalone.form.editTitle')}
          </ProDayText>
          <ProDayText variant="caption" style={styles.meta}>
            {isEditing
              ? `${formatFrenchDepartureDate(offer!.departs_at)} · ${offer!.destination_label || 'Destination libre'}`
              : 'Places, horaire, RDV et destination. Sans convocation'}
          </ProDayText>
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#A1A1AA" />
      </PressableSpring>

      {expanded ? (
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Intitulé du trajet</Text>
            <View style={styles.inputFieldWrap}>
              <Icon name="car" size={15} color={palette.signal} />
              <TextInput
                style={styles.input}
                placeholder="Ex. Aller-retour centre d'entraînement"
                placeholderTextColor="#71717A"
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Destination</Text>
            <View style={styles.inputFieldWrap}>
              <Icon name="location" size={15} color={palette.signal} />
              <TextInput
                style={styles.input}
                placeholder="Ex. Stade Groupama, Salle omnisports..."
                placeholderTextColor="#71717A"
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.half]}>
              <Text style={styles.inputLabel}>Date (JJ/MM/AAAA)</Text>
              <View style={styles.inputFieldWrap}>
                <Icon name="calendar" size={15} color={palette.signal} />
                <TextInput
                  style={styles.input}
                  placeholder="24/09/2026"
                  placeholderTextColor="#71717A"
                  value={departureDate}
                  onChangeText={setDepartureDate}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, styles.half]}>
              <Text style={styles.inputLabel}>Heure de départ</Text>
              <View style={styles.inputFieldWrap}>
                <Icon name="time" size={15} color={palette.signal} />
                <TextInput
                  style={styles.input}
                  placeholder="14:00"
                  placeholderTextColor="#71717A"
                  value={meetingTime}
                  onChangeText={setMeetingTime}
                />
              </View>
            </View>
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
            label="Places disponibles"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Point de rendez-vous</Text>
            <View style={styles.inputFieldWrap}>
              <Icon name="walk" size={15} color={palette.signal} />
              <TextInput
                style={styles.input}
                placeholder="Ex. Parking du gymnase, station..."
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
          {offer?.meeting_location ? (
            <PressableSpring
              onPress={() => openMapsAt(offer.meeting_location!, offer.meeting_place)}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" style={[styles.mapLink, { color: palette.signal }]}>
                📍 Voir le RDV sur Apple/Google Maps
              </ProDayText>
            </PressableSpring>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Détails & Infos complémentaires</Text>
            <TextInput
              style={[styles.inputFieldWrap, styles.inputMulti]}
              placeholder={t('carpool.standalone.form.detailsPlaceholder')}
              placeholderTextColor="#71717A"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {profile.profile.club_id ? (
            <View style={styles.clubRow}>
              <ProDayText variant="caption" style={styles.clubRowText}>
                🔒 Visible uniquement par les membres du club
              </ProDayText>
              <Switch
                value={clubOnly}
                onValueChange={setClubOnly}
                trackColor={{ false: '#282836', true: `${palette.signal}60` }}
                thumbColor={clubOnly ? palette.signal : '#71717A'}
              />
            </View>
          ) : null}

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
                {isEditing ? 'Mettre à jour mon trajet libre' : 'Publier le trajet libre'}
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
      borderWidth: 1,
      borderColor: '#22222E',
      backgroundColor: '#14141A',
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
      borderRadius: 999,
      borderWidth: 1,
    },
    kindText: {
      fontWeight: '800',
      fontSize: 10,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    activeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
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
      borderTopColor: '#22222E',
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
    row: { flexDirection: 'row', gap: 10 },
    half: { flex: 1 },
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
    clubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      backgroundColor: '#1C1D26',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#282836',
      marginTop: 2,
    },
    clubRowText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: '#D4D4D8',
      flex: 1,
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
  });
}

