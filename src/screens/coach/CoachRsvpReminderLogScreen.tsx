/**
 * Historique des relances — liste des traces `rsvp_reminder_log` de l'inbox
 * staff, triées par date décroissante.
 *
 * L'écran lit le **service réel** (`staffNotificationsService.listReminderLogs`,
 * requête filtrée côté base sur le type) et ne fabrique aucun historique local.
 * Chaque trace est journalisée par `coachRsvpReminders` au moment de l'envoi :
 * relance individuelle (« qui, pour qui, canaux ») ou groupée (« qui, quand,
 * combien de destinataires »).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CoachScreenHeader } from '../../components/coach/CoachScreenHeader';
import { CoachChapterScroll, CoachEmptyState } from '../../components/coach/coachPortalUi';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { staffNotificationsService, type StaffNotification } from '../../services/staffNotifications.service';
import { proRadius, proSemantic, proSpace, proType } from '../../theme/professionalDesign';
import { withAlpha } from '../../components/navigation/tabBarShared';
import type { CoachComponentTokens } from '../../features/coach/theme/coachPitchTokens';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';

type LogMeta = {
  mode?: 'bulk' | 'single';
  reminded_by_uid?: string;
  reminded_by_name?: string | null;
  recipients_count?: number;
  channels?: { player?: boolean; staff?: boolean; guardian?: boolean };
};

function readMeta(meta: Record<string, unknown> | undefined): LogMeta {
  return (meta ?? {}) as LogMeta;
}

function formatDayLabel(date: Date): string {
  const today = new Date();
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSameDay(date, today)) return 'Aujourd’hui';
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (isSameDay(date, yesterday)) return 'Hier';
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

/** Ligne d'historique — les infos viennent de la trace, jamais redevinées. */
function LogRow({ log }: { log: StaffNotification }) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const meta = readMeta(log.meta);
  const isBulk = meta.mode === 'bulk';

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: withAlpha(isBulk ? tokens.accent : proSemantic.warning, 0.12) },
        ]}
      >
        {isBulk ? (
          <MaterialCommunityIcons name="account-group" size={15} color={tokens.accent} />
        ) : (
          <Ionicons name="paper-plane" size={14} color={proSemantic.warning} />
        )}
      </View>
      <View style={styles.rowCopy}>
        <Text numberOfLines={2} style={styles.rowBody}>
          {log.body}
        </Text>
        <View style={styles.rowMetaRow}>
          {meta.reminded_by_name ? (
            <>
              <Ionicons name="person-outline" size={11} color={tokens.muted} />
              <Text style={styles.rowMeta}>{meta.reminded_by_name}</Text>
              <View style={styles.rowDot} />
            </>
          ) : null}
          {isBulk && typeof meta.recipients_count === 'number' ? (
            <>
              <Ionicons name="people-outline" size={11} color={tokens.muted} />
              <Text style={styles.rowMeta}>{meta.recipients_count} destinataires</Text>
              <View style={styles.rowDot} />
            </>
          ) : null}
          {!isBulk && meta.channels ? (
            <>
              {meta.channels.player ? (
                <Ionicons name="phone-portrait-outline" size={11} color={tokens.muted} />
              ) : null}
              {meta.channels.staff ? (
                <Ionicons name="mail-outline" size={11} color={tokens.muted} />
              ) : null}
              {meta.channels.guardian ? (
                <Ionicons name="shield-checkmark-outline" size={11} color={tokens.muted} />
              ) : null}
              <View style={styles.rowDot} />
            </>
          ) : null}
          <Text style={styles.rowMeta}>{formatTime(log.created_at)}</Text>
        </View>
      </View>
    </View>
  );
}

export const CoachRsvpReminderLogScreen: React.FC = () => {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const profile = useSessionProfile();
  const [logs, setLogs] = useState<StaffNotification[] | null>(null);

  const load = useCallback(async () => {
    if (!profile?.uid) {
      setLogs([]);
      return;
    }
    const rows = await staffNotificationsService.listReminderLogs(profile.uid);
    setLogs(rows);
  }, [profile?.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Groupe par jour, trié du plus récent au plus ancien (le service trie déjà). */
  const dayGroups = useMemo(() => {
    if (!logs) return [];
    const groups: { label: string; items: StaffNotification[] }[] = [];
    for (const log of logs) {
      const label = formatDayLabel(log.created_at);
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.items.push(log);
      } else {
        groups.push({ label, items: [log] });
      }
    }
    return groups;
  }, [logs]);

  return (
    <View style={styles.root}>
      <CoachScreenHeader title="Historique des relances" fallbackNavId="plus" />
      <CoachChapterScroll>
        {logs === null ? (
          <View style={styles.centerBlock}>
            <ActivityIndicator size="small" color={tokens.accent} />
          </View>
        ) : logs.length === 0 ? (
          <CoachEmptyState
            title="Aucune relance pour l’instant"
            body="Les relances envoyées depuis l'accueil ou la feuille des réponses en attente apparaîtront ici."
          />
        ) : (
          dayGroups.map((group) => (
            <View key={group.label} style={styles.dayGroup}>
              <Text style={styles.dayLabel}>{group.label}</Text>
              <View style={styles.dayList}>
                {group.items.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </View>
            </View>
          ))
        )}
      </CoachChapterScroll>
    </View>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: tokens.bg,
    },
    centerBlock: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: proSpace.xl,
    },
    dayGroup: {
      gap: proSpace.sm,
      marginBottom: proSpace.lg,
    },
    dayLabel: {
      ...proType.label,
      color: tokens.muted,
      paddingHorizontal: proSpace.lg,
    },
    dayList: {
      paddingHorizontal: proSpace.lg,
      gap: proSpace.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.md,
      backgroundColor: tokens.surface,
      borderRadius: proRadius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      padding: proSpace.md,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowCopy: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    rowBody: {
      ...proType.body,
      color: tokens.foreground,
    },
    rowMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexWrap: 'wrap',
    },
    rowMeta: {
      ...proType.caption,
      color: tokens.muted,
    },
    rowDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: tokens.muted,
    },
  });

export default CoachRsvpReminderLogScreen;
