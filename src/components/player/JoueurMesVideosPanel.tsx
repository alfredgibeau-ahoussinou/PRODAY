import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { MatchVideoClip } from '../../models/ClubCameras';
import { clubCamerasService } from '../../services/clubCameras.service';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { spacing } from '../../theme/designTokens';

type Props = {
  clubId: string;
  playerUid: string;
  accent?: string;
};

/** Clips / séquences autorisés pour le joueur (droits coach / club). */
export function JoueurMesVideosPanel({
  clubId,
  playerUid,
  accent = '#4C8BFF',
}: Props) {
  const [loading, setLoading] = useState(true);
  const [clips, setClips] = useState<MatchVideoClip[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await clubCamerasService.listClipsForPlayer(clubId, playerUid);
      setClips(list);
    } finally {
      setLoading(false);
    }
  }, [clubId, playerUid]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={[styles.wrap, { borderColor: `${accent}33` }]}>
      <View style={styles.head}>
        <Icon name="videocam" size={16} color={accent} />
        <ProDayText variant="caption" style={[styles.kicker, { color: accent }]}>
          Mes vidéos
        </ProDayText>
      </View>
      <ProDayText variant="section" style={styles.title}>
        {loading ? '…' : `${clips.length} vidéo(s) disponibles`}
      </ProDayText>
      <ProDayText variant="caption" style={styles.muted}>
        Uniquement les séquences que ton coach ou ton club t’a partagées.
      </ProDayText>

      {loading ? <ActivityIndicator color={accent} style={{ marginTop: spacing.sm }} /> : null}

      {!loading && !clips.length ? (
        <ProDayText variant="caption" style={styles.empty}>
          Pas encore de clip personnel. Dès qu’une action te sera adressée, elle apparaîtra ici.
        </ProDayText>
      ) : null}

      {!loading
        ? clips.slice(0, 8).map((c) => (
            <View key={c.id} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: accent }]} />
              <View style={styles.copy}>
                <ProDayText variant="section" style={styles.clipTitle}>
                  {c.label}
                </ProDayText>
                <ProDayText variant="caption" style={styles.muted}>
                  {c.starts_at_sec != null && c.ends_at_sec != null
                    ? `${formatSec(c.starts_at_sec)} → ${formatSec(c.ends_at_sec)}`
                    : 'Séquence partagée'}
                </ProDayText>
              </View>
            </View>
          ))
        : null}
    </View>
  );
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: '800',
  },
  title: { color: JOUEUR_SITE.foreground, fontWeight: '800' },
  muted: { color: JOUEUR_SITE.muted, lineHeight: 18 },
  empty: { color: JOUEUR_SITE.muted, marginTop: spacing.sm, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  copy: { flex: 1, gap: 2 },
  clipTitle: { color: JOUEUR_SITE.foreground, fontWeight: '700', fontSize: 14 },
});
