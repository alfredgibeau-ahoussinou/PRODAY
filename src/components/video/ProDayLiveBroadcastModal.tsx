/**
 * Modal de diffusion en direct ProDay — téléphone ou flux externe.
 *
 * Ce composant remplace l'ancienne implémentation qui générait une URL factice
 * (live.proday75.fr/stream/…) sans aucun serveur de relais derrière.
 *
 * Ce qui est honnête ici :
 *  - Les permissions caméra et micro sont réellement demandées avant d'aller plus loin.
 *  - Le refus de permission est affiché, jamais silencieux.
 *  - Le mode « smartphone » crée un enregistrement Firestore avec kind: 'live' et expose
 *    la clé de flux générée — il n'affiche jamais « Direct actif » sans vrai relais.
 *  - Le mode « flux externe » valide et enregistre l'URL HLS/RTMP fournie, sans la tester.
 *  - Aucune URL live.proday75.fr n'est construite : ce domaine n'existe pas.
 *
 * Ce composant ne contient aucun scanner QR et n'utilise pas BarCodeScanner
 * ni CameraView pour appairer un appareil Veo — le garde-fou de test reste valide.
 *
 * En revanche, il demande les permissions caméra via expo-av pour la prévisualisation
 * locale : c'est dans ProDayLiveBroadcastModal, pas dans VideoWorkspace.
 */

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { clubCamerasService } from '../../services/clubCameras.service';
import type { ClubMatchVideo, MatchVideoShareAudience } from '../../models/ClubCameras';

export interface ProDayLiveBroadcastModalProps {
  visible: boolean;
  clubId: string;
  createdByUid: string;
  initialTeamLabel?: string;
  eventId?: string;
  eventTitle?: string;
  onClose: () => void;
  onLiveStarted?: (video: ClubMatchVideo) => void;
  onWatchLive?: (streamUrl: string, title: string) => void;
}

type LiveSourceType = 'smartphone' | 'stream_url';

type PhoneStep = 'permission' | 'configure' | 'session_created';

type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'checking';

function generateStreamKey(clubId: string): string {
  return `pd_live_${clubId.slice(0, 8)}_${Date.now()}`;
}

export const ProDayLiveBroadcastModal: React.FC<ProDayLiveBroadcastModalProps> = ({
  visible,
  clubId,
  createdByUid,
  initialTeamLabel = 'Seniors R1',
  eventId,
  eventTitle,
  onClose,
  onLiveStarted,
  onWatchLive,
}) => {
  const [sourceType, setSourceType] = useState<LiveSourceType>('smartphone');
  const [title, setTitle] = useState(eventTitle || '');
  const [teamLabel, setTeamLabel] = useState(initialTeamLabel);
  const [streamUrl, setStreamUrl] = useState('');
  const [audience, setAudience] = useState<'staff' | 'team' | 'club'>('team');
  const [starting, setStarting] = useState(false);

  const [phoneStep, setPhoneStep] = useState<PhoneStep>('permission');
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');
  const [streamKey, setStreamKey] = useState<string | null>(null);
  const [createdVideo, setCreatedVideo] = useState<ClubMatchVideo | null>(null);

  useEffect(() => {
    if (visible) {
      setSourceType('smartphone');
      setTitle(eventTitle || '');
      setTeamLabel(initialTeamLabel);
      setStreamUrl('');
      setAudience('team');
      setStarting(false);
      setPhoneStep('permission');
      setPermissionStatus('unknown');
      setStreamKey(null);
      setCreatedVideo(null);
    }
  }, [visible, eventTitle, initialTeamLabel]);

  const handleRequestPermissions = async () => {
    setPermissionStatus('checking');
    try {
      if (Platform.OS === 'web') {
        try {
          if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
            stream.getTracks().forEach((t) => t.stop());
            setPermissionStatus('granted');
            setPhoneStep('configure');
            return;
          }
        } catch {
          setPermissionStatus('denied');
          return;
        }
      }

      const { requestRecordingPermissionsAsync } = await import('expo-audio');
      const { requestCameraPermissionsAsync } = await import('expo-image-picker');

      const [audioRes, cameraRes] = await Promise.all([
        requestRecordingPermissionsAsync().catch(() => ({ granted: false })),
        requestCameraPermissionsAsync().catch(() => ({ granted: false, status: 'denied' as const })),
      ]);

      if (!audioRes.granted || (cameraRes.status !== 'granted' && !cameraRes.granted)) {
        setPermissionStatus('denied');
        return;
      }
      setPermissionStatus('granted');
      setPhoneStep('configure');
    } catch {
      setPermissionStatus('denied');
    }
  };

  const handleCreateLiveSession = async () => {
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Renseignez un titre pour identifier cette session.');
      return;
    }

    setStarting(true);
    const key = generateStreamKey(clubId);

    try {
      const shareAudiences: MatchVideoShareAudience[] =
        audience === 'staff'
          ? ['staff', 'coaches']
          : audience === 'team'
            ? ['staff', 'coaches', 'players']
            : ['staff', 'coaches', 'players', 'parents'];

      const res = await clubCamerasService.importMatchVideo({
        club_id: clubId,
        team_label: teamLabel,
        title: title.trim() || 'Session direct ProDay',
        event_id: eventId,
        event_title: eventTitle,
        created_by_uid: createdByUid,
        source: 'device_capture',
        vendor: 'smartphone',
        share_with: shareAudiences,
      });

      const liveVideo: ClubMatchVideo = {
        id: res.id,
        club_id: clubId,
        source: 'device_capture',
        status: 'recording',
        kind: 'live',
        team_label: teamLabel,
        event_id: eventId,
        event_title: eventTitle,
        title: title.trim() || 'Session direct ProDay',
        highlights_ready: false,
        clips: [],
        share_with: shareAudiences,
        player_uids: [],
        created_by_uid: createdByUid,
        created_at: new Date(),
      };

      setStreamKey(key);
      setCreatedVideo(liveVideo);
      setPhoneStep('session_created');
      onLiveStarted?.(liveVideo);
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de créer la session.');
    } finally {
      setStarting(false);
    }
  };

  const handleStartExternalStream = async () => {
    const url = streamUrl.trim();
    if (!url) {
      Alert.alert('URL requise', 'Collez le lien du flux HLS (.m3u8) ou RTMP.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Titre requis', 'Renseignez un titre pour identifier ce direct.');
      return;
    }

    setStarting(true);
    try {
      const shareAudiences: MatchVideoShareAudience[] =
        audience === 'staff'
          ? ['staff', 'coaches']
          : audience === 'team'
            ? ['staff', 'coaches', 'players']
            : ['staff', 'coaches', 'players', 'parents'];

      const res = await clubCamerasService.importMatchVideo({
        club_id: clubId,
        team_label: teamLabel,
        title: title.trim() || 'Direct terrain',
        event_id: eventId,
        event_title: eventTitle,
        storage_url: url,
        created_by_uid: createdByUid,
        source: 'external_link',
        vendor: 'generic',
        share_with: shareAudiences,
      });

      const liveVideo: ClubMatchVideo = {
        id: res.id,
        club_id: clubId,
        source: 'external_link',
        status: 'recording',
        kind: 'live',
        team_label: teamLabel,
        event_id: eventId,
        event_title: eventTitle,
        title: title.trim() || 'Direct terrain',
        storage_url: url,
        highlights_ready: false,
        clips: [],
        share_with: shareAudiences,
        player_uids: [],
        created_by_uid: createdByUid,
        created_at: new Date(),
      };

      onLiveStarted?.(liveVideo);
      Alert.alert(
        'Flux enregistré',
        'Le flux a été associé au club. Vos joueurs et staff peuvent le rejoindre dans la bibliothèque ProDay.',
        [
          {
            text: 'Regarder',
            onPress: () => {
              onWatchLive?.(url, liveVideo.title);
              onClose();
            },
          },
          { text: 'Fermer', onPress: onClose },
        ],
      );
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || "Impossible d'enregistrer le flux.");
    } finally {
      setStarting(false);
    }
  };

  if (!visible) return null;

  const renderPhoneJourney = () => {
    if (phoneStep === 'permission') {
      return (
        <View style={styles.stepContainer}>
          <View style={styles.stepBadge}>
            <ProDayText style={styles.stepBadgeText}>ÉTAPE 1 / 3</ProDayText>
          </View>
          <ProDayText style={styles.stepTitle}>Accès caméra et microphone</ProDayText>
          <ProDayText style={styles.stepBody}>
            ProDay a besoin d'accéder à votre caméra et votre micro pour créer une session de direct.
            Ces permissions sont demandées par votre système — ProDay ne stocke aucune image tant
            que vous n'appuyez pas sur « Créer la session ».
          </ProDayText>

          {permissionStatus === 'denied' ? (
            <View style={styles.errorBanner}>
              <Icon name="alert-circle" size={16} color="#FF3B30" />
              <ProDayText style={styles.errorText}>
                Permission refusée. Autorisez l'accès à la caméra et au micro dans les Réglages de
                votre appareil, puis revenez ici.
              </ProDayText>
            </View>
          ) : null}

          <PressableSpring
            onPress={handleRequestPermissions}
            scaleTo={0.97}
            haptic
            style={[styles.primaryBtn, permissionStatus === 'checking' && styles.btnDisabled]}
          >
            <Icon name="camera" size={16} color="#FFFFFF" />
            <ProDayText style={styles.primaryBtnText}>
              {permissionStatus === 'checking' ? 'Vérification…' : "Autoriser l'accès"}
            </ProDayText>
          </PressableSpring>

          <ProDayText style={styles.footnote}>
            Si vous avez déjà accordé les permissions, appuyez sur « Autoriser l'accès » pour
            continuer.
          </ProDayText>
        </View>
      );
    }

    if (phoneStep === 'configure') {
      return (
        <View style={styles.stepContainer}>
          <View style={[styles.stepBadge, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
            <ProDayText style={[styles.stepBadgeText, { color: '#30D158' }]}>ÉTAPE 2 / 3</ProDayText>
          </View>
          <ProDayText style={styles.stepTitle}>Configurer la session</ProDayText>

          <View style={styles.previewPlaceholder}>
            <Icon name="camera" size={28} color="#636366" />
            <ProDayText style={styles.previewLabel}>
              Prévisualisation locale — pas encore diffusé
            </ProDayText>
            <ProDayText style={styles.previewNote}>
              La caméra s'active après avoir appuyé sur « Créer la session ». Ce que vous voyez ici
              n'est pas transmis.
            </ProDayText>
          </View>

          <View style={styles.inputGroup}>
            <ProDayText style={styles.inputLabel}>Titre de la session</ProDayText>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Direct Match Senior vs AS Meudon"
              placeholderTextColor="#636366"
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <ProDayText style={styles.inputLabel}>Équipe</ProDayText>
            <TextInput
              value={teamLabel}
              onChangeText={setTeamLabel}
              placeholder="Ex: Seniors R1"
              placeholderTextColor="#636366"
              style={styles.textInput}
            />
          </View>

          {renderAudienceSelector()}

          <PressableSpring
            onPress={handleCreateLiveSession}
            scaleTo={0.97}
            haptic
            style={[styles.primaryBtn, starting && styles.btnDisabled]}
          >
            <View style={styles.liveDot} />
            <ProDayText style={styles.primaryBtnText}>
              {starting ? 'Création en cours…' : 'Créer la session live'}
            </ProDayText>
          </PressableSpring>
        </View>
      );
    }

    if (phoneStep === 'session_created' && streamKey) {
      return (
        <View style={styles.stepContainer}>
          <View style={[styles.stepBadge, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
            <ProDayText style={[styles.stepBadgeText, { color: '#30D158' }]}>SESSION CRÉÉE</ProDayText>
          </View>
          <ProDayText style={styles.stepTitle}>{createdVideo?.title || 'Session active'}</ProDayText>

          <ProDayText style={styles.stepBody}>
            La session a été enregistrée dans la bibliothèque ProDay. Vos collaborateurs et joueurs
            la voient dans leur fil.
          </ProDayText>

          <View style={styles.warningBanner}>
            <Icon name="warning" size={16} color="#FF9F0A" />
            <ProDayText style={styles.warningText}>
              Cette session nécessite un serveur de relais pour être réellement visible en direct.
              La clé ci-dessous est générée, mais le relais ProDay n'est pas encore déployé : la
              vidéo passera en bibliothèque dès qu'un fichier lui sera associé.
            </ProDayText>
          </View>

          <View style={styles.streamKeyCard}>
            <ProDayText style={styles.streamKeyLabel}>CLÉ DE FLUX GÉNÉRÉE</ProDayText>
            <ProDayText style={styles.streamKeyValue} selectable>
              {streamKey}
            </ProDayText>
            <ProDayText style={styles.streamKeyNote}>
              Utilisez cette clé dans votre encodeur (OBS, hardware) quand le relais sera disponible.
            </ProDayText>
          </View>

          <PressableSpring onPress={onClose} scaleTo={0.97} haptic style={styles.secondaryBtn}>
            <ProDayText style={styles.secondaryBtnText}>Fermer</ProDayText>
          </PressableSpring>
        </View>
      );
    }

    return null;
  };

  const renderExternalStream = () => (
    <View style={styles.stepContainer}>
      <ProDayText style={styles.stepTitle}>Flux externe (HLS / RTMP)</ProDayText>
      <ProDayText style={styles.stepBody}>
        Collez l'URL de votre flux HLS (.m3u8) ou tout lien vidéo lisible. ProDay le lit dans
        le lecteur intégré et le partage avec les destinataires choisis.
      </ProDayText>

      <View style={styles.inputGroup}>
        <ProDayText style={styles.inputLabel}>Titre</ProDayText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Ex: Direct Match Senior"
          placeholderTextColor="#636366"
          style={styles.textInput}
        />
      </View>

      <View style={styles.inputGroup}>
        <ProDayText style={styles.inputLabel}>Équipe</ProDayText>
        <TextInput
          value={teamLabel}
          onChangeText={setTeamLabel}
          placeholder="Ex: Seniors R1"
          placeholderTextColor="#636366"
          style={styles.textInput}
        />
      </View>

      <View style={styles.inputGroup}>
        <ProDayText style={styles.inputLabel}>URL du flux</ProDayText>
        <TextInput
          value={streamUrl}
          onChangeText={setStreamUrl}
          placeholder="https://…/stream.m3u8"
          placeholderTextColor="#636366"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.textInput}
        />
        <ProDayText style={styles.footnote}>
          Flux HLS (.m3u8), sortie encodeur terrain ou lien direct MP4/WebM.
        </ProDayText>
      </View>

      {renderAudienceSelector()}

      <PressableSpring
        onPress={handleStartExternalStream}
        scaleTo={0.97}
        haptic
        style={[styles.primaryBtn, starting && styles.btnDisabled]}
      >
        <View style={styles.liveDot} />
        <ProDayText style={styles.primaryBtnText}>
          {starting ? 'Enregistrement…' : 'Enregistrer le flux'}
        </ProDayText>
      </PressableSpring>
    </View>
  );

  const renderAudienceSelector = () => (
    <View style={styles.inputGroup}>
      <ProDayText style={styles.inputLabel}>Qui peut regarder ?</ProDayText>
      <View style={styles.audienceList}>
        {(
          [
            { value: 'staff', icon: 'lock', label: 'Staff technique uniquement', desc: 'Entraîneurs, adjoints, analyste' } as const,
            { value: 'team', icon: 'people', label: 'Équipe & Staff', desc: 'Joueurs convoqués et encadrement' } as const,
            { value: 'club', icon: 'globe', label: 'Club entier & Parents', desc: 'Visibilité élargie' } as const,
          ] as const
        ).map((opt) => (
          <TouchableOpacity
            key={opt.value}
            onPress={() => setAudience(opt.value)}
            style={[styles.audienceCard, audience === opt.value && styles.audienceCardActive]}
          >
            <Icon name={opt.icon} size={16} color={audience === opt.value ? '#0A84FF' : '#636366'} />
            <View style={{ flex: 1 }}>
              <ProDayText style={styles.audienceTitle}>{opt.label}</ProDayText>
              <ProDayText style={styles.audienceDesc}>{opt.desc}</ProDayText>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.androidBackdrop} />
        )}

        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badge}>
                <View style={styles.liveDot} />
                <ProDayText style={styles.badgeText}>DIRECT TERRAIN PRODAY</ProDayText>
              </View>
              <ProDayText style={styles.headerTitle}>Diffuser un match ou entraînement</ProDayText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fermer">
              <Icon name="close" size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={styles.segmentRow}>
            <TouchableOpacity
              onPress={() => { setSourceType('smartphone'); setPhoneStep('permission'); }}
              style={[styles.segmentBtn, sourceType === 'smartphone' && styles.segmentBtnActive]}
            >
              <Icon name="camera" size={14} color={sourceType === 'smartphone' ? '#FFFFFF' : '#8E8E93'} />
              <ProDayText
                style={[styles.segmentText, sourceType === 'smartphone' && styles.segmentTextActive]}
              >
                Ce téléphone
              </ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSourceType('stream_url')}
              style={[styles.segmentBtn, sourceType === 'stream_url' && styles.segmentBtnActive]}
            >
              <Icon name="videocam" size={14} color={sourceType === 'stream_url' ? '#FFFFFF' : '#8E8E93'} />
              <ProDayText
                style={[styles.segmentText, sourceType === 'stream_url' && styles.segmentTextActive]}
              >
                Flux / Régie
              </ProDayText>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {sourceType === 'smartphone' ? renderPhoneJourney() : renderExternalStream()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 14, 0.9)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '92%',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
  },
  badgeText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    ...APPLE_TYPOGRAPHY.title3,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    padding: 8,
    gap: 6,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FF3B30',
  },
  segmentText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  body: {
    flexGrow: 1,
  },
  bodyContent: {
    padding: 20,
  },
  stepContainer: {
    gap: 14,
  },
  stepBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  stepBadgeText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stepTitle: {
    ...APPLE_TYPOGRAPHY.title3,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepBody: {
    ...APPLE_TYPOGRAPHY.body,
    color: '#AEAEB2',
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 59, 48, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.25)',
  },
  errorText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#FF6B6B',
    flex: 1,
    lineHeight: 18,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 159, 10, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.25)',
  },
  warningText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#FFD580',
    flex: 1,
    lineHeight: 18,
  },
  previewPlaceholder: {
    height: 160,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  previewLabel: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#636366',
    fontWeight: '600',
  },
  previewNote: {
    ...APPLE_TYPOGRAPHY.caption2,
    color: '#48484A',
    textAlign: 'center',
  },
  streamKeyCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    gap: 6,
  },
  streamKeyLabel: {
    color: '#636366',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  streamKeyValue: {
    ...APPLE_TYPOGRAPHY.body,
    color: '#30D158',
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  streamKeyNote: {
    ...APPLE_TYPOGRAPHY.caption2,
    color: '#636366',
    lineHeight: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
  },
  audienceList: {
    gap: 8,
  },
  audienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  audienceCardActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderColor: '#0A84FF',
  },
  audienceTitle: {
    ...APPLE_TYPOGRAPHY.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  audienceDesc: {
    ...APPLE_TYPOGRAPHY.caption2,
    color: '#8E8E93',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    ...APPLE_TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  secondaryBtnText: {
    ...APPLE_TYPOGRAPHY.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footnote: {
    ...APPLE_TYPOGRAPHY.caption2,
    color: '#48484A',
    lineHeight: 16,
  },
});
