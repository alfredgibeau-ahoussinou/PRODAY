import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { teamEventsService } from '../../services/teamEvents.service';
import type { LateIntent, RsvpStatus } from '../../models/TeamEvent';
import { isLateRsvp, RSVP_STATUS_LABELS } from '../../models/TeamEvent';
import { useAppTheme } from '../../context/ProductLineContext';
import { radius, spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

const LATE_OPTIONS: { intent: LateIntent; label: string }[] = [
  { intent: 'under_10', label: 'Moins de 10 min' },
  { intent: 'over_10', label: '10 min ou plus' },
  { intent: 'unknown', label: 'Je ne sais pas encore' },
];

export type LateReportKind = 'arrival' | 'pickup';

interface LateReportControlProps {
  eventId: string;
  playerUid: string;
  playerName?: string;
  currentRsvp?: RsvpStatus;
  /** Parent / tuteur qui signale pour l’enfant. */
  reportedByParent?: boolean;
  /** Si true (défaut quand reportedByParent), propose aussi « retard récupération ». */
  enablePickupLate?: boolean;
  compact?: boolean;
  onReported?: () => void;
}

/** CTA rapide retard — joueur ou parent (arrivée / récupération). */
export const LateReportControl: React.FC<LateReportControlProps> = ({
  eventId,
  playerUid,
  playerName,
  currentRsvp,
  reportedByParent,
  enablePickupLate,
  compact,
  onReported,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [mode, setMode] = useState<LateReportKind | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [pickupDone, setPickupDone] = useState(false);

  const showPickup = Boolean(reportedByParent && enablePickupLate !== false);
  const alreadyLate = currentRsvp ? isLateRsvp(currentRsvp) : false;

  const submit = async (intent: LateIntent, lateKind: LateReportKind) => {
    setBusy(true);
    try {
      await teamEventsService.reportLate(eventId, playerUid, intent, {
        note: note.trim() || undefined,
        reportedByParent,
        playerName,
        lateKind,
      });
      setMode(null);
      setNote('');
      if (lateKind === 'pickup') setPickupDone(true);
      onReported?.();
      Alert.alert(
        lateKind === 'pickup' ? 'Récupération signalée' : 'Retard signalé',
        lateKind === 'pickup'
          ? 'Le coach a été prévenu : tu seras en retard pour récupérer ton enfant.'
          : reportedByParent
            ? 'Le coach a été prévenu (enfant en retard).'
            : 'Le coach a été prévenu.',
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de signaler le retard.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {alreadyLate && currentRsvp ? (
        <View style={[styles.pill, { backgroundColor: c.surfaceMuted }]}>
          <ProDayText variant="caption" accent>
            Enfant · {RSVP_STATUS_LABELS[currentRsvp]}
          </ProDayText>
        </View>
      ) : (
        <PressableSpring
          style={[styles.cta, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
          onPress={() => setMode((m) => (m === 'arrival' ? null : 'arrival'))}
          scaleTo={0.97}
          haptic
        >
          <ProDayText variant="caption" accent style={styles.ctaText}>
            {reportedByParent
              ? mode === 'arrival'
                ? 'Fermer'
                : 'Enfant en retard'
              : mode === 'arrival'
                ? 'Fermer'
                : 'Je vais être en retard'}
          </ProDayText>
        </PressableSpring>
      )}

      {showPickup ? (
        pickupDone ? (
          <View style={[styles.pill, { backgroundColor: c.surfaceMuted }]}>
            <ProDayText variant="caption" accent>
              Récupération · coach prévenu
            </ProDayText>
          </View>
        ) : (
          <PressableSpring
            style={[styles.ctaAlt, { borderColor: c.border, backgroundColor: c.surface }]}
            onPress={() => setMode((m) => (m === 'pickup' ? null : 'pickup'))}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="caption" style={styles.ctaText}>
              {mode === 'pickup' ? 'Fermer' : 'Je suis en retard pour le récupérer'}
            </ProDayText>
          </PressableSpring>
        )
      ) : null}

      {mode ? (
        <View style={[styles.panel, { borderColor: c.border, backgroundColor: c.surface }]}>
          {!compact ? (
            <ProDayText variant="caption" muted>
              {mode === 'pickup'
                ? 'Le coach sera notifié immédiatement (récupération).'
                : 'Le coach sera notifié immédiatement.'}
            </ProDayText>
          ) : null}
          {LATE_OPTIONS.map((opt) => (
            <PressableSpring
              key={opt.intent}
              style={[styles.opt, { borderColor: c.border }]}
              disabled={busy}
              onPress={() => void submit(opt.intent, mode)}
              scaleTo={0.97}
              haptic
            >
              {busy ? (
                <ActivityIndicator color={c.brand} />
              ) : (
                <ProDayText variant="caption">{opt.label}</ProDayText>
              )}
            </PressableSpring>
          ))}
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder={
              mode === 'pickup'
                ? 'Message optionnel (ex. embouteillage, 15 min)'
                : 'Message optionnel (ex. j’arrive dans 15 min)'
            }
            placeholderTextColor={c.textMuted}
            value={note}
            onChangeText={setNote}
            editable={!busy}
          />
        </View>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { gap: spacing.xs, marginTop: spacing.sm },
    cta: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    ctaAlt: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
    },
    ctaText: { fontWeight: '800' },
    pill: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.md,
    },
    panel: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    opt: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
  });
}
