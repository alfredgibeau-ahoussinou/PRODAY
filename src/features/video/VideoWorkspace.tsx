/**
 * Espace Vidéo — un seul module, rendu par le pôle Club/Admin et le pôle Coach.
 *
 * Rien n'est simulé : les captations viennent du service persisté (clubCamerasService),
 * les clips sont dérivés de ces mêmes captations (buildClipsFromVideos), et la
 * bibliothèque du compte Veo vient de l'API officielle via les Cloud Functions
 * (useVeoAccount / useVeoLibrary -> veoAccount.service) : liste des vidéos autorisées,
 * puis URL de lecture demandée à la volée et consommée par le lecteur intégré.
 *
 * Ce qui n'est pas intégré est écrit et classé — jamais remplacé par un bouton inerte,
 * un faux direct, un faux clip ou un faux accusé de partage.
 *
 * Refonte cohérente Coach/Club — une seule composition, du haut vers le bas :
 *   1. En-tête (kicker club, titre, statut Veo unique et exact)
 *   2. Barre de contexte & actions (UNE action principale : Importer — VideoSourceHub)
 *   3. Lecteur héro (si une vidéo est sélectionnée — panneau contextuel à droite)
 *   4. Bannière direct (si un live existe)
 *   5. Bibliothèque unifiée (compte Veo + captations club : recherche, filtre, grille 16:9)
 *   6. Clips & Analyse IA (filtres, liste, analyse — sans paragraphes répétés)
 *   7. Connexion Veo (compte, axes d'état, appairage, méthodes — regroupées)
 *   8. Renvoi Veo (handoff honnête + note enregistrements)
 *   9. Modals (upload, direct, association, détail)
 *
 * Design system (DESIGN.md + Coach/Club approuvés) : cartes plates rayon 20, une seule
 * couleur d'accent par pôle, rouge réservé au direct, `warning` au transit, typographie
 * Apple System (APPLE_TYPOGRAPHY) partout, aucun hex codé — jetons injectés.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDayIntegratedVideoPlayer } from '../../components/video/ProDayIntegratedVideoPlayer';
import { VeoMatchAssociateModal } from '../../components/video/VeoMatchAssociateModal';
import { CoachVideoUploadModal } from '../../components/video/CoachVideoUploadModal';
import { ProDayLiveBroadcastModal } from '../../components/video/ProDayLiveBroadcastModal';
import { CoachVideoDetailModal } from '../../components/video/CoachVideoDetailModal';
import { videoAiAnalysisService } from '../../services/video/videoAiAnalysis.service';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useVeoAccount, useVeoLibrary } from '../../hooks/useVeoAccount';
import {
  resolveVeoPlaybackUrl,
} from '../../services/veo/veoAccount.service';
import { clubCamerasService } from '../../services/clubCameras.service';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { spacing } from '../../theme/designTokens';
import type { ClubCamera, ClubMatchVideo } from '../../models/ClubCameras';
import { buildClipsFromVideos } from '../../utils/clubVideoClips';
import {
  VEO_GO_GUIDE_URL,
  canManageVideoConnections,
  canUploadAndAssociateVideo,
  libraryVisibilityNote,
  resolveCameraState,
  resolveStreamState,
  toVideoAudienceRole,
} from './veoWorkspace';
import {
  VeoConnectPanel,
  VeoExternalHandoffCard,
  VeoProductFacts,
  VeoStateAxes,
  VideoCapabilityList,
  VideoLibraryEmptyState,
  type VideoSurfaceTokens,
} from './VideoWorkspacePanels';
import { VeoAccountLibrary, VeoAccountPanel, VeoQrPairingCard } from './VeoAccountPanel';
import { VideoSourceHub } from './VideoSourceHub';
import { resolveVideoLifecycle } from './videoStatus';
import type { VeoEntryState } from './VideoSourceHub';
import {
  toVeoAccountVideoItem,
  VideoCard,
  VIDEO_CARD_RADIUS,
} from './VideoCard';

export const VEO_DEVELOPER_DOCS = 'https://developer.veo.co.uk/';
export const VEO_PLATFORM_URL = 'https://app.veo.co/';

/**
 * Tableaux vides stables.
 */
const NO_VIDEOS: MatchVideoItem[] = [];
const NO_CLIPS: SmartClipItem[] = [];

/** Forme de référence (D-010/D-011) : carte plate rayon 20 — constante partagée (VideoCard). */
const CARD_RADIUS = VIDEO_CARD_RADIUS;

export type VideoSource = 'veo' | 'smartphone' | 'xbotgo' | 'drone';
export type HighlightTag = 'all' | 'goal' | 'save' | 'transition' | 'set_piece' | 'other';

export type MatchVideoItem = {
  id: string;
  title: string;
  category: string;
  dateStr: string;
  durationStr: string;
  source: VideoSource;
  sourceLabel: string;
  clipsCount: number;
  score: string;
  viewsCount: number;
  storageUrl?: string;
  status?: ClubMatchVideo['status'];
  kind?: ClubMatchVideo['kind'];
  veoVideoId?: string;
};

export type SmartClipItem = {
  id: string;
  title: string;
  matchTitle: string;
  minute: string;
  type: 'goal' | 'save' | 'transition' | 'set_piece' | 'other';
  typeLabel: string;
  authorName: string;
  durationSec: number;
  storageUrl?: string;
};

/** Libellé de source déduit du document persisté, jamais deviné. */
const MATCH_VIDEO_SOURCE_LABEL: Record<ClubMatchVideo['source'], string> = {
  camera_api: 'Caméra connectée',
  external_link: 'Lien externe',
  import: 'Fichier importé',
  device_capture: 'Captation appareil',
  upload: 'Téléversement',
};

const MATCH_VIDEO_VENDOR_LABEL: Partial<Record<NonNullable<ClubMatchVideo['vendor']>, string>> = {
  veo: 'Veo',
};

/**
 * Convertit un document ClubMatchVideo persisté en modèle d'affichage.
 * Chaque champ absent reste absent : aucune durée, aucun score ni compteur de vues
 * n'est inventé pour remplir la carte.
 */
const toMatchVideoItem = (video: ClubMatchVideo): MatchVideoItem => ({
  id: video.id,
  title: video.title,
  category: video.team_label || 'Équipe non renseignée',
  dateStr: (video.scheduled_at || video.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }),
  durationStr:
    video.duration_sec && video.duration_sec > 0
      ? `${Math.round(video.duration_sec / 60)} min`
      : '',
  source: video.vendor === 'veo' ? ('veo' as const) : ('smartphone' as const),
  sourceLabel: [
    video.vendor ? MATCH_VIDEO_VENDOR_LABEL[video.vendor] : null,
    MATCH_VIDEO_SOURCE_LABEL[video.source],
  ]
    .filter(Boolean)
    .join(' · '),
  clipsCount: video.clips.length,
  score: '',
  viewsCount: 0,
  storageUrl: video.storage_url,
  status: video.status,
  kind: video.kind,
});

/**
 * Captation du compte Veo → modèle d'affichage : adaptateur canonique partagé
 * (VideoCard.tsx), utilisé par la bibliothèque du workspace ET celle du compte.
 */

const CLIP_FILTERS: { id: HighlightTag; label: string }[] = [
  { id: 'all', label: 'Tous les clips' },
  { id: 'goal', label: 'Buts' },
  { id: 'save', label: 'Arrêts' },
  { id: 'transition', label: 'Transitions' },
  { id: 'set_piece', label: 'Coups de pied arrêtés' },
  { id: 'other', label: 'Autres' },
];

export type VideoWorkspaceProps = {
  tokens: VideoSurfaceTokens;
  userRole?: string;
  clubId?: string | null;
  clubLabel?: string | null;
  createdByUid?: string | null;
  videos?: MatchVideoItem[];
  clips?: SmartClipItem[];
  onPlayVideo?: (videoId: string) => void;
  onPlayClip?: (clipId: string) => void;
};

export function VideoWorkspace({
  tokens,
  userRole = 'club',
  clubId,
  clubLabel,
  createdByUid,
  videos = NO_VIDEOS,
  clips = NO_CLIPS,
  onPlayVideo,
  onPlayClip,
}: VideoWorkspaceProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isTablet = width >= 680 && width < 900;

  const profile = useSessionProfile();
  const effectiveClubId = clubId ?? profile?.profile.club_id;
  const effectiveCreatedByUid = createdByUid ?? profile?.uid;
  const canManage = canManageVideoConnections(userRole);
  const canUploadOrAssociate = canUploadAndAssociateVideo(userRole);

  const [cameras, setCameras] = useState<ClubCamera[]>([]);
  const [clipFilter, setClipFilter] = useState<HighlightTag>('all');
  const [libraryQuery, setLibraryQuery] = useState('');
  const [libraryTeam, setLibraryTeam] = useState<string | null>(null);
  const [videoList, setVideoList] = useState<MatchVideoItem[]>(videos);
  const [storedVideos, setStoredVideos] = useState<ClubMatchVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(Boolean(effectiveClubId));
  const [activePlayingVideo, setActivePlayingVideo] = useState<{
    url: string;
    title: string;
    matchInfo?: string;
    isLive?: boolean;
    videoId?: string;
  } | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [liveBroadcastModalOpen, setLiveBroadcastModalOpen] = useState(false);
  const [associateModalOpen, setAssociateModalOpen] = useState(false);
  const [selectedDetailVideo, setSelectedDetailVideo] = useState<ClubMatchVideo | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [aiProcessingVideoId, setAiProcessingVideoId] = useState<string | null>(null);
  const [aiProcessingProgress, setAiProcessingProgress] = useState<number>(0);

  const veoAccount = useVeoAccount(effectiveClubId ?? null);
  const veoLibrary = useVeoLibrary(veoAccount.state.connected);
  const [resolvingVeoVideoId, setResolvingVeoVideoId] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<{
    videoId: string;
    title: string;
    message: string;
  } | null>(null);

  const connectionInput = useMemo(
    () => ({
      clientConfigured: veoAccount.state.configured,
      accountVerified: veoAccount.state.connected,
      lastAttemptFailed: veoAccount.state.kind === 'unauthorized',
    }),
    [veoAccount.state],
  );

  useEffect(() => {
    let active = true;
    if (!effectiveClubId) {
      setVideoList(videos);
      setStoredVideos([]);
      setLoadingVideos(false);
      return () => {
        active = false;
      };
    }

    setLoadingVideos(true);
    void clubCamerasService
      .listMatchVideos(
        effectiveClubId,
        canManage ? 'staff' : userRole === 'coach' ? 'coaches' : userRole === 'parent' ? 'parents' : 'players',
      )
      .then((stored) => {
        if (!active) return;
        setStoredVideos(stored);
        setVideoList(stored.map(toMatchVideoItem));
      })
      .catch(() => {
        if (active) {
          setStoredVideos([]);
          setVideoList([]);
        }
      })
      .finally(() => {
        if (active) setLoadingVideos(false);
      });

    return () => {
      active = false;
    };
  }, [effectiveClubId, userRole, canManage, videos]);

  useEffect(() => {
    let active = true;
    if (!effectiveClubId) {
      setCameras([]);
      return () => {
        active = false;
      };
    }
    void clubCamerasService
      .listCameras(effectiveClubId)
      .then((list) => {
        if (active) setCameras(list);
      })
      .catch(() => {
        if (active) setCameras([]);
      });
    return () => {
      active = false;
    };
  }, [effectiveClubId]);

  const derivedClips = useMemo(() => buildClipsFromVideos(storedVideos), [storedVideos]);
  const effectiveClips = clips.length > 0 ? clips : derivedClips;

  const filteredClips = useMemo(() => {
    if (clipFilter === 'all') return effectiveClips;
    return effectiveClips.filter((clip) => clip.type === clipFilter);
  }, [effectiveClips, clipFilter]);

  const accountVideoItems = useMemo(
    () => veoLibrary.videos.map(toVeoAccountVideoItem),
    [veoLibrary.videos],
  );

  const allVideos = useMemo(
    () => [...accountVideoItems, ...videoList],
    [accountVideoItems, videoList],
  );

  const libraryTeams = useMemo(() => {
    const seen = new Map<string, number>();
    for (const video of allVideos) {
      if (video.veoVideoId) continue;
      const label = video.category.trim();
      if (!label) continue;
      seen.set(label, (seen.get(label) ?? 0) + 1);
    }
    return Array.from(seen.entries()).map(([label, count]) => ({ label, count }));
  }, [allVideos]);

  const filteredVideos = useMemo(() => {
    const needle = libraryQuery.trim().toLowerCase();
    return allVideos.filter((video) => {
      if (libraryTeam && !video.veoVideoId && video.category.trim() !== libraryTeam) return false;
      if (!needle) return true;
      return (
        video.title.toLowerCase().includes(needle) ||
        video.category.toLowerCase().includes(needle) ||
        video.sourceLabel.toLowerCase().includes(needle) ||
        video.dateStr.toLowerCase().includes(needle)
      );
    });
  }, [allVideos, libraryQuery, libraryTeam]);

  const liveVideos = useMemo(
    () =>
      storedVideos.filter(
        (v) =>
          v.kind === 'live' ||
          v.status === 'recording' ||
          v.storage_url?.includes('.m3u8') ||
          v.storage_url?.includes('/live'),
      ),
    [storedVideos],
  );

  const handlePlayClip = (clip: SmartClipItem) => {
    if (!clip.storageUrl) {
      Alert.alert(
        'Lecture impossible',
        "Aucun fichier ou flux associé à ce clip. Importez ou associez une source réelle — aucune vidéo de démonstration n'est lue.",
      );
      return;
    }
    onPlayClip?.(clip.id);
    setActivePlayingVideo({
      url: clip.storageUrl,
      title: clip.title,
      matchInfo: `${clip.authorName} (${clip.minute}) · ${clip.matchTitle}`,
    });
  };

  /**
   * Garde central de lecture — barrière unique en amont de toute résolution de flux.
   * Les états non lisibles (téléversement, traitement, échec) sont refusés ici même si
   * un appelant oublie le verrou de `VideoCard` (défense en profondeur, videoStatus.ts).
   */
  const handlePlayVideo = async (video: MatchVideoItem) => {
    const lifecycle = resolveVideoLifecycle(video);
    if (!lifecycle.playable) {
      Alert.alert(
        'Lecture indisponible',
        `Cette captation est en cours de ${lifecycle.label.toLowerCase()}. Elle sera lisible dès que le service l'aura finalisée.`,
      );
      return;
    }
    if (video.veoVideoId) {
      setPlaybackError(null);
      setResolvingVeoVideoId(video.id);
      const result = await resolveVeoPlaybackUrl(video.veoVideoId);
      setResolvingVeoVideoId(null);
      if (!result.ok) {
        setPlaybackError({
          videoId: video.id,
          title: video.title,
          message: result.state.message,
        });
        return;
      }
      onPlayVideo?.(video.id);
      setActivePlayingVideo({
        url: result.target.url,
        title: video.title,
        matchInfo: video.category || 'Compte Veo',
        videoId: video.id,
      });
      return;
    }

    if (!video.storageUrl) {
      Alert.alert(
        'Lecture impossible',
        "Aucune source lisible n’est associée à cette captation. Associez le match Veo ou importez un fichier — aucun lecteur de démonstration ne s'ouvre.",
      );
      return;
    }
    onPlayVideo?.(video.id);
    setActivePlayingVideo({
      url: video.storageUrl,
      title: video.title,
      matchInfo: video.category,
      videoId: video.id,
    });
  };

  const handleOpenDetail = (target: MatchVideoItem) => {
    const existing = storedVideos.find((v) => v.id === target.id);
    if (existing) {
      setSelectedDetailVideo(existing);
    } else {
      setSelectedDetailVideo({
        id: target.id,
        club_id: effectiveClubId ?? 'club',
        title: target.title,
        status: target.status || 'ready',
        source: target.veoVideoId ? 'camera_api' : 'upload',
        vendor: target.veoVideoId ? 'veo' : undefined,
        team_label: target.category,
        storage_url: target.storageUrl,
        highlights_ready: false,
        clips: [],
        player_uids: [],
        share_with: ['coaches', 'players'],
        created_by_uid: effectiveCreatedByUid ?? '',
        created_at: new Date(),
      });
    }
    setDetailModalOpen(true);
  };

  const handleEndLive = async (videoId: string) => {
    try {
      await clubCamerasService.endLiveStream(videoId);
      setStoredVideos((prev) =>
        prev.map((v) => (v.id === videoId ? { ...v, status: 'ready', kind: 'replay' } : v)),
      );
      Alert.alert(
        'Direct terminé',
        'Le match est désormais clôturé et disponible en replay dans votre bibliothèque.',
      );
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || "Impossible d'arrêter le direct.");
    }
  };

  const handleStartAiAnalysis = async (targetVideo: ClubMatchVideo) => {
    setAiProcessingVideoId(targetVideo.id);
    setAiProcessingProgress(25);
    try {
      setAiProcessingProgress(60);
      const result = await videoAiAnalysisService.startAiVideoAnalysis(
        targetVideo.id,
        effectiveClubId ?? undefined,
      );
      setAiProcessingProgress(100);
      setStoredVideos((prev) =>
        prev.map((item) =>
          item.id === targetVideo.id
            ? { ...item, clips: result.clips, ai_ready: true, highlights_ready: true }
            : item,
        ),
      );
    } catch (err: any) {
      Alert.alert("Échec de l'analyse IA", err?.message || "Impossible d'analyser cette captation.");
    } finally {
      setAiProcessingVideoId(null);
    }
  };

  const veoAudience = toVideoAudienceRole(userRole);
  const canConnectVeo = veoAudience === 'club' || veoAudience === 'coach' || veoAudience === 'staff';
  const canManageVeoApiClient = veoAudience === 'club';
  const canSeeConnections = canConnectVeo;
  const canSeeVeoAccount = canConnectVeo;

  const primaryCamera = cameras[0];
  const cameraState = resolveCameraState(primaryCamera);
  const latestRecord = storedVideos[0];
  const streamState = resolveStreamState(
    latestRecord ? { kind: latestRecord.kind, status: latestRecord.status } : null,
  );

  const handleAssociateSuccess = (video: ClubMatchVideo) => {
    setStoredVideos((previous) => [video, ...previous]);
    setVideoList((previous) => [toMatchVideoItem(video), ...previous]);
  };

  const handleUploadSuccess = (video: ClubMatchVideo) => {
    setStoredVideos((previous) => [video, ...previous]);
    setVideoList((previous) => [toMatchVideoItem(video), ...previous]);
  };

  const handleLiveStarted = (video: ClubMatchVideo) => {
    setStoredVideos((previous) => [video, ...previous]);
    setVideoList((previous) => [toMatchVideoItem(video), ...previous]);
  };

  const activeStoredVideo = useMemo(
    () => (activePlayingVideo?.videoId ? storedVideos.find((v) => v.id === activePlayingVideo.videoId) : null),
    [activePlayingVideo, storedVideos],
  );

  const veoEntryState: VeoEntryState = veoAccount.state.connected
    ? 'connected'
    : veoAccount.state.configured
      ? 'configured'
      : 'not_configured';

  /** Captations éligibles à l'affichage analyse (hors direct, source réelle). */
  const analysisVideos = useMemo(
    () => storedVideos.filter((v) => v.kind !== 'live').slice(0, 3),
    [storedVideos],
  );

  /** Colonnes de la grille bibliothèque selon la fenêtre. */
  const gridBasis = isDesktop ? '31.33%' : isTablet ? '47%' : '100%';

  return (
    <View style={styles.container}>
      {/* 1. EN-TÊTE — titre, contexte club, statut Veo unique */}
      <View
        style={[styles.unifiedHeader, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
      >
        <View style={styles.headerContextRow}>
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <View style={styles.teamContextTagRow}>
              <View style={[styles.contextIndicatorDot, { backgroundColor: tokens.accent }]} />
              <ProDayText
                variant="caption"
                style={[styles.headerEyebrow, { color: tokens.muted }]}
                numberOfLines={1}
              >
                ESPACE VIDÉO · {clubLabel || (effectiveClubId ? `CLUB ${effectiveClubId}` : 'PRODAY')}
              </ProDayText>
            </View>
            <ProDayText variant="title" style={[styles.mainHeading, { color: tokens.foreground }]}>
              Vidéos & Analyses
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.headerSubtitle} numberOfLines={2}>
              {libraryVisibilityNote(userRole)}
            </ProDayText>
          </View>

          <PressableSpring
            onPress={() => {
              if (canSeeConnections) setDetailModalOpen(false);
            }}
            scaleTo={0.96}
            haptic={false}
            disabled={!canSeeConnections}
            accessibilityRole={canSeeConnections ? 'button' : 'text'}
            accessibilityLabel={`Statut de connexion Veo : ${veoAccount.state.message}`}
            style={[
              styles.veoStatusPill,
              {
                backgroundColor: tokens.elevated,
                borderColor: tokens.border,
              },
            ]}
            testID="video-veo-status-pill"
          >
            <View
              style={[
                styles.veoDot,
                {
                  backgroundColor: veoAccount.state.connected
                    ? tokens.success
                    : veoAccount.state.configured
                      ? tokens.warning
                      : tokens.muted,
                },
              ]}
            />
            <ProDayText
              variant="caption"
              style={[
                styles.veoStatusText,
                {
                  color: veoAccount.state.connected
                    ? tokens.success
                    : veoAccount.state.configured
                      ? tokens.warning
                      : tokens.muted,
                },
              ]}
              numberOfLines={1}
            >
              {veoAccount.state.connected
                ? `Veo connecté${veoLibrary.videos.length > 0 ? ` · ${veoLibrary.videos.length}` : ''}`
                : veoAccount.state.configured
                  ? 'Veo prêt · compte requis'
                  : 'Veo non connecté'}
            </ProDayText>
          </PressableSpring>
        </View>
      </View>

      {/* 2. BARRE DE CONTEXTE & ACTIONS — une seule action principale */}
      {canUploadOrAssociate ? (
        <VideoSourceHub
          tokens={tokens}
          veoState={veoEntryState}
          veoLibraryCount={veoAccount.state.connected ? veoLibrary.videos.length : null}
          importState="idle"
          canUpload={canUploadOrAssociate}
          teamLabel={clubLabel}
          storedCount={videoList.length}
          clipsCount={effectiveClips.length}
          onSelectVeo={() => {
            if (canSeeConnections) {
              setUploadModalOpen(false);
              setLiveBroadcastModalOpen(false);
              setAssociateModalOpen(false);
            }
          }}
          onSelectBroadcast={() => setLiveBroadcastModalOpen(true)}
          onSelectEncoder={() => setAssociateModalOpen(true)}
          onSelectImport={() => setUploadModalOpen(true)}
        />
      ) : null}

      {/* 3. LECTEUR HÉRO — la captation sélectionnée devient le focus */}
      {activePlayingVideo ? (
        <View
          style={[
            styles.heroPlayerContainer,
            { backgroundColor: tokens.surface, borderColor: tokens.borderStrong },
          ]}
        >
          <View
            style={styles.heroPlayerLayout}
          >
            <View style={styles.heroPlayerMedia}>
              <ProDayIntegratedVideoPlayer
                isModal={false}
                isLive={activePlayingVideo.isLive}
                sourceUrl={activePlayingVideo.url}
                title={activePlayingVideo.title}
                matchInfo={activePlayingVideo.matchInfo}
                userRole={
                  toVideoAudienceRole(userRole) === 'staff'
                    ? 'club'
                    : (toVideoAudienceRole(userRole) as 'club' | 'coach' | 'player' | 'parent')
                }
                onClose={() => setActivePlayingVideo(null)}
              />
            </View>

            <View
              style={[
                styles.heroPlayerSidePanel,
                { backgroundColor: tokens.elevated, borderColor: tokens.border },
                isDesktop ? styles.heroPlayerSidePanelDesktop : null,
              ]}
            >
              <View style={styles.heroSideHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View
                      style={[
                        styles.sourceDot,
                        { backgroundColor: activePlayingVideo.isLive ? tokens.danger : tokens.accent },
                      ]}
                    />
                    <ProDayText
                      variant="caption"
                      style={[
                        styles.heroSideTag,
                        { color: activePlayingVideo.isLive ? tokens.danger : tokens.accent },
                      ]}
                    >
                      {activePlayingVideo.isLive ? 'DIRECT ACTIF' : 'LECTURE EN COURS'}
                    </ProDayText>
                  </View>
                  <ProDayText
                    variant="title"
                    style={[styles.heroSideTitle, { color: tokens.foreground }]}
                    numberOfLines={2}
                  >
                    {activePlayingVideo.title}
                  </ProDayText>
                  {activePlayingVideo.matchInfo ? (
                    <ProDayText variant="caption" muted style={{ marginTop: 2 }}>
                      {activePlayingVideo.matchInfo}
                    </ProDayText>
                  ) : null}
                </View>

                <PressableSpring
                  onPress={() => setActivePlayingVideo(null)}
                  scaleTo={0.92}
                  haptic
                  style={[styles.heroCloseBtn, { backgroundColor: tokens.surface }]}
                  accessibilityLabel="Fermer le lecteur"
                  testID="hero-player-close"
                >
                  <Icon name="close" size={16} color={tokens.foreground} />
                </PressableSpring>
              </View>

              {/* Actions secondaires groupées — rien ne flotte autour du lecteur */}
              <View style={styles.heroSideActions}>
                {activeStoredVideo && canUploadOrAssociate ? (
                  <PressableSpring
                    onPress={() => handleOpenDetail(toMatchVideoItem(activeStoredVideo))}
                    scaleTo={0.96}
                    haptic
                    style={[styles.heroSideActionBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
                  >
                    <Icon name="settings" size={14} color={tokens.foreground} />
                    <ProDayText variant="caption" style={{ color: tokens.foreground, fontWeight: '700' }}>
                      Gérer & Partager
                    </ProDayText>
                  </PressableSpring>
                ) : null}

                {activeStoredVideo &&
                activeStoredVideo.kind !== 'live' &&
                !activeStoredVideo.ai_ready &&
                canUploadOrAssociate ? (
                  <PressableSpring
                    onPress={() => void handleStartAiAnalysis(activeStoredVideo)}
                    scaleTo={0.96}
                    haptic
                    style={[styles.heroSideActionBtn, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent }]}
                  >
                    <Icon name="sparkles" size={14} color={tokens.accent} />
                    <ProDayText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
                      Analyser IA
                    </ProDayText>
                  </PressableSpring>
                ) : null}

                {activePlayingVideo.isLive && activeStoredVideo && canUploadOrAssociate ? (
                  <PressableSpring
                    onPress={() => void handleEndLive(activeStoredVideo.id)}
                    scaleTo={0.96}
                    haptic
                    style={[styles.heroSideActionBtn, { backgroundColor: tokens.surface, borderColor: tokens.danger }]}
                    testID="end-live-stream-btn"
                  >
                    <Icon name="close" size={14} color={tokens.danger} />
                    <ProDayText variant="caption" style={{ color: tokens.danger, fontWeight: '700' }}>
                      Arrêter le direct
                    </ProDayText>
                  </PressableSpring>
                ) : null}
              </View>

              {activeStoredVideo && activeStoredVideo.clips.length > 0 ? (
                <View style={{ marginTop: spacing.sm, gap: 6 }}>
                  <ProDayText variant="caption" muted style={styles.overline}>
                    SÉQUENCES DU MATCH ({activeStoredVideo.clips.length})
                  </ProDayText>
                  <ScrollView
                    nestedScrollEnabled
                    style={{ maxHeight: 150 }}
                    showsVerticalScrollIndicator={false}
                  >
                    {activeStoredVideo.clips.map((c) => {
                      const clipUrl = c.url || activeStoredVideo.storage_url;
                      return (
                        <PressableSpring
                          key={c.id}
                          onPress={() => {
                            if (clipUrl) {
                              setActivePlayingVideo({
                                url: clipUrl,
                                title: c.label,
                                matchInfo: `${c.type || 'Séquence'} · ${activeStoredVideo.title}`,
                              });
                            }
                          }}
                          style={[styles.heroClipItem, { borderColor: tokens.border }]}
                        >
                          <Icon name="play" size={12} color={tokens.accent} />
                          <ProDayText
                            variant="caption"
                            style={{ flex: 1, color: tokens.foreground, fontWeight: '600' }}
                            numberOfLines={1}
                          >
                            {c.label}
                          </ProDayText>
                          <ProDayText variant="caption" muted>
                            {c.starts_at_sec ? `${Math.floor(c.starts_at_sec / 60)}'` : ''}
                          </ProDayText>
                        </PressableSpring>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      {/* 4. BANNIÈRE DIRECT — un seul point d'entrée live, libellé exact */}
      {liveVideos.length > 0 && !activePlayingVideo?.isLive ? (
        <PressableSpring
          onPress={() => {
            const firstLive = liveVideos[0];
            if (firstLive && firstLive.storage_url) {
              onPlayVideo?.(firstLive.id);
              setActivePlayingVideo({
                url: firstLive.storage_url,
                title: firstLive.title,
                matchInfo: `${firstLive.team_label || 'Équipe'} · Diffusion en direct`,
                isLive: true,
                videoId: firstLive.id,
              });
            }
          }}
          scaleTo={0.98}
          haptic
          style={[styles.pulsingLiveBanner, { backgroundColor: tokens.surface, borderColor: tokens.danger }]}
          testID="pulsing-live-banner"
        >
          <View style={[styles.pulsingLiveDot, { backgroundColor: tokens.danger }]} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <ProDayText style={[styles.pulsingLiveHeading, { color: tokens.danger }]}>
              EN DIRECT
            </ProDayText>
            <ProDayText style={[styles.pulsingLiveTitle, { color: tokens.foreground }]} numberOfLines={1}>
              {liveVideos[0].title}
            </ProDayText>
          </View>
          <View style={[styles.pulsingLiveWatchPill, { backgroundColor: tokens.danger }]}>
            <Icon name="play" size={13} color={tokens.onAccent} />
            <ProDayText style={[styles.pulsingLiveWatchText, { color: tokens.onAccent }]}>
              Rejoindre
            </ProDayText>
          </View>
        </PressableSpring>
      ) : null}

      {/* 4bis. DIRECT — liste des diffusions réelles, ou état honnête vide */}
      <View style={styles.stack}>
        {liveVideos.length > 0 ? (
          <View style={[styles.card, { backgroundColor: tokens.surface }]} testID="video-live-list">
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: tokens.accentSoft }]}>
                <Icon name="videocam" size={18} color={tokens.danger} />
              </View>
              <View style={styles.cardHeaderText}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.contextIndicatorDot, { backgroundColor: tokens.danger }]} />
                  <ProDayText variant="caption" style={{ color: tokens.danger, fontWeight: '800' }}>
                    EN DIRECT DISPONIBLE
                  </ProDayText>
                </View>
                <ProDayText variant="body" style={styles.cardTitle}>
                  {liveVideos.length} diffusion{liveVideos.length > 1 ? 's' : ''} en direct
                </ProDayText>
              </View>
            </View>

            {liveVideos.map((lv) => (
              <View key={lv.id} style={{ marginTop: spacing.sm, gap: 6 }}>
                <ProDayText variant="caption" style={{ fontWeight: '700', color: tokens.foreground }}>
                  {lv.title}
                </ProDayText>
                {lv.team_label || lv.opponent ? (
                  <ProDayText variant="caption" muted>
                    {[lv.team_label, lv.opponent ? `vs ${lv.opponent}` : null].filter(Boolean).join(' · ')}
                  </ProDayText>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <PressableSpring
                    onPress={() => {
                      if (lv.storage_url) {
                        onPlayVideo?.(lv.id);
                        setActivePlayingVideo({
                          url: lv.storage_url,
                          title: lv.title,
                          matchInfo: `${lv.team_label || 'Équipe'} · Diffusion en direct`,
                          isLive: true,
                          videoId: lv.id,
                        });
                      }
                    }}
                    disabled={!lv.storage_url}
                    scaleTo={0.98}
                    haptic={Boolean(lv.storage_url)}
                    style={[styles.associateBtn, { backgroundColor: tokens.accent, flex: 1, justifyContent: 'center', minHeight: 44 }]}
                  >
                    <Icon name="play" size={14} color={tokens.onAccent} />
                    <ProDayText variant="caption" style={[styles.associateBtnText, { color: tokens.onAccent }]}>
                      Regarder le direct dans ProDay
                    </ProDayText>
                  </PressableSpring>

                  {canUploadOrAssociate ? (
                    <PressableSpring
                      onPress={() => void handleEndLive(lv.id)}
                      scaleTo={0.98}
                      haptic
                      style={[
                        styles.associateBtn,
                        {
                          backgroundColor: tokens.elevated,
                          borderWidth: 1,
                          borderColor: tokens.border,
                          justifyContent: 'center',
                          minHeight: 44,
                        },
                      ]}
                      testID="end-live-stream-btn"
                    >
                      <Icon name="close" size={14} color={tokens.danger} />
                      <ProDayText variant="caption" style={[styles.associateBtnText, { color: tokens.danger }]}>
                        Arrêter le direct
                      </ProDayText>
                    </PressableSpring>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : canUploadOrAssociate ? (
          <View style={[styles.card, { backgroundColor: tokens.surface }]} testID="video-live-empty">
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: tokens.accentSoft }]}>
                <Icon name="videocam" size={18} color={tokens.accent} />
              </View>
              <View style={styles.cardHeaderText}>
                <ProDayText variant="body" style={styles.cardTitle}>
                  Direct Veo Live dans ProDay
                </ProDayText>
                <ProDayText variant="caption" muted style={styles.cardSubtitle}>
                  {streamState === 'live'
                    ? 'Diffusion en direct active'
                    : streamState === 'starting'
                      ? 'Démarrage du direct…'
                      : 'Aucun direct en cours'}
                </ProDayText>
              </View>
            </View>
            <ProDayText variant="caption" muted style={styles.body}>
              Les flux en direct Veo Live associés à votre club se visionnent directement dans le lecteur intégré ProDay, sans quitter l'application.
            </ProDayText>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.sm, flexWrap: 'wrap' }}>
              <PressableSpring
                onPress={() => setLiveBroadcastModalOpen(true)}
                scaleTo={0.98}
                haptic
                style={[styles.associateBtn, { backgroundColor: tokens.danger, minHeight: 44 }]}
              >
                <Icon name="videocam" size={16} color={tokens.onAccent} />
                <ProDayText variant="caption" style={[styles.associateBtnText, { color: tokens.onAccent }]}>
                  Diffusion en direct
                </ProDayText>
              </PressableSpring>

              <PressableSpring
                onPress={() => setAssociateModalOpen(true)}
                scaleTo={0.98}
                haptic
                style={[
                  styles.associateBtn,
                  { backgroundColor: tokens.surface, borderWidth: 1, borderColor: tokens.border, minHeight: 44 },
                ]}
              >
                <Icon name="globe" size={16} color={tokens.foreground} />
                <ProDayText variant="caption" style={[styles.associateBtnText, { color: tokens.foreground }]}>
                  Associer un direct Veo Live
                </ProDayText>
              </PressableSpring>
            </View>
          </View>
        ) : null}
      </View>

      {/* 5. BIBLIOTHÈQUE UNIFIÉE — compte Veo + captations club */}
      <View style={styles.stack}>
        {canSeeConnections ? (
          <VeoAccountLibrary
            tokens={tokens}
            videos={veoLibrary.videos}
            loading={veoLibrary.loading}
            error={veoLibrary.error}
            connection={connectionInput}
            resolvingId={resolvingVeoVideoId}
            canManage={canManage}
            onRetry={veoLibrary.reload}
            onPlay={(video) => {
              void handlePlayVideo(toVeoAccountVideoItem(video));
            }}
          />
        ) : null}

        {playbackError ? (
          <View
            style={[styles.noticeCard, { backgroundColor: tokens.surface, borderColor: tokens.danger }]}
            testID="veo-playback-error"
          >
            <View style={styles.noticeLeft}>
              <Icon name="alert-circle" size={16} color={tokens.danger} />
              <ProDayText variant="caption" style={[styles.noticeText, { color: tokens.danger }]}>
                {playbackError.message}
              </ProDayText>
            </View>
            <PressableSpring
              onPress={() => {
                const target = allVideos.find((v) => v.id === playbackError.videoId);
                if (target) void handlePlayVideo(target);
              }}
              scaleTo={0.97}
              haptic
              accessibilityRole="button"
              style={[styles.retryBtn, { borderColor: tokens.borderStrong }]}
              testID="veo-playback-retry"
            >
              <Icon name="refresh" size={14} color={tokens.foreground} />
              <ProDayText variant="caption" style={[styles.retryBtnText, { color: tokens.foreground }]}>
                Réessayer
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}

        {allVideos.length > 0 ? (
          <View style={styles.libraryFilters}>
            <View style={[styles.searchWrapper, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
              <Icon name="search" size={18} color={tokens.muted} />
              <TextInput
                value={libraryQuery}
                onChangeText={setLibraryQuery}
                placeholder="Rechercher un match, une équipe, une date…"
                placeholderTextColor={tokens.muted}
                style={[styles.searchField, { color: tokens.foreground }]}
                accessibilityLabel="Rechercher dans la bibliothèque vidéo"
                testID="video-library-search"
              />
              {libraryQuery.length > 0 ? (
                <PressableSpring onPress={() => setLibraryQuery('')} style={{ padding: 4 }}>
                  <Icon name="close" size={14} color={tokens.muted} />
                </PressableSpring>
              ) : null}
            </View>

            {libraryTeams.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                <TeamChip
                  label={`Toutes (${allVideos.length})`}
                  on={libraryTeam === null}
                  onPress={() => setLibraryTeam(null)}
                  tokens={tokens}
                />
                {libraryTeams.map((team) => (
                  <TeamChip
                    key={team.label}
                    label={`${team.label} (${team.count})`}
                    on={libraryTeam === team.label}
                    onPress={() => setLibraryTeam(team.label)}
                    tokens={tokens}
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}

        {loadingVideos ? (
          <View style={styles.videoGrid}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[styles.videoCardNormalized, styles.skeletonCard, { backgroundColor: tokens.surface, flexBasis: gridBasis }]}
                testID="video-card-skeleton"
              >
                <View style={[styles.skeletonThumb, { backgroundColor: tokens.elevated }]} />
                <View style={styles.skeletonContent}>
                  <View style={[styles.skeletonLine, { backgroundColor: tokens.elevated, width: '80%' }]} />
                  <View style={[styles.skeletonLine, { backgroundColor: tokens.elevated, width: '45%' }]} />
                </View>
              </View>
            ))}
          </View>
        ) : allVideos.length === 0 ? (
          <VideoLibraryEmptyState
            tokens={tokens}
            clubLabel={clubLabel ?? effectiveClubId ?? null}
            onAssociate={canManage ? () => setAssociateModalOpen(true) : undefined}
          />
        ) : filteredVideos.length === 0 ? (
          <View style={[styles.card, styles.emptyBox, { backgroundColor: tokens.surface }]} testID="video-search-empty">
            <ProDayText variant="body" style={styles.emptyTitle}>
              Aucune captation ne correspond
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.emptyBody}>
              {allVideos.length} captation{allVideos.length > 1 ? 's' : ''} dans la bibliothèque —
              ajustez la recherche ou le filtre d'équipe.
            </ProDayText>
            <PressableSpring
              onPress={() => {
                setLibraryQuery('');
                setLibraryTeam(null);
              }}
              scaleTo={0.97}
              haptic
              style={[styles.retryBtn, { borderColor: tokens.borderStrong }]}
              testID="video-search-reset"
            >
              <Icon name="refresh" size={14} color={tokens.foreground} />
              <ProDayText variant="caption" style={[styles.retryBtnText, { color: tokens.foreground }]}>
                Réinitialiser les filtres
              </ProDayText>
            </PressableSpring>
          </View>
        ) : (
          <View style={styles.videoGrid}>
            {filteredVideos.map((vid) => (
              <VideoCard
                key={vid.id}
                item={vid}
                tokens={tokens}
                flexBasis={gridBasis}
                isPlaying={activePlayingVideo?.videoId === vid.id}
                isResolving={resolvingVeoVideoId === vid.id}
                onPress={() => void handlePlayVideo(vid)}
                onManage={(video) => handleOpenDetail(video)}
              />
            ))}
          </View>
        )}
      </View>

      {/* 6. CLIPS & ANALYSE IA — liste compacte, sans paragraphes répétés */}
      <View style={styles.stack}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {CLIP_FILTERS.map((filter) => {
            const on = clipFilter === filter.id;
            return (
              <PressableSpring
                key={filter.id}
                onPress={() => setClipFilter(filter.id)}
                scaleTo={0.96}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[
                  styles.filterPill,
                  on
                    ? { backgroundColor: 'transparent', borderColor: tokens.accent }
                    : { backgroundColor: tokens.elevated, borderColor: 'transparent' },
                ]}
              >
                <ProDayText
                  variant="caption"
                  style={[styles.filterPillText, { color: on ? tokens.accent : tokens.foreground }]}
                >
                  {filter.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </ScrollView>

        {canUploadOrAssociate && analysisVideos.length > 0 ? (
          <View style={[styles.card, { backgroundColor: tokens.surface }]} testID="video-ai-analysis-panel">
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: tokens.accentSoft }]}>
                <Icon name="sparkles" size={18} color={tokens.accent} />
              </View>
              <View style={styles.cardHeaderText}>
                <ProDayText variant="body" style={styles.cardTitle}>
                  Analyse IA & Détection des Temps Forts
                </ProDayText>
                <ProDayText variant="caption" muted style={styles.cardSubtitle}>
                  Conditionnée à l’accès effectif au fichier média source
                </ProDayText>
              </View>
            </View>

            <ProDayText variant="caption" muted style={styles.body}>
              L’analyse s’exécute sans jamais bloquer la lecture vidéo : vous pouvez visionner vos captations à tout moment.
            </ProDayText>

            {analysisVideos.map((v) => {
              const canProcessAi = Boolean(
                v.source === 'import' ||
                  v.source === 'upload' ||
                  v.storage_url?.includes('.mp4') ||
                  v.storage_url?.includes('storage.googleapis') ||
                  v.storage_url?.includes('blob:'),
              );
              const isProcessing = aiProcessingVideoId === v.id;

              return (
                <View key={v.id} style={[styles.aiRow, { backgroundColor: tokens.elevated }]}>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <ProDayText variant="caption" style={{ fontWeight: '700', color: tokens.foreground }} numberOfLines={1}>
                      {v.title}
                    </ProDayText>
                    <View style={[styles.clipBadge, { backgroundColor: canProcessAi ? tokens.accentSoft : tokens.surface, alignSelf: 'flex-start', marginTop: 4 }]}>
                      <ProDayText
                        variant="caption"
                        style={{
                          color: canProcessAi ? tokens.accent : tokens.muted,
                          fontWeight: '600',
                        }}
                      >
                        {canProcessAi ? 'Média traitable IA' : 'Visionnage seul'}
                      </ProDayText>
                    </View>
                  </View>

                  {!canProcessAi ? null : isProcessing ? (
                    <ProDayText variant="caption" style={{ color: tokens.accent, fontWeight: '700', flexShrink: 0 }}>
                      {aiProcessingProgress}%
                    </ProDayText>
                  ) : !v.ai_ready ? (
                    <PressableSpring
                      onPress={() => void handleStartAiAnalysis(v)}
                      scaleTo={0.97}
                      haptic
                      style={[styles.aiBtn, { backgroundColor: tokens.accent }]}
                      testID="start-ai-analysis-btn"
                    >
                      <Icon name="sparkles" size={13} color={tokens.onAccent} />
                      <ProDayText variant="caption" style={[styles.aiBtnText, { color: tokens.onAccent }]}>
                        Lancer l'analyse IA
                      </ProDayText>
                    </PressableSpring>
                  ) : (
                    <Icon name="checkmark-circle" size={16} color={tokens.success} />
                  )}

                  {v.storage_url ? (
                    <PressableSpring
                      onPress={() => {
                        setActivePlayingVideo({
                          url: v.storage_url!,
                          title: v.title,
                          matchInfo: `${v.team_label || 'Équipe'} · Visionnage direct`,
                          videoId: v.id,
                        });
                      }}
                      scaleTo={0.97}
                      haptic
                      style={[styles.retryBtn, { borderColor: tokens.border, paddingVertical: 6 }]}
                    >
                      <Icon name="play" size={13} color={tokens.foreground} />
                      <ProDayText variant="caption" style={styles.retryBtnText}>
                        Regarder sans attendre
                      </ProDayText>
                    </PressableSpring>
                  ) : null}
                </View>
              );
            })}

            <ProDayText variant="caption" muted style={[styles.footnote, { color: tokens.muted, marginTop: spacing.xs }]}>
              Information d’intégrité : Aucune analyse IA en direct temps réel n’est promise sans captation validée. Le traitement nécessite la fin de l’enregistrement et l’accès au fichier complet.
            </ProDayText>
          </View>
        ) : null}

        {effectiveClips.length === 0 ? (
          <View style={[styles.card, styles.emptyBox, { backgroundColor: tokens.surface }]}>
            <Icon name="flash" size={24} color={tokens.muted} />
            <ProDayText variant="body" style={styles.emptyTitle}>
              Aucun clip pour l'instant
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.emptyBody}>
              Les clips sont découpés à partir des captations réellement associées à ce club.
              Sans captation, aucun extrait n'est inventé.
            </ProDayText>
          </View>
        ) : filteredClips.length === 0 ? (
          <View style={[styles.card, styles.emptyBox, { backgroundColor: tokens.surface }]}>
            <ProDayText variant="caption" muted style={styles.emptyBody}>
              Aucun clip ne correspond à ce filtre.
            </ProDayText>
          </View>
        ) : (
          filteredClips.map((clip) => (
            <PressableSpring
              key={clip.id}
              onPress={() => handlePlayClip(clip)}
              style={[styles.clipCard, { backgroundColor: tokens.surface }]}
              scaleTo={0.98}
              accessibilityRole="button"
              testID="video-clip-item"
            >
              <View style={styles.clipLeft}>
                <View style={[styles.playIconBox, { backgroundColor: tokens.accentSoft }]}>
                  <Icon name="play" size={18} color={tokens.accent} />
                </View>
                <View style={styles.clipText}>
                  <ProDayText variant="body" style={styles.clipTitle}>
                    {clip.title}
                  </ProDayText>
                  <ProDayText variant="caption" muted style={styles.clipMeta}>
                    {clip.authorName} ({clip.minute}) · {clip.matchTitle}
                  </ProDayText>
                </View>
              </View>

              <View style={[styles.clipBadge, { backgroundColor: tokens.accentSoft }]}>
                <ProDayText variant="caption" style={[styles.clipBadgeText, { color: tokens.accent }]}>
                  {clip.durationSec}s · {clip.typeLabel}
                </ProDayText>
              </View>
            </PressableSpring>
          ))
        )}
      </View>

      {/* 7. CONNEXION VEO — compte, axes, appairage, méthodes (staff uniquement) */}
      {canSeeVeoAccount ? (
        <View style={styles.stack}>
          <VeoAccountPanel
            tokens={tokens}
            account={veoAccount}
            clubId={effectiveClubId ?? null}
            canConnect={canConnectVeo}
            canManageApiClient={canManageVeoApiClient}
            onConnected={() => {
              veoLibrary.reload();
            }}
          />

          <VeoStateAxes
            tokens={tokens}
            account={connectionInput.accountVerified ? 'connected' : 'disconnected'}
            camera={cameraState}
            stream={streamState}
            cameraDetail={
              cameras.length === 0
                ? "Aucun matériel enregistré au club. L'association Bluetooth se fait dans l'application Veo Cam."
                : `${cameras.length} matériel(s) enregistré(s) au club${primaryCamera?.display_name ? ` · ${primaryCamera.display_name}` : ''}`
            }
            streamDetail={
              latestRecord
                ? "État déclaré par le dernier enregistrement club — ProDay n'ouvre aucun flux de direct."
                : 'Aucune captation au club : aucun flux ne peut être déclaré.'
            }
            clubLinked={Boolean(effectiveClubId)}
            cameraAvailable={cameras.some((c) => c.status === 'connected')}
            recordsAccess={connectionInput.accountVerified || storedVideos.length > 0}
            liveAvailable={liveVideos.length > 0}
          />

          {canManage ? (
            <View style={[styles.card, { backgroundColor: tokens.surface }]}>
              <ProDayText variant="caption" muted style={styles.body}>
                Accès Dirigeant : vous pouvez enregistrer ou retirer les identifiants Veo pour le club.
              </ProDayText>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: tokens.surface }]}>
              <ProDayText variant="caption" muted style={styles.body}>
                Lecture seule : seul un dirigeant habilité peut modifier la connexion Veo du
                club. Vous voyez le même état de connexion que le pôle Club.
              </ProDayText>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: tokens.surface }]} testID="video-no-veo-access-note">
            <ProDayText variant="caption" muted style={styles.overline}>
              DISPONIBLE SANS ACCÈS VEO
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.body}>
              L'association d'une captation à un match (lien Veo, embed ou flux MP4/HLS)
              fonctionne dès maintenant, et la lecture se fait dans le lecteur intégré
              ProDay. Seule la liste automatique des vidéos du compte Veo exige un client.
            </ProDayText>
          </View>

          <VeoQrPairingCard
            tokens={tokens}
            clubId={effectiveClubId}
            onCameraPaired={() => {
              if (effectiveClubId) {
                void clubCamerasService.listCameras(effectiveClubId).then(setCameras);
              }
            }}
            onOpenGuide={(url) => {
              void Linking.openURL(url);
            }}
          />

          <VeoConnectPanel
            tokens={tokens}
            input={connectionInput}
            onOpenDocumentation={(url) => {
              void Linking.openURL(url);
            }}
          />

          <VeoProductFacts
            tokens={tokens}
            onOpenExternal={() => {
              void Linking.openURL(VEO_GO_GUIDE_URL);
            }}
          />

          <VideoCapabilityList tokens={tokens} connection={connectionInput} />
        </View>
      ) : null}

      {/* 8. RENVOI VEO — handoff honnête pour le direct plateforme */}
      {canSeeConnections ? (
        <View style={styles.stack}>
          <VeoExternalHandoffCard
            tokens={tokens}
            reason="Aucune source lisible n’est associée · le direct Veo s'ouvre sur la plateforme Veo."
            onOpenExternal={() => {
              void Linking.openURL(VEO_PLATFORM_URL);
            }}
          />

          <View style={[styles.card, { backgroundColor: tokens.surface }]} testID="veo-live-recordings-note">
            <ProDayText variant="caption" muted style={styles.overline}>
              ENREGISTREMENTS DANS PRODAY
            </ProDayText>
            <ProDayText variant="caption" muted style={styles.body}>
              La captation du match, elle, se lit dans ProDay : la section Bibliothèque liste
              les enregistrements du compte Veo connecté et les ouvre dans le lecteur intégré,
              sans quitter l'application.
            </ProDayText>
          </View>
        </View>
      ) : null}

      {/* Modal de détail */}
      <CoachVideoDetailModal
        visible={detailModalOpen}
        video={selectedDetailVideo}
        canEdit={canUploadOrAssociate}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedDetailVideo(null);
        }}
        onPlay={(v) => {
          if (v.storage_url) {
            setActivePlayingVideo({
              url: v.storage_url,
              title: v.title,
              matchInfo: `${v.team_label || 'Équipe'} · Captation club`,
              videoId: v.id,
            });
          }
        }}
        onVideoUpdated={(updated) => {
          setStoredVideos((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item)),
          );
          setVideoList((prev) =>
            prev.map((item) =>
              item.id === updated.id
                ? {
                    ...item,
                    title: updated.title,
                    category: updated.team_label || item.category,
                  }
                : item,
            ),
          );
        }}
        onVideoDeleted={(deletedId) => {
          setStoredVideos((prev) => prev.filter((item) => item.id !== deletedId));
          setVideoList((prev) => prev.filter((item) => item.id !== deletedId));
        }}
      />

      {/* Modals d'import, direct et association */}
      {canUploadOrAssociate ? (
        <>
          <CoachVideoUploadModal
            visible={uploadModalOpen}
            clubId={effectiveClubId ?? ''}
            createdByUid={effectiveCreatedByUid ?? ''}
            onClose={() => setUploadModalOpen(false)}
            onSuccess={handleUploadSuccess}
            onPlayImmediate={(v) => {
              setActivePlayingVideo({
                url: v.url,
                title: v.title,
                matchInfo: v.matchInfo,
              });
            }}
          />

          <ProDayLiveBroadcastModal
            visible={liveBroadcastModalOpen}
            clubId={effectiveClubId ?? ''}
            createdByUid={effectiveCreatedByUid ?? ''}
            onClose={() => setLiveBroadcastModalOpen(false)}
            onLiveStarted={handleLiveStarted}
            onWatchLive={(url, title) => {
              setActivePlayingVideo({
                url,
                title,
                matchInfo: 'Direct Terrain ProDay',
                isLive: true,
              });
            }}
          />

          <VeoMatchAssociateModal
            visible={associateModalOpen}
            clubId={effectiveClubId ?? ''}
            createdByUid={effectiveCreatedByUid ?? ''}
            onClose={() => setAssociateModalOpen(false)}
            onSuccess={handleAssociateSuccess}
          />
        </>
      ) : null}
    </View>
  );
}

function TeamChip({
  label,
  on,
  onPress,
  tokens,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
  tokens: VideoSurfaceTokens;
}) {
  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.96}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      style={[
        styles.filterPill,
        on
          ? { backgroundColor: 'transparent', borderColor: tokens.accent }
          : { backgroundColor: tokens.elevated, borderColor: 'transparent' },
      ]}
      testID="video-team-chip"
    >
      <ProDayText
        variant="caption"
        style={[styles.filterPillText, { color: on ? tokens.accent : tokens.foreground }]}
      >
        {label}
      </ProDayText>
    </PressableSpring>
  );
}

// ----------------------------------------------------------------------------
// STYLES PURS (Strictement AUCUNE couleur hex ou rgba en dur, tokens injectés)
// ----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
    gap: 16,
  },
  stack: {
    gap: 14,
  },

  unifiedHeader: {
    borderRadius: CARD_RADIUS,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
  },
  headerContextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  teamContextTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contextIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  headerEyebrow: {
    ...APPLE_TYPOGRAPHY.eyebrow,
    letterSpacing: 0.8,
  },
  mainHeading: {
    ...APPLE_TYPOGRAPHY.title1,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
    lineHeight: 17,
    maxWidth: 520,
  },

  veoStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 220,
  },
  veoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  veoStatusText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },

  heroPlayerContainer: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  heroPlayerLayout: {
    flexDirection: 'column',
  },
  heroPlayerMedia: {
    width: '100%',
    minHeight: 250,
  },
  heroPlayerSidePanel: {
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  heroPlayerSidePanelDesktop: {
    borderTopWidth: 0,
  },
  heroSideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sourceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroSideTag: {
    ...APPLE_TYPOGRAPHY.caption2,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroSideTitle: {
    ...APPLE_TYPOGRAPHY.headline,
    fontWeight: '800',
  },
  heroCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSideActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.xs,
  },
  heroSideActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  heroClipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  videoCardNormalized: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 280,
    maxWidth: '100%',
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
  },
  skeletonCard: {
    minHeight: 220,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
  skeletonThumb: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  skeletonContent: {
    padding: spacing.md,
    gap: 4,
  },

  libraryFilters: {
    gap: spacing.sm,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 48,
    gap: 8,
  },
  searchField: {
    flex: 1,
    ...APPLE_TYPOGRAPHY.body,
    paddingVertical: 10,
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: 4,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
  },
  filterPillText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },

  card: {
    borderRadius: CARD_RADIUS,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...APPLE_TYPOGRAPHY.headline,
  },
  cardSubtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
  },
  overline: {
    ...APPLE_TYPOGRAPHY.eyebrow,
    textTransform: 'uppercase',
  },
  body: {
    ...APPLE_TYPOGRAPHY.caption1,
    lineHeight: 18,
  },
  footnote: {
    ...APPLE_TYPOGRAPHY.caption2,
    lineHeight: 16,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 999,
    flexShrink: 0,
  },
  aiBtnText: {
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyBody: {
    ...APPLE_TYPOGRAPHY.caption1,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 420,
  },
  noticeCard: {
    borderRadius: CARD_RADIUS,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
  },
  noticeLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noticeText: {
    flex: 1,
    lineHeight: 17,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'transparent',
    flexShrink: 0,
  },
  associateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    flexShrink: 0,
  },
  associateBtnText: {
    fontWeight: '700',
  },
  retryBtnText: {
    fontWeight: '700',
  },

  clipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: 14,
    borderRadius: CARD_RADIUS,
  },
  clipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    minWidth: 0,
  },
  clipText: {
    flex: 1,
    minWidth: 0,
  },
  playIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '600',
  },
  clipMeta: {
    marginTop: 2,
  },
  clipBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  clipBadgeText: {
    fontWeight: '700',
  },

  pulsingLiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
  },
  pulsingLiveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pulsingLiveHeading: {
    ...APPLE_TYPOGRAPHY.caption2,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pulsingLiveTitle: {
    ...APPLE_TYPOGRAPHY.subheadline,
    fontWeight: '700',
  },
  pulsingLiveWatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  pulsingLiveWatchText: {
    ...APPLE_TYPOGRAPHY.caption1,
    fontWeight: '700',
  },
});
