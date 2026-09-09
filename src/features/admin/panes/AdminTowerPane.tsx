import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminBrandMark,
  AdminButton,
  AdminCard,
  AdminLoading,
  AdminPaneHeader,
  AdminText,
} from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { adminService } from '../../../services/admin.service';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';
import { resolveAdminWorkItemNavigation } from '../../../utils/adminWorkNavigation';

type Props = {
  onNavigate: (section: AdminNavSectionId, focusId?: string) => void;
  onOpenCommand?: () => void;
};

export function AdminTowerPane({ onNavigate, onOpenCommand }: Props) {
  const data = useAdminData();
  const t = ADMIN_TOKENS;
  const [claims, setClaims] = useState(0);
  const [standingsRows, setStandingsRows] = useState(0);
  const [rosterClubs, setRosterClubs] = useState(0);
  const [metaLoading, setMetaLoading] = useState(true);

  const loadMeta = useCallback(async () => {
    const [c, s, r] = await Promise.all([
      adminService.listPendingPublicClubClaims(50),
      adminService.listLeagueStandingsMeta(40),
      adminService.listClubRosterMeta(40),
    ]);
    setClaims(c.length);
    setStandingsRows(s.reduce((acc, x) => acc + x.rows, 0));
    setRosterClubs(r.length);
  }, []);

  useEffect(() => {
    void loadMeta().finally(() => setMetaLoading(false));
  }, [loadMeta]);

  if (data.loading || metaLoading) return <AdminLoading label="Initialisation Cockpit…" />;

  const pendingUsers = data.users.filter(userNeedsAdminVerificationReview).length;
  const pendingMem = data.pendingMemberships.length;
  const queue = data.workQueue.slice(0, 8);

  const tiles: {
    id: AdminNavSectionId;
    label: string;
    value: string;
    hint: string;
    tone: 'accent' | 'warn' | 'success' | 'info';
  }[] = [
    {
      id: 'clubs',
      label: 'Clubs',
      value: String(data.clubs.length),
      hint: `${data.clubs.filter((c) => c.suspended).length} suspendus`,
      tone: 'info',
    },
    {
      id: 'identite',
      label: 'Claims / ID',
      value: String(claims + pendingMem + pendingUsers),
      hint: `${claims} FFF · ${pendingMem} adhésions · ${pendingUsers} docs`,
      tone: claims + pendingMem + pendingUsers > 0 ? 'warn' : 'success',
    },
    {
      id: 'effectifs',
      label: 'Rosters',
      value: String(rosterClubs),
      hint: 'caches effectifs FFF',
      tone: 'info',
    },
    {
      id: 'classements',
      label: 'Classements',
      value: String(standingsRows),
      hint: 'lignes live',
      tone: 'accent',
    },
    {
      id: 'utilisateurs',
      label: 'Users',
      value: String(data.users.length),
      hint: data.stats ? `${data.stats.players} joueurs` : 'comptes',
      tone: 'info',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={data.refreshing}
          onRefresh={() => {
            void data.refresh();
            void loadMeta();
          }}
          tintColor={t.accent}
        />
      }
    >
      <View style={styles.heroWrap}>
        <LinearGradient
          colors={['rgba(139,168,196,0.18)', 'rgba(2,4,10,0)']}
          style={StyleSheet.absoluteFill}
        />
        <AdminBrandMark />
        <AdminText variant="displaySm" champagne>
          Cockpit Total
        </AdminText>
        <AdminText variant="body" color={t.muted}>
          Tour de contrôle fondateur — clubs, identité, effectifs, classements, comptes.
        </AdminText>
        <View style={styles.heroActions}>
          <AdminButton label="Commande ⌘K" variant="soft" onPress={() => onOpenCommand?.()} />
          <AdminBadge
            label={`Santé ${data.health.score}`}
            tone={data.health.score >= 80 ? 'success' : data.health.score >= 50 ? 'warn' : 'danger'}
          />
        </View>
      </View>

      <View style={styles.tileGrid}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.id}
            onPress={() => onNavigate(tile.id)}
            style={[styles.tile, { borderColor: t.border, backgroundColor: t.surface }]}
          >
            <AdminText variant="label" muted>
              {tile.label}
            </AdminText>
            <AdminText variant="statSm" champagne>
              {tile.value}
            </AdminText>
            <AdminText variant="caption" color={t.faint} numberOfLines={2}>
              {tile.hint}
            </AdminText>
          </Pressable>
        ))}
      </View>

      <AdminCard>
        <AdminPaneHeader title="File d’actions" subtitle={`${data.workQueue.length} items`} />
        {queue.length === 0 ? (
          <AdminText variant="body" color={t.muted}>
            Aucune action critique. Cockpit au vert.
          </AdminText>
        ) : (
          queue.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                const nav = resolveAdminWorkItemNavigation(item);
                onNavigate(nav.section, nav.focusId);
              }}
              style={[styles.queueRow, { borderColor: t.hairline }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <AdminText variant="h3">{item.title}</AdminText>
                <AdminText variant="caption" color={t.muted}>
                  {item.subtitle}
                </AdminText>
              </View>
              <AdminBadge
                label={item.priority}
                tone={item.priority === 'critical' || item.priority === 'high' ? 'warn' : 'info'}
              />
            </Pressable>
          ))
        )}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Raccourcis ops</AdminText>
        <View style={styles.heroActions}>
          <AdminButton label="Claims" onPress={() => onNavigate('identite')} />
          <AdminButton label="Classements" variant="soft" onPress={() => onNavigate('classements')} />
          <AdminButton label="Rosters" variant="ghost" onPress={() => onNavigate('effectifs')} />
          <AdminButton label="Users" variant="ghost" onPress={() => onNavigate('utilisateurs')} />
        </View>
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: adminLayout.pageGutter,
    gap: adminLayout.sectionGap,
    paddingBottom: adminLayout.dockClearance,
  },
  heroWrap: {
    borderRadius: adminRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ADMIN_TOKENS.borderLuxury,
    backgroundColor: ADMIN_TOKENS.surfaceRaised,
    padding: adminSpace.xl,
    gap: adminSpace.sm,
    overflow: 'hidden',
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '47%',
    flexGrow: 1,
    minWidth: 140,
    borderRadius: adminRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: adminSpace.lg,
    gap: 4,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
