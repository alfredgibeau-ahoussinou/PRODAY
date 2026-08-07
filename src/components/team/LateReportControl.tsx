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

interface LateReportControlProps {
  eventId: string;
  playerUid: string;
  playerName?: string;
  currentRsvp?: RsvpStatus;
  /** Parent / tuteur qui signale pour l’enfant. */
  reportedByParent?: boolean;
  compact?: boolean;
  onReported?: () => void;
}

/** CTA rapide « Je vais être en retard » — 1–2 clics. */
export const LateReportControl: React.FC<LateReportControlProps> = ({
  eventId,
  playerUid,
  playerName,
  currentRsvp,
  reportedByParent,
  compact,
  onReported,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const alreadyLate = currentRsvp ? isLateRsvp(currentRsvp) : false;

  const submit = async (intent: LateIntent) => {
    setBusy(true);
    try {
      await teamEventsService.reportLate(eventId, playerUid, intent, {
        note: note.trim() || undefined,
        reportedByParent,
        playerName,
      });
      setOpen(false);
      setNote('');
      onReported?.();
      Alert.alert(
        'Retard signalé',
        reportedByParent
          ? `Le coach a été prévenu (signalement parent).`
          : 'Le coach a été prévenu.',
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de signaler le retard.');
    } finally {
      setBusy(false);
    }
  };

  if (alreadyLate && currentRsvp) {
    return (
      <View style={[styles.pill, { backgroundColor: c.surfaceMuted }]}>
        <ProDayText variant="caption" accent>
          ⏰ {RSVP_STATUS_LABELS[currentRsvp]}
        </ProDayText>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <PressableSpring
        style={[styles.cta, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
        onPress={() => setOpen((v) => !v)}
        scaleTo={0.97}
        haptic
      >
        <ProDayText variant="caption" accent style={styles.ctaText}>
          ⏰ {open ? 'Fermer' : 'Je vais être en retard'}
        </ProDayText>
      </PressableSpring>

      {open ? (
        <View style={[styles.panel, { borderColor: c.border, backgroundColor: c.surface }]}>
          {!compact ? (
            <ProDayText variant="caption" muted>
              Le coach sera notifié immédiatement.
            </ProDayText>
          ) : null}
          {LATE_OPTIONS.map((opt) => (
            <PressableSpring
              key={opt.intent}
              style={[styles.opt, { borderColor: c.border }]}
              disabled={busy}
              onPress={() => void submit(opt.intent)}
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
            placeholder="Message optionnel (ex. j’arrive dans 15 min)"
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
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    ctaText: { fontWeight: '800' },
    pill: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
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
