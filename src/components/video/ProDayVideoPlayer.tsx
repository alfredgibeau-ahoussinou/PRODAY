import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { VeoMatchStream } from '../../services/veo/veoLiveStream.service';

interface ProDayVideoPlayerProps {
  stream?: VeoMatchStream | null;
  streamUrl?: string;
  videoType?: 'live' | 'replay' | 'imported' | string;
  isLive?: boolean;
  opponent?: string;
  onClose?: () => void;
  onRefresh?: () => void;
  title?: string;
  autoPlay?: boolean;
}

export const ProDayVideoPlayer: React.FC<ProDayVideoPlayerProps> = ({
  stream: streamProp,
  streamUrl,
  videoType,
  isLive,
  opponent,
  onClose,
  onRefresh,
  title,
  autoPlay = true,
}) => {
  const stream: VeoMatchStream | null = streamProp || (streamUrl ? {
    id: 'direct-stream',
    match_id: 'match-direct',
    club_id: 'club-direct',
    title: title || 'Diffusion vidéo',
    opponent,
    stream_kind: (videoType === 'live' || videoType === 'imported' ? videoType : 'replay') as any,
    is_live: Boolean(isLive),
    status: isLive ? 'live' : 'ready',
    stream_url: streamUrl,
    updated_at: new Date().toISOString(),
  } : null);

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBuffering, setIsBuffering] = useState(false);

  // Source vidéo directe si disponible (.m3u8 HLS ou .mp4)
  const videoSource = stream?.stream_url || null;

  // Création du player expo-video
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = stream?.stream_kind !== 'live';
    p.muted = isMuted;
    if (autoPlay && videoSource) {
      try {
        p.play();
      } catch {
        // Autoplay policy fallback
      }
    }
  });

  useEffect(() => {
    if (!player) return;
    const subStatus = player.addListener('statusChange', (status) => {
      if (status.status === 'error') {
        setHasError(true);
        setErrorMessage(status.error?.message || 'Erreur lors de la lecture du flux VEO');
      } else if (status.status === 'readyToPlay') {
        setHasError(false);
        setErrorMessage(null);
      }
      setIsBuffering(status.status === 'loading');
    });

    return () => {
      subStatus.remove();
    };
  }, [player]);

  const togglePlay = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const toggleMute = () => {
    if (!player) return;
    const nextMuted = !isMuted;
    player.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleRetry = () => {
    setHasError(false);
    setErrorMessage(null);
    if (onRefresh) {
      onRefresh();
    }
    if (player && videoSource) {
      try {
        player.replace(videoSource);
        player.play();
      } catch (e) {
        console.warn('[VEO] Erreur lors du retry:', e);
      }
    }
  };

  // 1. État : Aucune diffusion en cours
  if (!stream || (!stream.stream_url && !stream.embed_url)) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="videocam-off-outline" size={36} color="#94A3B8" />
        </View>
        <Text style={styles.emptyTitle}>Aucune diffusion VEO en cours</Text>
        <Text style={styles.emptySubtitle}>
          La caméra Veo n’émet actuellement aucun flux live pour cette rencontre.
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh || handleRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={16} color="#000000" />
          <Text style={styles.refreshButtonText}>Actualiser le flux</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 2. Erreur de lecture ou perte réseau
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={38} color="#EF4444" />
        <Text style={styles.errorTitle}>Signal VEO interrompu</Text>
        <Text style={styles.errorMessage}>
          {errorMessage || 'Impossible de joindre le flux vidéo. Vérifiez la connexion 4G/5G de la Veo.'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <Ionicons name="reload" size={15} color="#FFFFFF" />
          <Text style={styles.retryButtonText}>Relancer la diffusion</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderKindBadge = () => {
    if (stream.stream_kind === 'live') {
      return (
        <View style={styles.liveBadge}>
          <View style={styles.liveIndicatorDot} />
          <Text style={styles.liveBadgeText}>EN DIRECT VEO</Text>
        </View>
      );
    }
    if (stream.stream_kind === 'replay') {
      return (
        <View style={styles.replayBadge}>
          <Ionicons name="refresh-circle" size={13} color="#FFFFFF" />
          <Text style={styles.badgeText}>REPLAY VEO</Text>
        </View>
      );
    }
    return (
      <View style={styles.importBadge}>
        <Ionicons name="film" size={12} color="#00F59B" />
        <Text style={[styles.badgeText, { color: '#00F59B' }]}>VIDÉO CLUB</Text>
      </View>
    );
  };

  const renderPlayerControls = () => (
    <View style={styles.controlsOverlay}>
      <View style={styles.topControlRow}>
        <View style={styles.badgesRow}>
          {renderKindBadge()}
          {stream.is_live && stream.latency_sec != null ? (
            <View style={styles.latencyBadge}>
              <Text style={styles.latencyText}>Latence ~{stream.latency_sec}s</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.topActionsRow}>
          {onRefresh ? (
            <TouchableOpacity
              onPress={onRefresh}
              style={styles.controlCircleBtn}
              accessibilityLabel="Recharger le flux"
            >
              <Ionicons name="refresh" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
          {onClose ? (
            <TouchableOpacity
              onPress={onClose}
              style={styles.controlCircleBtn}
              accessibilityLabel="Fermer le lecteur"
            >
              <Ionicons name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Titre du match au centre */}
      {title || stream.title ? (
        <View style={styles.titleContainer}>
          <Text style={styles.streamTitle} numberOfLines={1}>
            {title || stream.title}
          </Text>
        </View>
      ) : null}

      {/* Barre basse des contrôles */}
      <View style={styles.bottomControlRow}>
        <TouchableOpacity
          onPress={togglePlay}
          style={styles.actionPlayBtn}
          accessibilityLabel={player?.playing ? 'Pause' : 'Lecture'}
        >
          <Ionicons
            name={player?.playing ? 'pause' : 'play'}
            size={18}
            color="#000000"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleMute}
          style={styles.controlSquareBtn}
          accessibilityLabel={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={16}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={() => setIsFullscreen(!isFullscreen)}
          style={styles.controlSquareBtn}
          accessibilityLabel={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
        >
          <Ionicons
            name={isFullscreen ? 'contract' : 'expand'}
            size={16}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderContent = () => (
    <View style={[styles.playerWrapper, isFullscreen && styles.fullscreenWrapper]}>
      {videoSource && player ? (
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          allowsFullscreen
          allowsPictureInPicture
          contentFit="contain"
        />
      ) : stream.embed_url && Platform.OS === 'web' ? (
        // Web Embed fallback
        <iframe
          src={stream.embed_url}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000000',
          }}
          allow="autoplay; fullscreen; encrypted-media"
          title={stream.title}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Diffusion non lisible nativement</Text>
        </View>
      )}

      {isBuffering ? (
        <View style={styles.bufferingOverlay}>
          <ActivityIndicator size="large" color="#00F59B" />
        </View>
      ) : null}

      {renderPlayerControls()}
    </View>
  );

  if (isFullscreen) {
    return (
      <Modal
        visible={isFullscreen}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={styles.fullscreenModalRoot}>{renderContent()}</View>
      </Modal>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenWrapper: {
    width: '100%',
    height: '100%',
    aspectRatio: undefined,
    borderRadius: 0,
  },
  fullscreenModalRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    justifyContent: 'space-between',
    padding: 12,
  },
  topControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 5,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  replayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  importBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 245, 155, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#00F59B',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  latencyBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  latencyText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'center',
    maxWidth: '85%',
  },
  streamTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionPlayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00F59B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlSquareBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
    maxWidth: 280,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00F59B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  refreshButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  errorContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1E1B2E',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  errorMessage: {
    color: '#F87171',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 14,
    maxWidth: 260,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
