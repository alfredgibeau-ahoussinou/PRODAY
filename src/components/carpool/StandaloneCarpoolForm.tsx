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
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { ProDayGradient } from '../ui/ProDayGradient';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius, shadows } from '../../theme/designTokens';

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
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const isEditing = Boolean(offer);

  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingPlace, setMeetingPlace] = useState('');
  const [meetingLocation, setMeetingLocation] = useState<GeoPoint | undefined>();
  const [seats, setSeats] = useState('');
  const [notes, setNotes] = useState('');
  const [clubOnly, setClubOnly] = useState(false);
  const [saving, setSaving] = useState(false);

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
      setNotes(offer.notes ?? '');
      setClubOnly(offer.club_only === true);
    } else {
      setTitle('');
      setDestination('');
      setDepartureDate('');
      setMeetingTime('');
      setMeetingPlace('');
      setMeetingLocation(undefined);
      setSeats('');
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
    <ProDaySurface
      variant="module"
      style={[styles.card, { borderColor: colors.border }, shadows.soft]}
    >
      <PressableSpring style={styles.header} onPress={onToggle} scaleTo={0.98} haptic>
        <View style={styles.headerCopy}>
          <View style={[styles.kindPill, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={styles.kindText}>
              Trajet libre
            </ProDayText>
          </View>
          <ProDayText variant="section">
            {isEditing ? offer!.title : t('carpool.standalone.form.editTitle')}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {isEditing
              ? `${formatFrenchDepartureDate(offer!.departs_at)} · ${standaloneAvailableSeats(offer!)} place(s) restante(s)`
              : 'Places, horaire, RDV et destination. Sans convocation'}
          </ProDayText>
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </PressableSpring>

      {expanded ? (
        <View style={styles.form}>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder={t('carpool.standalone.form.titlePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder={t('carpool.standalone.form.destinationPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={destination}
            onChangeText={setDestination}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.half, { borderColor: colors.border, color: colors.ink }]}
              placeholder={t('carpool.standalone.form.datePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={departureDate}
              onChangeText={setDepartureDate}
            />
            <TextInput
              style={[styles.input, styles.half, { borderColor: colors.border, color: colors.ink }]}
              placeholder={t('carpool.standalone.form.timePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={meetingTime}
              onChangeText={setMeetingTime}
            />
          </View>
          <CarpoolSeatPicker
            seats={parseInt(seats, 10) || 0}
            maxSeats={6}
            taken={offer ? standalonePassengerCount(offer) : 0}
            onChange={(n) => setSeats(String(n))}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder={t('carpool.propose.meetingPlaceholder')}
            placeholderTextColor={colors.textMuted}
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
              <ProDayText variant="caption" accent style={styles.mapLink}>
                Voir le RDV sur la carte
              </ProDayText>
            </PressableSpring>
          ) : null}
          <TextInput
            style={[styles.input, styles.inputMulti, { borderColor: colors.border, color: colors.ink }]}
            placeholder={t('carpool.standalone.form.detailsPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {profile.profile.club_id ? (
            <View style={styles.clubRow}>
              <ProDayText variant="caption" muted style={{ flex: 1 }}>
                Trajet visible uniquement par mon club
              </ProDayText>
              <Switch
                value={clubOnly}
                onValueChange={setClubOnly}
                trackColor={{ false: colors.border, true: colors.accentSoft }}
                thumbColor={clubOnly ? colors.accent : colors.surface}
              />
            </View>
          ) : null}

          <PressableSpring onPress={() => void publish()} disabled={saving} scaleTo={0.96} haptic>
            <ProDayGradient kind="cta" style={styles.publishBtn}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ProDayText variant="caption" inverse style={styles.publishText}>
                  {isEditing ? t('common.update') : t('carpool.standalone.form.publish')}
                </ProDayText>
              )}
            </ProDayGradient>
          </PressableSpring>

          {isEditing ? (
            <PressableSpring
              style={[styles.withdrawBtn, { borderColor: colors.border }]}
              onPress={remove}
              disabled={saving}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" muted style={styles.withdrawText}>
                Supprimer ce trajet
              </ProDayText>
            </PressableSpring>
          ) : null}
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
  form: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  mapLink: { fontWeight: '700' },
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
});
