import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AdminFocCard } from '../../../components/admin/foc';
import { ADMIN_VIDEO_VEO_DEMO } from '../../../content/adminVideoVeoExplainer';
import { adminService } from '../../../services/admin.service';
import type { ClubCamera } from '../../../models/ClubCameras';
import { vendorLabel } from '../../../models/ClubCameras';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

function statusVisual(status: ClubCamera['status'], sync: ClubCamera['sync_status']): {
  label: string;
  color: string;
} {
  if (status === 'disconnected' || status === 'error') {
    return { label: 'Hors ligne', color: adminChrome.danger };
  }
  if (sync === 'syncing' || status === 'pending') {
    return { label: 'Traitement', color: adminChrome.warning };
  }
  return { label: 'Disponible', color: adminChrome.success };
}

/** Caméras & vidéo — données Firestore réelles (OAuth vendeurs encore stub). */
export function AdminFocVideoScreen() {
  const styles = useMemo(() => createStyles(), []);
  const [cameras, setCameras] = useState<ClubCamera[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setCameras(await adminService.listAllClubCameras(120));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Caméras & vidéo</Text>
        <Text style={styles.sub}>
          Statut lecture seule. La connexion caméra se fait depuis l’espace Club (Centre Vidéo), pas depuis cet écran admin.
        </Text>
      </View>
      <FlatList
        data={cameras}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={load}
            tintColor={adminChrome.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.explainCard}>
            <AdminFocCard>
              <Text style={styles.explainEyebrow}>{ADMIN_VIDEO_VEO_DEMO.eyebrow}</Text>
              <Text style={styles.explainTitle}>{ADMIN_VIDEO_VEO_DEMO.title}</Text>
              <Text style={styles.explainBody}>{ADMIN_VIDEO_VEO_DEMO.lead}</Text>
              <Text style={styles.explainPitch}>{ADMIN_VIDEO_VEO_DEMO.pitch}</Text>
              <Text style={styles.explainHint}>
                Connexion caméra : via Club → Centre Vidéo. Pas de bouton Connect ici (OAuth fabricant non branché).
              </Text>
            </AdminFocCard>
          </View>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aucune caméra enregistrée. Les clubs connectent leurs appareils depuis l’espace Club — cet écran n’ajoute pas de connexion OAuth.
          </Text>
        }
        renderItem={({ item }) => {
          const vis = statusVisual(item.status, item.sync_status);
          return (
            <AdminFocCard>
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: vis.color }]} />
                <View style={styles.copy}>
                  <Text style={styles.camTitle}>
                    {item.brand_label || vendorLabel(item.vendor)} · {item.model}
                  </Text>
                  <Text style={styles.camSub}>
                    {item.team_label || 'Équipe non liée'}
                    {item.last_match_title ? ` · ${item.last_match_title}` : ''}
                  </Text>
                </View>
                <Text style={[styles.status, { color: vis.color }]}>{vis.label}</Text>
              </View>
            </AdminFocCard>
          );
        }}
      />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.shell },
    header: {
      padding: spacing.md,
      gap: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
    },
    title: { color: adminChrome.text, fontSize: 22, fontWeight: '800' },
    sub: { color: adminChrome.textMuted, fontSize: 13, lineHeight: 18 },
    list: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl * 2 },
    explainCard: { marginBottom: spacing.sm },
    explainEyebrow: {
      color: adminChrome.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    explainTitle: { color: adminChrome.text, fontWeight: '800', fontSize: 15, marginBottom: 4 },
    explainBody: { color: adminChrome.textMuted, fontSize: 12, lineHeight: 17 },
    explainPitch: {
      color: adminChrome.text,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
      marginTop: 8,
    },
    explainHint: {
      color: adminChrome.accent,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 8,
    },
    empty: { color: adminChrome.textMuted, padding: spacing.lg, lineHeight: 20 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    dot: { width: 10, height: 10, borderRadius: 5 },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    camTitle: { color: adminChrome.text, fontWeight: '700', fontSize: 14 },
    camSub: { color: adminChrome.textMuted, fontSize: 12 },
    status: { fontWeight: '800', fontSize: 11 },
  });
}
