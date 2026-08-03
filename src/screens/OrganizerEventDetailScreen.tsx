import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import type { User } from '../models/User';
import {
  EVENT_KIND_LABELS,
  EVENT_REGISTRATION_STATUS_LABELS,
  EVENT_STATUS_LABELS,
  type EventOrganizerStatus,
} from '../models/EventOrganizer';
import { useOrganizerEventDetail } from '../hooks/useOrganizerEvents';
import { eventOrganizerService } from '../services/eventOrganizer.service';
import { startEventRegistrationCheckout } from '../services/eventRegistrationPayment.service';
import {
  buildEventResultsShareMessage,
  buildOrganizerEventShareMessage,
} from '../utils/eventOrganizerShare';
import {
  countActiveRegistrations,
  eventRequiresPayment,
  remainingCapacity,
} from '../utils/eventOrganizerScaffold';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { PressableSpring } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { GlassCard } from '../components/aurora/GlassCard';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useTranslation } from '../context/LocaleContext';
import { formatCalendarDate } from '../utils/seasonCalendar';

interface OrganizerEventDetailScreenProps {
  profile: User;
  eventId: string;
  onBack: () => void;
}

export const OrganizerEventDetailScreen: React.FC<OrganizerEventDetailScreenProps> = ({
  profile,
  eventId,
  onBack,
}) => {
  const { t } = useTranslation();
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const { event, registrations, loading, refresh } = useOrganizerEventDetail(eventId);
  const [mediaUrl, setMediaUrl] = useState('');
  const [resultLabel, setResultLabel] = useState('');
  const [resultScore, setResultScore] = useState('');
  const [resultDraft, setResultDraft] = useState<{ rank: number; label: string; score?: string }[]>(
    [],
  );
  const [busy, setBusy] = useState(false);

  const isOrganizer = event?.organizer_uid === profile.uid;
  const myReg = registrations.find(
    (r) => r.user_uid === profile.uid && r.status !== 'cancelled',
  );
  const activeCount = countActiveRegistrations(registrations);
  const remaining = event ? remainingCapacity(event, activeCount) : null;

  const setStatus = async (status: EventOrganizerStatus) => {
    setBusy(true);
    try {
      await eventOrganizerService.updateStatus(eventId, status);
      await refresh();
    } catch (e) {
      Alert.alert(t('feed.alert.error'), e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const registerSelf = async () => {
    setBusy(true);
    try {
      await eventOrganizerService.register({
        event_id: eventId,
        user_uid: profile.uid,
        display_name: profile.display_name,
        email: profile.email,
      });
      await refresh();
      Alert.alert(t('events.detail.registeredTitle'), t('events.detail.registeredBody'));
    } catch (e) {
      Alert.alert(t('feed.alert.error'), e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const payRegistration = async () => {
    if (!myReg) return;
    setBusy(true);
    try {
      const { url } = await startEventRegistrationCheckout(eventId, myReg.id);
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert(
        t('events.detail.paymentTitle'),
        e instanceof Error ? e.message : t('events.detail.paymentStub'),
      );
    } finally {
      setBusy(false);
    }
  };

  const markPaidManual = async (registrationId: string) => {
    setBusy(true);
    try {
      await eventOrganizerService.setRegistrationStatus(registrationId, 'paid', 'manual');
      await refresh();
    } catch (e) {
      Alert.alert(t('feed.alert.error'), e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const addMedia = async () => {
    setBusy(true);
    try {
      await eventOrganizerService.addMediaUrl(eventId, mediaUrl);
      setMediaUrl('');
      await refresh();
    } catch (e) {
      Alert.alert(t('feed.alert.error'), e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const addResultRow = () => {
    if (!resultLabel.trim()) return;
    setResultDraft((prev) => [
      ...prev,
      {
        rank: prev.length + 1,
        label: resultLabel.trim(),
        score: resultScore.trim() || undefined,
      },
    ]);
    setResultLabel('');
    setResultScore('');
  };

  const publishResults = async () => {
    if (!resultDraft.length) {
      Alert.alert(t('events.detail.resultsEmptyTitle'), t('events.detail.resultsEmptyBody'));
      return;
    }
    setBusy(true);
    try {
      await eventOrganizerService.publishResults(eventId, resultDraft);
      await refresh();
      Alert.alert(t('events.detail.resultsPublishedTitle'), t('events.detail.resultsPublishedBody'));
    } catch (e) {
      Alert.alert(t('feed.alert.error'), e instanceof Error ? e.message : 'Erreur');
    } finally {
      setBusy(false);
    }
  };

  const shareEvent = async () => {
    if (!event) return;
    try {
      await Share.share({ message: buildOrganizerEventShareMessage(event) });
    } catch {
      /* user cancelled */
    }
  };

  const shareResults = async () => {
    if (!event?.results?.published) return;
    try {
      await Share.share({
        message: buildEventResultsShareMessage(event, event.results),
      });
    } catch {
      /* user cancelled */
    }
  };

  const inputStyle = [
    styles.input,
    { color: c.text, borderColor: c.border, backgroundColor: c.surface },
  ];

  if (loading && !event) {
    return (
      <View style={[styles.root, rootStyle, styles.centered]}>
        <ActivityIndicator color={c.brand} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.root, rootStyle]}>
        <ScreenHeader
          label={t('events.detail.label')}
          title={t('events.detail.missing')}
          onBack={onBack}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, rootStyle]}>
      <ScreenHeader
        label={EVENT_KIND_LABELS[event.kind]}
        title={event.title}
        subtitle={EVENT_STATUS_LABELS[event.status]}
        onBack={onBack}
      />
      <ScrollView contentContainerStyle={styles.body}>
        <GlassCard style={styles.card}>
          <ProDayText variant="caption" muted>
            {[event.city, event.venue].filter(Boolean).join(' · ') || t('events.detail.noVenue')}
          </ProDayText>
          <ProDayText variant="body">{formatCalendarDate(event.starts_at)}</ProDayText>
          {event.description ? (
            <ProDayText variant="caption" muted style={{ marginTop: spacing.xs }}>
              {event.description}
            </ProDayText>
          ) : null}
          <ProDayText variant="caption" muted style={{ marginTop: spacing.sm }}>
            {t('events.detail.capacity', {
              active: String(activeCount),
              remaining:
                remaining == null ? t('events.detail.unlimited') : String(remaining),
            })}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {eventRequiresPayment(event)
              ? t('events.detail.price', {
                  price: (event.registration_price_cents! / 100).toFixed(2),
                })
              : t('events.list.free')}
          </ProDayText>
        </GlassCard>

        <View style={styles.actions}>
          <PressableSpring style={styles.actionChip} onPress={() => void shareEvent()} scaleTo={0.97} haptic>
            <ProDayText variant="caption" accent>
              {t('events.detail.share')}
            </ProDayText>
          </PressableSpring>
          {!isOrganizer && !myReg ? (
            <PressableSpring
              style={[styles.actionChip, { backgroundColor: c.brand }]}
              disabled={busy}
              onPress={() => void registerSelf()}
              scaleTo={0.97}
              haptic
            >
              <ProDayText variant="caption" inverse>
                {t('events.detail.register')}
              </ProDayText>
            </PressableSpring>
          ) : null}
          {!isOrganizer && myReg?.status === 'pending' && eventRequiresPayment(event) ? (
            <PressableSpring
              style={[styles.actionChip, { backgroundColor: c.brand }]}
              disabled={busy}
              onPress={() => void payRegistration()}
              scaleTo={0.97}
              haptic
            >
              <ProDayText variant="caption" inverse>
                {t('events.detail.pay')}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>

        {isOrganizer ? (
          <GlassCard style={styles.card}>
            <ProDayText variant="section">{t('events.detail.manageStatus')}</ProDayText>
            <View style={styles.actions}>
              {(
                [
                  'registration_open',
                  'registration_closed',
                  'live',
                  'completed',
                ] as EventOrganizerStatus[]
              ).map((s) => (
                <PressableSpring
                  key={s}
                  style={styles.actionChip}
                  disabled={busy}
                  onPress={() => void setStatus(s)}
                  scaleTo={0.97}
                  haptic
                >
                  <ProDayText variant="caption">{EVENT_STATUS_LABELS[s]}</ProDayText>
                </PressableSpring>
              ))}
            </View>
          </GlassCard>
        ) : null}

        <ProDayText variant="section" style={styles.sectionTitle}>
          {t('events.detail.registrationsTitle')}
        </ProDayText>
        {registrations.length === 0 ? (
          <ProDayText variant="caption" muted>
            {t('events.detail.noRegistrations')}
          </ProDayText>
        ) : (
          registrations.map((reg) => (
            <GlassCard key={reg.id} style={styles.regCard}>
              <ProDayText variant="body">{reg.display_name || reg.user_uid.slice(0, 8)}</ProDayText>
              <ProDayText variant="caption" muted>
                {EVENT_REGISTRATION_STATUS_LABELS[reg.status]}
                {reg.amount_cents ? ` · ${(reg.amount_cents / 100).toFixed(2)} €` : ''}
              </ProDayText>
              {isOrganizer && (reg.status === 'pending' || reg.status === 'confirmed') ? (
                <PressableSpring
                  style={styles.inlineAction}
                  disabled={busy}
                  onPress={() => void markPaidManual(reg.id)}
                  scaleTo={0.97}
                  haptic
                >
                  <ProDayText variant="caption" accent>
                    {t('events.detail.markPaid')}
                  </ProDayText>
                </PressableSpring>
              ) : null}
            </GlassCard>
          ))
        )}

        {isOrganizer ? (
          <>
            <ProDayText variant="section" style={styles.sectionTitle}>
              {t('events.detail.resultsTitle')}
            </ProDayText>
            {event.results?.published ? (
              <GlassCard style={styles.card}>
                {event.results.entries.map((e) => (
                  <ProDayText key={`${e.rank}-${e.label}`} variant="body">
                    {e.rank}. {e.label}
                    {e.score ? ` — ${e.score}` : ''}
                  </ProDayText>
                ))}
                <PressableSpring style={styles.inlineAction} onPress={() => void shareResults()} scaleTo={0.97} haptic>
                  <ProDayText variant="caption" accent>
                    {t('events.detail.shareResults')}
                  </ProDayText>
                </PressableSpring>
              </GlassCard>
            ) : (
              <GlassCard style={styles.card}>
                {resultDraft.map((e) => (
                  <ProDayText key={`${e.rank}-${e.label}`} variant="caption">
                    {e.rank}. {e.label}
                    {e.score ? ` — ${e.score}` : ''}
                  </ProDayText>
                ))}
                <TextInput
                  style={inputStyle}
                  value={resultLabel}
                  onChangeText={setResultLabel}
                  placeholder={t('events.detail.resultLabelPh')}
                  placeholderTextColor={c.textMuted}
                />
                <TextInput
                  style={inputStyle}
                  value={resultScore}
                  onChangeText={setResultScore}
                  placeholder={t('events.detail.resultScorePh')}
                  placeholderTextColor={c.textMuted}
                />
                <View style={styles.actions}>
                  <PressableSpring style={styles.actionChip} onPress={addResultRow} scaleTo={0.97} haptic>
                    <ProDayText variant="caption">{t('events.detail.addResult')}</ProDayText>
                  </PressableSpring>
                  <PressableSpring
                    style={[styles.actionChip, { backgroundColor: c.brand }]}
                    disabled={busy}
                    onPress={() => void publishResults()}
                    scaleTo={0.97}
                    haptic
                  >
                    <ProDayText variant="caption" inverse>
                      {t('events.detail.publishResults')}
                    </ProDayText>
                  </PressableSpring>
                </View>
              </GlassCard>
            )}

            <ProDayText variant="section" style={styles.sectionTitle}>
              {t('events.detail.mediaTitle')}
            </ProDayText>
            <GlassCard style={styles.card}>
              {(event.media_urls ?? []).map((url) => (
                <PressableSpring
                  key={url}
                  onPress={() => void Linking.openURL(url)}
                  scaleTo={0.98}
                  haptic
                >
                  <ProDayText variant="caption" accent numberOfLines={1}>
                    {url}
                  </ProDayText>
                </PressableSpring>
              ))}
              <TextInput
                style={inputStyle}
                value={mediaUrl}
                onChangeText={setMediaUrl}
                placeholder="https://…"
                autoCapitalize="none"
                placeholderTextColor={c.textMuted}
              />
              <PressableSpring
                style={styles.actionChip}
                disabled={busy}
                onPress={() => void addMedia()}
                scaleTo={0.97}
                haptic
              >
                <ProDayText variant="caption" accent>
                  {t('events.detail.addMedia')}
                </ProDayText>
              </PressableSpring>
            </GlassCard>
          </>
        ) : null}

        {busy ? <ActivityIndicator color={c.brand} style={{ marginTop: spacing.md }} /> : null}
      </ScrollView>
    </View>
  );
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    centered: { alignItems: 'center', justifyContent: 'center' },
    body: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xl },
    card: { padding: spacing.md, gap: spacing.xs },
    regCard: { padding: spacing.md, gap: spacing.xs, marginBottom: spacing.xs },
    sectionTitle: { marginTop: spacing.md },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
    actionChip: {
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    inlineAction: { marginTop: spacing.xs, alignSelf: 'flex-start' },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      marginTop: spacing.xs,
    },
  });
}
