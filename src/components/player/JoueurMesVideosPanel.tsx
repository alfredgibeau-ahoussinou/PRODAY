import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MatchVideoClip } from '../../models/ClubCameras';
import { clubCamerasService } from '../../services/clubCameras.service';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import { ProDayText } from '../ui/ProDayText';
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

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={accent} />
        <Text style={styles.loadingText}>Chargement de vos séquences...</Text>
      </View>
    );
  }

  if (!clips.length) {
    return (
      <View style={styles.emptyCard}>
        <View style={[styles.emptyIconWrap, { backgroundColor: `${accent}15` }]}>
          <Ionicons name="film-outline" size={24} color={accent} />
        </View>
        <Text style={styles.emptyTitle}>Espace Vidéos & Découpages</Text>
        <Text style={styles.emptyBody}>
          Les séquences de match et analyses personnalisées partagées par votre coach ou votre club apparaîtront ici.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listWrap}>
      <Text style={styles.countText}>{clips.length} séquence(s) disponible(s)</Text>
      {clips.slice(0, 8).map((c) => (
        <View key={c.id} style={styles.clipCard}>
          <View style={[styles.playIconWrap, { backgroundColor: `${accent}20` }]}>
            <Ionicons name="play" size={14} color={accent} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.clipTitle}>{c.label}</Text>
            <Text style={styles.clipMeta}>
              {c.starts_at_sec != null && c.ends_at_sec != null
                ? `${formatSec(c.starts_at_sec)} → ${formatSec(c.ends_at_sec)}`
                : 'Séquence partagée'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.3)" />
        </View>
      ))}
    </View>
  );
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  loadingWrap: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderStyle: 'dashed',
    gap: 8,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyBody: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    lineHeight: 17,
  },
  listWrap: {
    gap: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  clipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  playIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  clipTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  clipMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
});
