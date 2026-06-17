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
import { useTranslation } from '../../context/LocaleContext';
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
  const { t } = useTranslation();
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
      Alert.alert(t('carpool.propose.seatsRequired'), t('carpool.propose.seatsRequiredBody'));
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
              {t('carpool.propose.activeTrip', { n: slot?.seats ?? '?' })}
            </ProDayText>
          ) : null}
        </View>
        <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </PressableSpring>

      {expanded ? (
        <View style={styles.form}>
          <ProDayText variant="caption" muted style={styles.formLead}>
            {t('carpool.propose.destination', { dest: destination || event.city })}
          </ProDayText>

          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder={t('carpool.propose.seatsPlaceholder')}
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={seats}
            onChangeText={setSeats}
          />
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            placeholder={t('carpool.propose.departurePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={meetingTime}
            onChangeText={setMeetingTime}
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

          {slot?.meeting_location ? (
            <PressableSpring onPress={() => openMapsAt(slot.meeting_location!, slot.meeting_place)} scaleTo={0.96} haptic>
              <ProDayText variant="caption" accent style={styles.mapLink}>
                {t('carpool.propose.viewMeetingMap')}
              </ProDayText>
            </PressableSpring>
          ) : null}

          <TextInput
            style={[styles.input, styles.inputMulti, { borderColor: colors.border, color: colors.ink }]}
            placeholder={t('carpool.propose.notesPlaceholder')}
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
                  {isEditing ? t('carpool.propose.updateTrip') : t('carpool.propose.publishTrip')}
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
                {t('carpool.propose.withdraw')}
              </ProDayText>
            </PressableSpring>
          ) : null}

          <PressableSpring onPress={onOpenDetail} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.detailLink}>
              {t('carpool.propose.viewEvent')}
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
