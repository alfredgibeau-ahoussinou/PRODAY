import React, { useCallback, useEffect, useState } from 'react';
import { View, Switch, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import type { User } from '../../models/User';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import {
  isCalendarSyncEnabled,
  setCalendarSyncEnabled,
  getLastCalendarSyncAt,
} from '../../services/v3Preferences.service';
import { requestAndSyncDeviceCalendar } from '../../services/deviceCalendar.service';
import { useProDayBrain } from '../../hooks/useProDayBrain';
import { trackV3Event } from '../../core/analytics/v3Events';
import { PressableSpring } from '../motion';

interface V3PreferencesCardProps {
  profile: User;
}

function formatLastSync(ts: number | null): string {
  if (!ts) return 'Jamais synchronisé';
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 120) return 'À l’instant';
  if (sec < 3600) return `Il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `Il y a ${Math.floor(sec / 3600)} h`;
  return `Il y a ${Math.floor(sec / 86400)} j`;
}

/** Préférences V3 — sync calendrier, etc. */
export const V3PreferencesCard: React.FC<V3PreferencesCardProps> = ({ profile }) => {
  const { colors, productLine } = useAppTheme();
  const brain = useProDayBrain(profile, productLine);
  const [calendarSync, setCalendarSync] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  const refreshLastSync = useCallback(async () => {
    const ts = await getLastCalendarSyncAt(profile.uid);
    setLastSyncAt(ts);
  }, [profile.uid]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([isCalendarSyncEnabled(profile.uid), getLastCalendarSyncAt(profile.uid)]).then(
      ([enabled, ts]) => {
        if (!cancelled) {
          setCalendarSync(enabled);
          setLastSyncAt(ts);
          setLoading(false);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [profile.uid]);

  const onToggleCalendar = useCallback(
    (value: boolean) => {
      setCalendarSync(value);
      void setCalendarSyncEnabled(profile.uid, value);
      trackV3Event('v3_pref_calendar_sync', { enabled: value });
    },
    [profile.uid]
  );

  const onSyncNow = useCallback(async () => {
    if (!calendarSync) {
      Alert.alert('Sync désactivée', 'Activez la synchronisation calendrier pour continuer.');
      return;
    }
    setSyncing(true);
    try {
      const result = await requestAndSyncDeviceCalendar(profile.uid, brain.calendar);
      if (result === 'synced') {
        await refreshLastSync();
        trackV3Event('calendar_manual_sync', { count: brain.calendar.length });
        Alert.alert('Agenda synchronisé', `${brain.calendar.length} événement(s) exporté(s).`);
      } else if (result === 'denied') {
        Alert.alert(
          'Permission requise',
          'Autorisez ProDay à accéder à votre calendrier dans les réglages de l’appareil.'
        );
      } else if (result === 'empty') {
        Alert.alert('Rien à synchroniser', 'Aucun événement planifié pour le moment.');
      } else {
        Alert.alert('Erreur', 'Synchronisation impossible. Réessayez plus tard.');
      }
    } finally {
      setSyncing(false);
    }
  }, [calendarSync, profile.uid, brain.calendar, refreshLastSync]);

  return (
    <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.head}>
        <Icon name="calendar" size={18} color={colors.accent} />
        <View style={styles.copy}>
          <ProDayText variant="section">Préférences ProDay</ProDayText>
          <ProDayText variant="caption" muted>
            Calendrier et synchronisation
          </ProDayText>
        </View>
      </View>

      <View style={[styles.row, { borderTopColor: colors.border }]}>
        <View style={styles.rowCopy}>
          <ProDayText variant="body">Sync calendrier appareil</ProDayText>
          <ProDayText variant="caption" muted>
            Matchs et convocations dans votre agenda iOS/Android
          </ProDayText>
        </View>
        <Switch
          value={calendarSync}
          onValueChange={onToggleCalendar}
          disabled={loading}
          trackColor={{ false: colors.surfaceMuted, true: colors.accentMuted }}
          thumbColor={calendarSync ? colors.accent : colors.textMuted}
        />
      </View>

      <View style={[styles.syncRow, { borderTopColor: colors.border }]}>
        <View style={styles.rowCopy}>
          <ProDayText variant="caption" muted>
            {formatLastSync(lastSyncAt)}
          </ProDayText>
        </View>
        <PressableSpring
          onPress={onSyncNow}
          disabled={syncing || loading}
          style={[styles.syncBtn, { borderColor: colors.border }]}
          scaleTo={0.97}
          haptic
        >
          {syncing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <ProDayText variant="caption" accent style={styles.syncBtnText}>
              Sync maintenant
            </ProDayText>
          )}
        </PressableSpring>
      </View>
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  copy: { flex: 1, gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  rowCopy: { flex: 1, gap: 2 },
  syncBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 108,
    alignItems: 'center',
  },
  syncBtnText: { fontWeight: '800' },
});
