/**
 * Lecteur Vidéo Intégré ProDay — Multi-plateformes (iPhone, iPad/Tablette, Mac, PC)
 * Supporte les flux directs Veo (MP4/HLS), embeds Veo et vidéos club.
 * Gestion robuste des erreurs, déconnexions et reprise de lecture.
 *
 * Plein écran mobile (iOS/Android) : Modal plein écran + verrou paysage
 * (useVideoOrientationLock) + marges de safe area appliquées **aux commandes
 * seulement** (le flux reste pleine face, y compris sous l'encoche). La
 * position de lecture est capturée avant le basculement et restaurée au
 * remontage — le visionnage ne repart jamais de zéro.
 * Web/desktop : agrandissement sur place (pas de Modal ni de verrou natif).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { WebView } from 'react-native-webview';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { colors } from '../../theme/designTokens';
import { useVideoOrientationLock } from '../../features/video/useVideoOrientationLock';

export interface ProDayIntegratedVideoPlayerProps {
  sourceUrl: string;
  title: string;
  matchInfo?: string;
  autoPlay?: boolean;
  onClose?: () => void;
  isModal?: boolean;
  isLive?: boolean;
  userRole?: 'club' | 'coach' | 'player' | 'parent';
  allowedRoles?: ('club' | 'coach' | 'player' | 'parent')[];
}

const isVeoEmbedSource = (sourceUrl: string) =>
  sourceUrl.includes('/embed/') || sourceUrl.includes('veo.co/matches/');

// -------------------------------------------------------------
// Composant Web (PC & Mac) : HTML5 <video> / <iframe> responsive
// -------------------------------------------------------------
const WebVideoRenderer: React.FC<{
  sourceUrl: string;
  autoPlay: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onPlayStateChange: (playing: boolean) => void;
  onError: (err: string) => void;
  onReady: () => void;
}> = ({ sourceUrl, autoPlay, videoRef, onPlayStateChange, onError, onReady }) => {
  const isEmbed = isVeoEmbedSource(sourceUrl);

  if (isEmbed) {
    // Si c'est une URL Veo match directe, on la convertit en embed si possible
    let embedUrl = sourceUrl;
    if (sourceUrl.includes('/matches/') && !sourceUrl.includes('/embed/')) {
      embedUrl = sourceUrl.replace('/matches/', '/embed/');
    }

    return (
      <View style={styles.mediaContainer}>
        {/* @ts-ignore Web iframe support */}
        <iframe
          src={embedUrl}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 12,
            backgroundColor: '#000000',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={onReady}
          onError={() => onError('Impossible de charger le lecteur intégré Veo')}
        />
      </View>
    );
  }

  return (
    <View style={styles.mediaContainer}>
      {/* @ts-ignore Web video element support */}
      <video
        ref={videoRef}
        src={sourceUrl}
        controls
        autoPlay={autoPlay}
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          borderRadius: 12,
          backgroundColor: '#000000',
        }}
        onCanPlay={onReady}
        onPlay={() => onPlayStateChange(true)}
        onPause={() => onPlayStateChange(false)}
        onEnded={() => onPlayStateChange(false)}
        onError={() => onError('Erreur de lecture du flux vidéo')}
      />
    </View>
  );
};

// -------------------------------------------------------------
// Composant Natif (iPhone, iPad & Android) : expo-video VideoView
// -------------------------------------------------------------
const NativeVideoRenderer: React.FC<{
  sourceUrl: string;
  autoPlay: boolean;
  playerRef: React.MutableRefObject<any>;
  onPlayStateChange: (playing: boolean) => void;
  onError: (err: string) => void;
  onReady: () => void;
}> = ({ sourceUrl, autoPlay, playerRef, onPlayStateChange, onError, onReady }) => {
  if (isVeoEmbedSource(sourceUrl)) {
    const embedUrl = sourceUrl.includes('/matches/') && !sourceUrl.includes('/embed/')
      ? sourceUrl.replace('/matches/', '/embed/')
      : sourceUrl;

    return (
      <View style={styles.mediaContainer}>
        <WebView
          source={{ uri: embedUrl }}
          style={styles.nativeVideo}
          allowsFullscreenVideo
          javaScriptEnabled
          onLoad={onReady}
          onError={() => onError('Impossible de charger le lecteur intégré Veo')}
        />
      </View>
    );
  }

  const player = useVideoPlayer(sourceUrl, (instance) => {
    instance.loop = false;
    if (autoPlay) {
      instance.play();
    }
  });

  playerRef.current = player;

  useEffect(() => {
    const subStatus = player.addListener('statusChange', ({ status, error }) => {
      if (status === 'error') {
        onError(error?.message || 'Erreur lors du chargement du flux vidéo natif');
      } else if (status === 'readyToPlay') {
        onReady();
      }
    });

    const subPlaying = player.addListener('playingChange', ({ isPlaying }) => {
      onPlayStateChange(isPlaying);
    });

    return () => {
      subStatus.remove();
      subPlaying.remove();
    };
  }, [player, onError, onReady, onPlayStateChange]);

  return (
    <View style={styles.mediaContainer}>
      <VideoView
        player={player}
        style={styles.nativeVideo}
        contentFit="contain"
        nativeControls
        allowsPictureInPicture
      />
    </View>
  );
};

// -------------------------------------------------------------
// Conteneur Principal du Lecteur Vidéo Universel
// -------------------------------------------------------------
export const ProDayIntegratedVideoPlayer: React.FC<ProDayIntegratedVideoPlayerProps> = ({
  sourceUrl,
  title,
  matchInfo,
  autoPlay = true,
  onClose,
  isModal = false,
  isLive = false,
  userRole = 'coach',
  allowedRoles = ['club', 'coach', 'player', 'parent'],
}) => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const nativePlayerRef = useRef<any>(null);
  /** Position de lecture (s) capturée avant l'entrée en plein écran. */
  const resumePositionRef = useRef<number | null>(null);
  /** La lecture tournait-elle au moment du basculement ? (reprise vs pause) */
  const wasPlayingRef = useRef(false);

  const insets = useSafeAreaInsets();
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
  /**
   * Plein écran par Modal sur mobile uniquement — sur web/desktop le lecteur
   * s'agrandit sur place (pas de verrou d'orientation natif, pas de remontage
   * du renderer, donc aucune reprise de position à gérer).
   */
  const useModalFullscreen = isNative;
  /** Verrou paysage pendant la lecture plein écran (no-op web — hook gardé). */
  useVideoOrientationLock(useModalFullscreen && isFullScreen);

  // Vérification stricte des autorisations de diffusion
  const isAuthorized = useMemo(() => {
    return allowedRoles.includes(userRole);
  }, [allowedRoles, userRole]);

  const togglePlay = () => {
    if (Platform.OS === 'web') {
      if (webVideoRef.current) {
        if (webVideoRef.current.paused) {
          void webVideoRef.current.play().catch(() => {
            /* ignore autoplay block */
          });
          setIsPlaying(true);
        } else {
          webVideoRef.current.pause();
          setIsPlaying(false);
        }
      } else {
        setIsPlaying((prev) => !prev);
      }
    } else {
      if (nativePlayerRef.current) {
        if (isPlaying) {
          nativePlayerRef.current.pause();
          setIsPlaying(false);
        } else {
          nativePlayerRef.current.play();
          setIsPlaying(true);
        }
      } else {
        setIsPlaying((prev) => !prev);
      }
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setErrorMsg(null);
    setReloadKey((prev) => prev + 1);
  };

  const handlePlayerError = (err: string) => {
    setLoading(false);
    setErrorMsg(err);
  };

  const handlePlayerReady = () => {
    setLoading(false);
    setErrorMsg(null);
    restorePlaybackPosition();
  };

  /** Capture la position courante du lecteur natif avant un remontage. */
  const capturePlaybackPosition = () => {
    const player = nativePlayerRef.current;
    if (!player || typeof player.currentTime !== 'number') {
      resumePositionRef.current = null;
      wasPlayingRef.current = false;
      return;
    }
    resumePositionRef.current = player.currentTime;
    wasPlayingRef.current = isPlaying;
  };

  /**
   * Restaure la lecture après remontage (position + état lecture/pause).
   * Appelé à `readyToPlay` du nouveau lecteur : y chercher plus tôt serait
   * ignoré par le tampon. Toute erreur (flux remplacé, lecteur absent) est
   * ignorée : le pire cas reste le comportement historique (reprise à zéro).
   */
  const restorePlaybackPosition = () => {
    const player = nativePlayerRef.current;
    const position = resumePositionRef.current;
    if (!player || position == null) return;
    try {
      player.currentTime = position;
      if (wasPlayingRef.current) player.play();
    } catch {
      // Reprise impossible : on ne bloque jamais la lecture sur elle.
    }
    resumePositionRef.current = null;
    wasPlayingRef.current = false;
  };

  const toggleFullScreen = () => {
    if (useModalFullscreen && !isFullScreen) {
      capturePlaybackPosition();
    }
    setIsFullScreen((prev) => !prev);
  };

  // Marges de safe area appliquées AUX COMMANDES seulement : la vidéo reste
  // pleine face (le contenu peut passer sous l'encoche, les contrôles jamais).
  const fullscreenChromeStyle = isFullScreen
    ? {
        headerBar: {
          paddingTop: Math.max(insets.top, 8),
          paddingLeft: Math.max(16, insets.left + 12),
          paddingRight: Math.max(16, insets.right + 12),
        },
        controlsBar: {
          paddingBottom: Math.max(insets.bottom, 4),
          paddingLeft: Math.max(12, insets.left + 8),
          paddingRight: Math.max(12, insets.right + 8),
        },
      }
    : null;

  // Contenu intérieur du lecteur
  const playerContent = (
    <View style={[styles.root, isFullScreen && styles.fullScreenRoot]}>
      {/* Barre de contrôle supérieure */}
      <View
        style={[
          styles.headerBar,
          fullscreenChromeStyle ? fullscreenChromeStyle.headerBar : null,
        ]}
      >
        <View style={{ flex: 1 }}>
          <View
            style={[
              styles.sourceBadge,
              isLive && { backgroundColor: 'rgba(255, 69, 58, 0.2)', borderColor: '#FF453A' },
            ]}
          >
            <Icon name={isLive ? 'flash' : 'videocam'} size={12} color={isLive ? '#FF453A' : '#BF5AF2'} />
            <ProDayText style={[styles.sourceBadgeText, isLive && { color: '#FF453A', fontWeight: '700' }]}>
              {isLive ? 'DIFFUSION EN DIRECT SUR LE TERRAIN' : 'Diffusion Veo / Vidéo Club'}
            </ProDayText>
          </View>
          <ProDayText style={styles.title} numberOfLines={1}>
            {title}
          </ProDayText>
          {matchInfo ? (
            <ProDayText style={styles.matchInfo} numberOfLines={1}>
              {matchInfo}
            </ProDayText>
          ) : null}
        </View>

        <View style={styles.headerActionRow}>
          <TouchableOpacity
            onPress={toggleFullScreen}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.headerActionBtn}
            accessibilityLabel={isFullScreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            <Icon name={isFullScreen ? 'contract' : 'expand'} size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={styles.closeBtn}
              accessibilityLabel="Fermer le lecteur vidéo"
            >
              <Icon name="close" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cadre de lecture vidéo */}
      <View style={[styles.playerFrame, isFullScreen && styles.fullScreenPlayerFrame]}>
        {!isAuthorized ? (
          <View style={styles.unauthorizedState}>
            <Icon name="lock" size={32} color="#F59E0B" />
            <ProDayText style={styles.unauthorizedTitle}>Accès vidéo restreint</ProDayText>
            <ProDayText style={styles.unauthorizedBody}>
              Votre profil ({userRole}) n’a pas les droits requis pour visionner cette captation.
            </ProDayText>
          </View>
        ) : errorMsg ? (
          <View style={styles.errorState}>
            <Icon name="alert-circle" size={36} color="#FF453A" />
            <ProDayText style={styles.errorTitle}>Flux vidéo temporairement indisponible</ProDayText>
            <ProDayText style={styles.errorBody}>{errorMsg}</ProDayText>
            <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
              <Icon name="refresh" size={14} color="#FFFFFF" />
              <ProDayText style={styles.retryBtnText}>Reconnexion / Réessayer</ProDayText>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={StyleSheet.absoluteFill}>
            {Platform.OS === 'web' ? (
              <WebVideoRenderer
                key={`web-${reloadKey}`}
                sourceUrl={sourceUrl}
                autoPlay={autoPlay}
                videoRef={webVideoRef}
                onPlayStateChange={setIsPlaying}
                onError={handlePlayerError}
                onReady={handlePlayerReady}
              />
            ) : (
              <NativeVideoRenderer
                key={`native-${reloadKey}`}
                sourceUrl={sourceUrl}
                autoPlay={autoPlay}
                playerRef={nativePlayerRef}
                onPlayStateChange={setIsPlaying}
                onError={handlePlayerError}
                onReady={handlePlayerReady}
              />
            )}

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#BF5AF2" />
                <ProDayText style={styles.loadingText}>
                  Connexion au flux vidéo…
                </ProDayText>
              </View>
            )}

            {/* Grand bouton Play central explicite si la lecture n'a pas démarré (anti-blocage autoplay navigateur) */}
            {!isPlaying && !loading && !errorMsg ? (
              <TouchableOpacity
                onPress={togglePlay}
                style={styles.bigCenterPlayBtn}
                accessibilityLabel="Lancer la lecture"
                activeOpacity={0.8}
              >
                <View style={styles.bigCenterPlayInner}>
                  <Icon name="play" size={30} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ) : null}

            {/* Barre de commandes de lecture intégrée en incrustation basse */}
            {!loading && !errorMsg ? (
              <View
                style={[
                  styles.controlsBar,
                  fullscreenChromeStyle ? fullscreenChromeStyle.controlsBar : null,
                ]}
              >
                <TouchableOpacity
                  onPress={togglePlay}
                  style={styles.ctrlBtn}
                  accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
                >
                  <Icon name={isPlaying ? 'pause' : 'play'} size={15} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.liveIndicator}>
                  <View style={[styles.liveDot, isLive && { backgroundColor: '#FF453A' }]} />
                  <ProDayText style={[styles.liveText, isLive && { color: '#FF453A', fontWeight: '700' }]}>
                    {isLive ? 'DIRECT LIVE TERRAIN' : 'LECTEUR INTÉGRÉ PRODAY'}
                  </ProDayText>
                </View>

                <View style={{ flex: 1 }} />

                <TouchableOpacity
                  onPress={handleRetry}
                  style={styles.ctrlBtn}
                  accessibilityLabel="Reconnexion au flux"
                >
                  <Icon name="refresh" size={15} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={toggleFullScreen}
                  style={styles.ctrlBtn}
                  accessibilityLabel={isFullScreen ? 'Quitter le plein écran' : 'Plein écran'}
                >
                  <Icon name={isFullScreen ? 'contract' : 'expand'} size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );

  // Plein écran mobile : Modal système + barre d'état masquée + verrou paysage
  // (hook) + commandes dégagées des zones sûres. La vidéo reste pleine face.
  if (isFullScreen && useModalFullscreen) {
    return (
      <Modal
        visible
        transparent={false}
        animationType="fade"
        onRequestClose={() => setIsFullScreen(false)}
      >
        <StatusBar hidden />
        <View style={styles.fullScreenContainer}>{playerContent}</View>
      </Modal>
    );
  }

  if (isModal) {
    return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>{playerContent}</View>
      </Modal>
    );
  }

  // Web/desktop plein écran : agrandissement sur place — pas de Modal, pas de
  // remontage du renderer, la lecture continue sans interruption.
  return playerContent;
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  root: {
    width: '100%',
    maxWidth: 900,
    backgroundColor: '#0E0E12',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: colors.surface,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  sourceBadgeText: {
    ...APPLE_TYPOGRAPHY.caption2,
    color: '#BF5AF2',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    ...APPLE_TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  matchInfo: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenRoot: {
    maxWidth: '100%',
    height: '100%',
    borderRadius: 0,
    borderWidth: 0,
    justifyContent: 'space-between',
  },
  fullScreenPlayerFrame: {
    flex: 1,
    aspectRatio: undefined,
  },
  playerFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
  },
  nativeVideo: {
    width: '100%',
    height: '100%',
  },
  controlsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 44,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  ctrlBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30D158',
  },
  liveText: {
    ...APPLE_TYPOGRAPHY.caption2,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#BF5AF2',
    fontWeight: '600',
  },
  errorState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  errorTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBody: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 360,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#BF5AF2',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    marginTop: 6,
  },
  retryBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  unauthorizedState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  unauthorizedTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    color: '#F59E0B',
    fontWeight: '700',
  },
  unauthorizedBody: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    textAlign: 'center',
  },
  bigCenterPlayBtn: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  bigCenterPlayInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    paddingLeft: 4,
  },
});
