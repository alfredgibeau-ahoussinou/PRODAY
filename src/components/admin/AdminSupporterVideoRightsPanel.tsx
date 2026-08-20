import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AdminFocCard } from './foc/AdminFocCard';
import { adminChrome } from '../../theme/adminTheme';
import { spacing, radius } from '../../theme/designTokens';
import { useAuth } from '../../context/AuthContext';
import { supporterVideoRightsService } from '../../services/supporterVideoRights.service';
import type { SupporterVideoRights } from '../../models/SupporterVideo';
import { teamEventsService } from '../../services/teamEvents.service';
import { extractProdayOfficialWatchUrl } from '../../utils/supporterBroadcast';

const RIGHTS_OPTIONS: SupporterVideoRights[] = [
  'AVAILABLE',
  'RESTRICTED',
  'PRIVATE',
  'PROCESSING',
  'UNAVAILABLE',
];

type Row = {
  videoId: string;
  title: string;
  matchId?: string;
  rights: SupporterVideoRights;
  source: 'override' | 'event';
};

/** Admin — droits vidéo supporter (ProDay / communauté). */
export const AdminSupporterVideoRightsPanel: React.FC = () => {
  const { profile } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overrides, events] = await Promise.all([
        supporterVideoRightsService.listForAdmin(60),
        teamEventsService.listUpcoming(80),
      ]);

      const overrideMap = new Map(overrides.map((o) => [o.videoId, o.rights]));
      const fromEvents: Row[] = (events ?? [])
        .filter((e) => e.public_watch_url || extractProdayOfficialWatchUrl({ public_watch_url: e.public_watch_url, description: e.description }))
        .map((e) => {
          const videoId = `proday:${e.id}:proday_full`;
          const watchUrl = extractProdayOfficialWatchUrl({
            public_watch_url: e.public_watch_url,
            description: e.description,
          });
          const defaultRights: SupporterVideoRights = watchUrl
            ? 'AVAILABLE'
            : e.public_watch_url
              ? 'PROCESSING'
              : 'UNAVAILABLE';
          return {
            videoId,
            title: `${e.club_name ?? 'ProDay'} vs ${e.live_state?.opponent_name ?? e.title}`,
            matchId: `proday-event-${e.id}`,
            rights: overrideMap.get(videoId) ?? defaultRights,
            source: overrideMap.has(videoId) ? 'override' : 'event',
          } as Row;
        });

      const overrideOnly: Row[] = overrides
        .filter((o) => !fromEvents.some((r) => r.videoId === o.videoId))
        .map((o) => ({
          videoId: o.videoId,
          title: o.title ?? o.videoId,
          matchId: o.matchId,
          rights: o.rights,
          source: 'override' as const,
        }));

      setRows([...fromEvents, ...overrideOnly]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cycleRights = async (row: Row) => {
    if (!profile?.uid) return;
    const idx = RIGHTS_OPTIONS.indexOf(row.rights);
    const next = RIGHTS_OPTIONS[(idx + 1) % RIGHTS_OPTIONS.length];
    setSavingId(row.videoId);
    try {
      await supporterVideoRightsService.saveOverride(row.videoId, next, {
        title: row.title,
        matchId: row.matchId,
        adminUid: profile.uid,
      });
      setRows((prev) =>
        prev.map((r) => (r.videoId === row.videoId ? { ...r, rights: next, source: 'override' } : r)),
      );
    } finally {
      setSavingId(null);
    }
  };

  const styles = useMemo(() => createStyles(), []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={adminChrome.accent} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Droits vidéo Supporter</Text>
      <Text style={styles.sub}>
        Overrides Firestore `supporter_video_rights`. Tap pour changer le statut.
      </Text>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.videoId}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <AdminFocCard>
            <Text style={styles.empty}>Aucune vidéo ProDay avec URL publique.</Text>
          </AdminFocCard>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => void cycleRights(item)}
            disabled={savingId === item.videoId}
            style={styles.row}
          >
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.rowMeta}>{item.videoId}</Text>
            </View>
            <View style={[styles.badge, badgeStyle(item.rights)]}>
              <Text style={styles.badgeText}>
                {savingId === item.videoId ? '…' : item.rights}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
};

function badgeStyle(rights: SupporterVideoRights) {
  switch (rights) {
    case 'AVAILABLE':
      return { backgroundColor: 'rgba(52,211,153,0.2)' };
    case 'RESTRICTED':
    case 'PRIVATE':
      return { backgroundColor: 'rgba(251,191,36,0.2)' };
    case 'PROCESSING':
      return { backgroundColor: 'rgba(96,165,250,0.2)' };
    default:
      return { backgroundColor: 'rgba(148,163,184,0.2)' };
  }
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, padding: spacing.md },
    centered: { padding: spacing.xl, alignItems: 'center' },
    title: { color: adminChrome.text, fontSize: 18, fontWeight: '700' },
    sub: { color: adminChrome.textMuted, fontSize: 13, marginBottom: spacing.md, lineHeight: 18 },
    list: { gap: spacing.sm, paddingBottom: spacing.xxl },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: adminChrome.shellElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    rowCopy: { flex: 1, gap: 4 },
    rowTitle: { color: adminChrome.text, fontSize: 14 },
    rowMeta: { color: adminChrome.textMuted, fontSize: 10 },
    badge: { paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill },
    badgeText: { color: adminChrome.text, fontSize: 10, fontWeight: '700' },
    empty: { color: adminChrome.textMuted },
  });
}
