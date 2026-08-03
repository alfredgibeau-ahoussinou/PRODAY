import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { User } from '../models/User';
import {
  EVENT_KIND_LABELS,
  EVENT_ORGANIZER_KINDS,
  type EventOrganizerKind,
} from '../models/EventOrganizer';
import { eventOrganizerService } from '../services/eventOrganizer.service';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PressableSpring } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useTranslation } from '../context/LocaleContext';

interface CreateOrganizerEventScreenProps {
  profile: User;
  onBack: () => void;
  onCreated: (id: string) => void;
}

export const CreateOrganizerEventScreen: React.FC<CreateOrganizerEventScreenProps> = ({
  profile,
  onBack,
  onCreated,
}) => {
  const { t } = useTranslation();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [kind, setKind] = useState<EventOrganizerKind>('tournament');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState(profile.city ?? '');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('50');
  const [fee, setFee] = useState('0');
  const [daysAhead, setDaysAhead] = useState('14');
  const [openRegistration, setOpenRegistration] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const publish = async () => {
    if (!title.trim()) {
      Alert.alert(t('events.alert.required.title'), t('events.alert.required.body'));
      return;
    }
    setSubmitting(true);
    try {
      const startsAt = new Date();
      startsAt.setDate(startsAt.getDate() + Math.max(1, parseInt(daysAhead, 10) || 14));
      const cap = capacity.trim() === '' ? null : Math.max(1, parseInt(capacity, 10) || 50);
      const id = await eventOrganizerService.create({
        organizer_uid: profile.uid,
        organizer_name: profile.display_name,
        kind,
        title: title.trim(),
        description: description.trim() || undefined,
        city: city.trim() || undefined,
        venue: venue.trim() || undefined,
        starts_at: startsAt,
        capacity: cap,
        registration_price_cents: Math.max(
          0,
          Math.round(parseFloat(fee.replace(',', '.') || '0') * 100),
        ),
        open_registration: openRegistration,
      });
      onCreated(id);
    } catch (e) {
      Alert.alert(
        t('feed.alert.error'),
        e instanceof Error ? e.message : t('events.alert.createFailed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = [
    styles.input,
    { color: c.text, borderColor: c.border, backgroundColor: c.surface },
  ];

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label={t('events.create.label')}
        title={t('events.create.title')}
        subtitle={t('events.create.subtitle')}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <ProDayText variant="caption" muted style={styles.label}>
          {t('events.field.kind')}
        </ProDayText>
        <View style={styles.kindRow}>
          {EVENT_ORGANIZER_KINDS.map((k) => {
            const active = k === kind;
            return (
              <PressableSpring
                key={k}
                style={[
                  styles.kindChip,
                  {
                    borderColor: active ? c.brand : c.border,
                    backgroundColor: active ? c.brandSoft : c.surface,
                  },
                ]}
                onPress={() => setKind(k)}
                scaleTo={0.97}
                haptic
              >
                <ProDayText variant="caption" accent={active}>
                  {EVENT_KIND_LABELS[k]}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>

        <ProDayText variant="caption" muted style={styles.label}>
          {t('events.field.title')}
        </ProDayText>
        <TextInput
          style={inputStyle}
          value={title}
          onChangeText={setTitle}
          placeholder="Tournoi de quartier U15"
          placeholderTextColor={c.textMuted}
        />

        <ProDayText variant="caption" muted style={styles.label}>
          {t('events.field.city')}
        </ProDayText>
        <TextInput style={inputStyle} value={city} onChangeText={setCity} placeholderTextColor={c.textMuted} />

        <ProDayText variant="caption" muted style={styles.label}>
          {t('events.field.venue')}
        </ProDayText>
        <TextInput
          style={inputStyle}
          value={venue}
          onChangeText={setVenue}
          placeholder="Stade municipal"
          placeholderTextColor={c.textMuted}
        />

        <ProDayText variant="caption" muted style={styles.label}>
          {t('events.field.description')}
        </ProDayText>
        <TextInput
          style={[inputStyle, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor={c.textMuted}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <ProDayText variant="caption" muted style={styles.label}>
              {t('events.field.capacity')}
            </ProDayText>
            <TextInput
              style={inputStyle}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
              placeholderTextColor={c.textMuted}
            />
          </View>
          <View style={styles.half}>
            <ProDayText variant="caption" muted style={styles.label}>
              {t('events.field.fee')}
            </ProDayText>
            <TextInput
              style={inputStyle}
              value={fee}
              onChangeText={setFee}
              keyboardType="decimal-pad"
              placeholderTextColor={c.textMuted}
            />
          </View>
        </View>

        <ProDayText variant="caption" muted style={styles.label}>
          {t('events.field.daysAhead')}
        </ProDayText>
        <TextInput
          style={inputStyle}
          value={daysAhead}
          onChangeText={setDaysAhead}
          keyboardType="number-pad"
          placeholderTextColor={c.textMuted}
        />

        <PressableSpring
          style={styles.toggleRow}
          onPress={() => setOpenRegistration((v) => !v)}
          scaleTo={0.98}
          haptic
        >
          <ProDayText variant="body">
            {openRegistration
              ? t('events.field.openRegistrationOn')
              : t('events.field.openRegistrationOff')}
          </ProDayText>
        </PressableSpring>

        <PressableSpring
          style={[styles.submit, { backgroundColor: c.brand }, submitting && { opacity: 0.7 }]}
          disabled={submitting}
          onPress={() => void publish()}
          scaleTo={0.98}
          haptic={!submitting}
        >
          {submitting ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <ProDayText variant="caption" inverse style={styles.submitText}>
              {t('events.create.publish')}
            </ProDayText>
          )}
        </PressableSpring>
      </ScrollView>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    form: { padding: spacing.lg, gap: spacing.xs, paddingBottom: spacing.xl },
    label: { fontWeight: '700', marginTop: spacing.sm },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
    },
    multiline: { minHeight: 90, textAlignVertical: 'top' },
    row: { flexDirection: 'row', gap: spacing.sm },
    half: { flex: 1 },
    kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    kindChip: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    toggleRow: { marginTop: spacing.md, paddingVertical: spacing.sm },
    submit: {
      marginTop: spacing.lg,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    submitText: { fontWeight: '800' },
  });
}
