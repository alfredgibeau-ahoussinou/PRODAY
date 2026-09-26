import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ClubMatchVideo, MatchVideoClip } from '../../models/ClubCameras';
import { clubCamerasService } from '../../services/clubCameras.service';
import { ProDayText } from '../ui/ProDayText';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';

export interface PlayerEnrichedClip {
  clip: MatchVideoClip;
  video: ClubMatchVideo;
  isFavorite: boolean;
  comments: Array<{
    id: string;
    text: string;
    timestampSec: number;
    createdAt: Date;
  }>;
}

type Props = {
  clubId: string;
  playerUid: string;
  accent?: string;
};

/** Clips / séquences autorisés pour le joueur (droits coach / club) avec favoris et notes horodatées. */
export function JoueurMesVideosPanel({
  clubId,
  playerUid,
  accent = '#00E676',
}: Props) {
  const [loading, setLoading] = useState(true);
  const [enrichedClips, setEnrichedClips] = useState<PlayerEnrichedClip[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all');

  // Player / Detail modal
  const [selectedClip, setSelectedClip] = useState<PlayerEnrichedClip | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSec, setCommentSec] = useState<string>('0');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const videos = await clubCamerasService.listMatchVideos(clubId);
      const results: PlayerEnrichedClip[] = [];

      for (const v of videos) {
        // Enforce permissions: video shared with players or player explicitly in player_uids
        const isPermitted =
          v.share_with.includes('players') ||
          v.player_uids.includes(playerUid) ||
          v.clips.some((c) => c.player_uids?.includes(playerUid));

        if (!isPermitted) continue;

        for (const c of v.clips) {
          const clipForPlayer =
            !c.player_uids ||
            c.player_uids.length === 0 ||
            c.player_uids.includes(playerUid) ||
            v.player_uids.includes(playerUid);

          if (clipForPlayer) {
            results.push({
              clip: c,
              video: v,
              isFavorite: favorites.has(c.id),
              comments: [],
            });
          }
        }
      }
      setEnrichedClips(results);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, [clubId, playerUid, favorites]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFavorite = (clipId: string) => {
    prodayHaptics.selection();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(clipId)) {
        next.delete(clipId);
      } else {
        next.add(clipId);
      }
      return next;
    });
  };

  const handleAddComment = () => {
    if (!selectedClip || !commentText.trim()) return;
    const sec = parseInt(commentSec, 10) || selectedClip.clip.starts_at_sec || 0;

    const newComment = {
      id: `comm_${Date.now()}`,
      text: commentText.trim(),
      timestampSec: sec,
      createdAt: new Date(),
    };

    setSelectedClip((prev) =>
      prev
        ? {
            ...prev,
            comments: [...prev.comments, newComment],
          }
        : null,
    );

    prodayHaptics.confirm();
    setCommentText('');
  };

  const displayedClips = enrichedClips.filter((c) => {
    if (activeFilter === 'favorites') return favorites.has(c.clip.id);
    return true;
  });

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={accent} />
        <ProDayText variant="caption" style={styles.loadingText}>
          Chargement de tes séquences...
        </ProDayText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sub-header with filter tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeFilter === 'all' && [styles.filterChipActive, { borderColor: accent }]]}
          onPress={() => {
            prodayHaptics.selection();
            setActiveFilter('all');
          }}
        >
          <ProDayText
            variant="caption"
            style={[styles.filterChipText, activeFilter === 'all' && { color: accent, fontWeight: '700' }]}
          >
            Toutes les séquences ({enrichedClips.length})
          </ProDayText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            activeFilter === 'favorites' && [styles.filterChipActive, { borderColor: accent }],
          ]}
          onPress={() => {
            prodayHaptics.selection();
            setActiveFilter('favorites');
          }}
        >
          <Ionicons
            name="star"
            size={12}
            color={activeFilter === 'favorites' ? '#F59E0B' : PLAYER_DARK.textMuted}
          />
          <ProDayText
            variant="caption"
            style={[styles.filterChipText, activeFilter === 'favorites' && { color: accent, fontWeight: '700' }]}
          >
            Favoris ({favorites.size})
          </ProDayText>
        </TouchableOpacity>
      </View>

      {displayedClips.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={[styles.emptyIconWrap, { backgroundColor: `${accent}15` }]}>
            <Ionicons name="film-outline" size={24} color={accent} />
          </View>
          <ProDayText variant="section" style={styles.emptyTitle}>
            {activeFilter === 'favorites' ? 'Aucun clip favori' : 'Espace Vidéos & Séquences'}
          </ProDayText>
          <ProDayText variant="caption" style={styles.emptyBody}>
            {activeFilter === 'favorites'
              ? 'Touche l’étoile sur un clip pour l’ajouter à tes favoris et le revoir rapidement.'
              : 'Les séquences de match et analyses personnalisées partagées par ton coach apparaîtront ici dès leur découpage.'}
          </ProDayText>
        </View>
      ) : (
        <View style={styles.listWrap}>
          {displayedClips.map((item) => {
            const isFav = favorites.has(item.clip.id);
            const isProcessing = item.video.status === 'processing';
            const isFailed = item.video.status === 'failed';

            return (
              <TouchableOpacity
                key={item.clip.id}
                style={styles.clipCard}
                onPress={() => {
                  prodayHaptics.selection();
                  setCommentSec(String(item.clip.starts_at_sec || 0));
                  setSelectedClip(item);
                }}
              >
                <View
                  style={[
                    styles.playIconWrap,
                    { backgroundColor: `${accent}20` },
                    isProcessing && { backgroundColor: 'rgba(245, 158, 11, 0.15)' },
                    isFailed && { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                  ]}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#F59E0B" />
                  ) : isFailed ? (
                    <Ionicons name="alert" size={16} color="#EF4444" />
                  ) : (
                    <Ionicons name="play" size={16} color={accent} />
                  )}
                </View>

                <View style={styles.copy}>
                  <ProDayText variant="body" style={styles.clipTitle} numberOfLines={1}>
                    {item.clip.label}
                  </ProDayText>

                  <View style={styles.metaRow}>
                    {item.clip.starts_at_sec != null && item.clip.ends_at_sec != null ? (
                      <ProDayText variant="caption" style={styles.clipMeta}>
                        {formatSec(item.clip.starts_at_sec)} → {formatSec(item.clip.ends_at_sec)}
                      </ProDayText>
                    ) : (
                      <ProDayText variant="caption" style={styles.clipMeta}>
                        Séquence match
                      </ProDayText>
                    )}

                    {item.video.event_title && (
                      <ProDayText variant="caption" style={[styles.clipMeta, { color: accent }]}>
                        • {item.video.event_title}
                      </ProDayText>
                    )}
                  </View>

                  {isProcessing && (
                    <ProDayText variant="caption" style={styles.processingText}>
                      Traitement vidéo en cours...
                    </ProDayText>
                  )}
                </View>

                {/* Favorite toggle */}
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.clip.id);
                  }}
                  style={styles.starBtn}
                  hitSlop={8}
                >
                  <Ionicons
                    name={isFav ? 'star' : 'star-outline'}
                    size={18}
                    color={isFav ? '#F59E0B' : PLAYER_DARK.textMuted}
                  />
                </TouchableOpacity>

                <Ionicons name="chevron-forward" size={14} color={PLAYER_DARK.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Playback & Timestamped Notes Modal */}
      {selectedClip && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setSelectedClip(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="section" style={styles.modalClipTitle}>
                    {selectedClip.clip.label}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.modalClipSub}>
                    {selectedClip.video.title} {selectedClip.video.event_title ? `• ${selectedClip.video.event_title}` : ''}
                  </ProDayText>
                </View>
                <TouchableOpacity onPress={() => setSelectedClip(null)} style={styles.closeModalBtn}>
                  <Ionicons name="close" size={22} color={PLAYER_DARK.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
                {/* Playback Screen / Segment notice */}
                <View style={styles.videoPlayerBox}>
                  {selectedClip.video.status === 'processing' ? (
                    <View style={styles.playerNotice}>
                      <ActivityIndicator size="large" color="#F59E0B" />
                      <ProDayText variant="caption" style={{ color: '#F59E0B', marginTop: 8 }}>
                        Vidéo en cours de traitement sur les serveurs du club.
                      </ProDayText>
                    </View>
                  ) : selectedClip.video.storage_url ? (
                    Platform.OS === 'web' ? (
                      <View style={styles.webVideoContainer}>
                        <video
                          src={selectedClip.video.storage_url}
                          controls
                          style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'contain' }}
                        />
                      </View>
                    ) : (
                      <View style={styles.nativeVideoPlaceholder}>
                        <Ionicons name="play-circle" size={48} color={accent} />
                        <ProDayText variant="caption" style={styles.nativeVideoText}>
                          Lecteur ProDay • Segment {formatSec(selectedClip.clip.starts_at_sec || 0)} -{' '}
                          {formatSec(selectedClip.clip.ends_at_sec || 0)}
                        </ProDayText>
                      </View>
                    )
                  ) : (
                    <View style={styles.playerNotice}>
                      <Ionicons name="videocam-off-outline" size={36} color={PLAYER_DARK.textMuted} />
                      <ProDayText variant="caption" style={{ color: PLAYER_DARK.textMuted, marginTop: 6 }}>
                        Fichier source indisponible ou non synchronisé.
                      </ProDayText>
                    </View>
                  )}
                </View>

                {/* Segment bookmark disclaimer */}
                <View style={styles.segmentNotice}>
                  <Ionicons name="bookmark-outline" size={14} color={accent} />
                  <ProDayText variant="caption" style={[styles.segmentNoticeText, { color: accent }]}>
                    Segment extrait : de {formatSec(selectedClip.clip.starts_at_sec || 0)} à{' '}
                    {formatSec(selectedClip.clip.ends_at_sec || 0)} de la captation complète (aucun
                    fichier doublon créé).
                  </ProDayText>
                </View>

                {/* Timestamped comments / reflections */}
                <ProDayText variant="section" style={styles.commentsTitle}>
                  Mes notes & observations horodatées
                </ProDayText>

                <View style={styles.addCommentRow}>
                  <TextInput
                    style={styles.secInput}
                    keyboardType="numeric"
                    placeholder="Sec"
                    placeholderTextColor={PLAYER_DARK.textMuted}
                    value={commentSec}
                    onChangeText={setCommentSec}
                  />
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Ex: Bonne orientation du corps sur la passe..."
                    placeholderTextColor={PLAYER_DARK.textMuted}
                    value={commentText}
                    onChangeText={setCommentText}
                  />
                  <TouchableOpacity
                    style={[styles.addCommentBtn, { backgroundColor: accent }]}
                    onPress={handleAddComment}
                  >
                    <Ionicons name="send" size={16} color="#000" />
                  </TouchableOpacity>
                </View>

                {selectedClip.comments.length === 0 ? (
                  <ProDayText variant="caption" style={styles.noCommentsText}>
                    Ajoute des notes privées sur ce clip pour te rappeler des consignes ou de tes choix.
                  </ProDayText>
                ) : (
                  <View style={styles.commentsList}>
                    {selectedClip.comments.map((cm) => (
                      <View key={cm.id} style={styles.commentItem}>
                        <View style={[styles.commentSecBadge, { backgroundColor: `${accent}20` }]}>
                          <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
                            {formatSec(cm.timestampSec)}
                          </ProDayText>
                        </View>
                        <ProDayText variant="caption" style={styles.commentText}>
                          {cm.text}
                        </ProDayText>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  loadingWrap: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PLAYER_DARK.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  filterChipActive: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
  },
  filterChipText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: PLAYER_DARK.surface,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
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
    fontSize: 14,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  emptyBody: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  listWrap: {
    gap: 8,
  },
  clipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  playIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  clipTitle: { color: PLAYER_DARK.text, fontWeight: '700', fontSize: 13 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clipMeta: { color: PLAYER_DARK.textMuted, fontSize: 11 },
  processingText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  starBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: PLAYER_DARK.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '65%',
    borderTopWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
  },
  modalClipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  modalClipSub: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  closeModalBtn: {
    padding: 6,
  },
  videoPlayerBox: {
    height: 200,
    backgroundColor: '#000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  webVideoContainer: {
    width: '100%',
    height: '100%',
  },
  nativeVideoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nativeVideoText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12,
  },
  playerNotice: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.2)',
  },
  segmentNoticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
  commentsTitle: {
    color: PLAYER_DARK.text,
    fontSize: 13,
    fontWeight: '700',
  },
  addCommentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secInput: {
    width: 60,
    backgroundColor: PLAYER_DARK.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    paddingHorizontal: 8,
    color: PLAYER_DARK.text,
    fontSize: 12,
    textAlign: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: PLAYER_DARK.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: PLAYER_DARK.text,
    fontSize: 13,
  },
  addCommentBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCommentsText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  commentsList: {
    gap: 8,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  commentSecBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  commentText: {
    color: PLAYER_DARK.text,
    fontSize: 12,
    flex: 1,
  },
});
