import React, { useCallback, useEffect, useState } from 'react';
import { View, Switch, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import type { User } from '../../models/User';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import {
  isCalendarSyncEnabled,
  setCalendarSyncEnabled,
  getLastCalendarSyncAt,
} from '../../services/v3Preferences.service';
import { requestAndSyncDeviceCalendar } from '../../services/deviceCalendar.service';
import { useProDayBrain } from '../../hooks/useProDayBrain';
import { trackV3Event } from '../../core/analytics/v3Events';
import { PressableSpring } from '../motion';
import { LanguageSettingControl } from '../settings/LanguageSettingControl';

interface ProfilePreferencesCardProps {
  profile: User;
}

/** Préférences compte — langue, sync calendrier, etc. */
export const ProfilePreferencesCard: React.FC<ProfilePreferencesCardProps> = ({ profile }) => {
  const { colors, productLine } = useAppTheme();
  const { t } = useTranslation();
  const brain = useProDayBrain(profile, productLine);
  const [calendarSync, setCalendarSync] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);

  const formatLastSync = useCallback(
    (ts: number | null): string => {
      if (!ts) return t('preferences.neverSynced');
      const sec = Math.floor((Date.now() - ts) / 1000);
      if (sec < 120) return t('preferences.syncedJustNow');
      if (sec < 3600) return t('preferences.syncedMinutes', { n: Math.floor(sec / 60) });
      if (sec < 86400) return t('preferences.syncedHours', { n: Math.floor(sec / 3600) });
      return t('preferences.syncedDays', { n: Math.floor(sec / 86400) });
    },
    [t]
  );

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
      trackV3Event('pref_calendar_sync', { enabled: value });
    },
    [profile.uid]
  );

  const onSyncNow = useCallback(async () => {
    if (!calendarSync) {
      Alert.alert(t('preferences.syncDisabled'), t('preferences.syncDisabledBody'));
      return;
    }
    setSyncing(true);
    try {
      const result = await requestAndSyncDeviceCalendar(profile.uid, brain.calendar);
      if (result === 'synced') {
        await refreshLastSync();
        trackV3Event('calendar_manual_sync', { count: brain.calendar.length });
        Alert.alert(
          t('preferences.syncOk'),
          t('preferences.syncOkBody', { n: brain.calendar.length })
        );
      } else if (result === 'denied') {
        Alert.alert(t('preferences.syncPermission'), t('preferences.syncPermissionBody'));
      } else if (result === 'empty') {
        Alert.alert(t('preferences.syncEmpty'), t('preferences.syncEmptyBody'));
      } else {
        Alert.alert('Erreur', t('preferences.syncError'));
      }
    } finally {
      setSyncing(false);
    }
  }, [brain.calendar, calendarSync, profile.uid, refreshLastSync, t]);

  return (
    <>
      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <View style={styles.head}>
          <Icon name="settings" size={18} color={colors.accent} />
          <View style={styles.copy}>
            <ProDayText variant="section">{t('preferences.title')}</ProDayText>
            <ProDayText variant="caption" muted>
              {t('preferences.subtitle')}
            </ProDayText>
          </View>
        </View>

        <LanguageSettingControl variant="row" />

        <View style={[styles.row, { borderTopColor: colors.border }]}>
          <View style={styles.rowCopy}>
            <ProDayText variant="body">{t('preferences.calendarSync')}</ProDayText>
            <ProDayText variant="caption" muted>
              {t('preferences.calendarSyncHint')}
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
                {t('preferences.syncNow')}
              </ProDayText>
            )}
          </PressableSpring>
        </View>
      </ProDaySurface>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
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
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowCopy: { flex: 1, gap: 2 },
  syncBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 108,
    alignItems: 'center',
  },
  syncBtnText: { fontWeight: '800' },
});
