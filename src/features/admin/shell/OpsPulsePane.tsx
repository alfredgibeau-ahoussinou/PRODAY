import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useAdminData } from '../data/AdminDataContext';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminLoading,
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

/**
 * Pulse — tableau de bord Bureau Ops (remplace Tour / Cockpit Total).
 * Chaque tuile et CTA navigue vers une zone avec actions CRUD réelles.
 */
export function OpsPulsePane({ onNavigate, onOpenCommand }: Props) {
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

  if (data.loading || metaLoading) return <AdminLoading label="Initialisation Bureau Ops…" />;

  const pendingUsers = data.users.filter(userNeedsAdminVerificationReview).length;
  const pendingMem = data.pendingMemberships.length;
  const fileTotal = claims + pendingMem + pendingUsers;
  const queue = data.workQueue.slice(0, 10);

  const tiles: {
    id: AdminNavSectionId;
    code: string;
    label: string;
    value: string;
    hint: string;
    tone: 'warn' | 'ok' | 'neutral';
  }[] = [
    {
      id: 'file',
      code: '01',
      label: 'FILE',
      value: String(fileTotal),
      hint: `${claims} claims · ${pendingMem} adhésions · ${pendingUsers} docs`,
      tone: fileTotal > 0 ? 'warn' : 'ok',
    },
    {
      id: 'annuaire',
      code: '02',
      label: 'ANNUAIRE',
      value: String(data.clubs.length),
      hint: `${data.clubs.filter((c) => c.suspended).length} suspendus`,
      tone: 'neutral',
    },
    {
      id: 'comptes',
      code: '03',
      label: 'COMPTES',
      value: String(data.users.length),
      hint: data.stats ? `${data.stats.players} joueurs` : 'comptes live',
      tone: 'neutral',
    },
    {
      id: 'effectifs',
      code: '04',
      label: 'EFFECTIFS',
      value: String(rosterClubs),
      hint: 'caches roster FFF',
      tone: 'neutral',
    },
    {
      id: 'classements',
      code: '05',
      label: 'TABLEAUX',
      value: String(standingsRows),
      hint: 'lignes classements',
      tone: 'neutral',
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
          tintColor={t.signal}
        />
      }
    >
      <View style={styles.masthead}>
        <View style={styles.mastheadTop}>
          <AdminText variant="label" color={t.signal}>
            PRODAY · BUREAU OPS
          </AdminText>
          <AdminBadge
            label={`HEALTH ${data.health.score}`}
            tone={data.health.score >= 80 ? 'success' : data.health.score >= 50 ? 'warn' : 'danger'}
          />
        </View>
        <AdminText variant="display">Pulse</AdminText>
        <AdminText variant="body" color={t.muted}>
          Console fondateur — file, annuaire, comptes, flux FFF. Chaque action appelle un
          callable réel.
        </AdminText>
        <View style={styles.ctaRow}>
          <AdminButton label="Ouvrir commande" onPress={() => onOpenCommand?.()} />
          <AdminButton
            label={fileTotal > 0 ? `Traiter file (${fileTotal})` : 'File claire'}
            variant={fileTotal > 0 ? 'danger' : 'soft'}
            onPress={() => onNavigate('file')}
          />
        </View>
      </View>

      <View style={styles.tileGrid}>
        {tiles.map((tile) => (
          <Pressable
            key={tile.id}
            onPress={() => onNavigate(tile.id)}
            style={[
              styles.tile,
              {
                borderColor: tile.tone === 'warn' ? t.danger : t.ink,
                backgroundColor: t.surface,
              },
            ]}
          >
            <View style={styles.tileHead}>
              <AdminText variant="mono" color={t.faint}>
                {tile.code}
              </AdminText>
              <AdminText variant="label" color={tile.tone === 'warn' ? t.danger : t.signal}>
                {tile.label}
              </AdminText>
            </View>
            <AdminText variant="statSm">{tile.value}</AdminText>
            <AdminText variant="caption" color={t.muted} numberOfLines={2}>
              {tile.hint}
            </AdminText>
          </Pressable>
        ))}
      </View>

      <AdminCard>
        <View style={styles.sectionHead}>
          <AdminText variant="h2">File prioritaire</AdminText>
          <AdminText variant="mono" color={t.faint}>
            {data.workQueue.length} items
          </AdminText>
        </View>
        {queue.length === 0 ? (
          <AdminText variant="body" color={t.muted}>
            Aucune action critique — bureau au vert.
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
                tone={
                  item.priority === 'critical' || item.priority === 'high' ? 'warn' : 'info'
                }
              />
            </Pressable>
          ))
        )}
      </AdminCard>

      <AdminCard>
        <AdminText variant="h2">Actions directes</AdminText>
        <AdminText variant="caption" color={t.muted}>
          Branches vers les panes CRUD branchés aux callables Firebase.
        </AdminText>
        <View style={styles.ctaRow}>
          <AdminButton label="Claims / ID" onPress={() => onNavigate('file')} />
          <AdminButton label="Créer club" variant="soft" onPress={() => onNavigate('annuaire')} />
          <AdminButton label="Rôles users" variant="ghost" onPress={() => onNavigate('comptes')} />
          <AdminButton
            label="Sync classements"
            variant="ghost"
            onPress={() => onNavigate('classements')}
          />
          <AdminButton
            label="Sync effectifs"
            variant="ghost"
            onPress={() => onNavigate('effectifs')}
          />
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
  masthead: {
    borderWidth: 2,
    borderColor: ADMIN_TOKENS.ink,
    backgroundColor: ADMIN_TOKENS.surface,
    padding: adminSpace.xl,
    gap: adminSpace.sm,
  },
  mastheadTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  ctaRow: {
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
    borderRadius: adminRadius.sm,
    borderWidth: 2,
    padding: adminSpace.lg,
    gap: 4,
  },
  tileHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
