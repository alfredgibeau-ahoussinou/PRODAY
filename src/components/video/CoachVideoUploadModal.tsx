/**
 * Modal d'import et téléversement vidéo direct dans ProDay (Pôle Coach & Club).
 * Supporte le glisser-déposer sur Web, la sélection native sur iOS/Android,
 * la jauge de progression en temps réel (Mo/%, vitesse, temps restant),
 * la détection de doublons et l'ouverture immédiate dans le lecteur ProDay.
 */

import React, { useEffect, useRef, useState } from 'react';
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
import * as DocumentPicker from 'expo-document-picker';
import { BlurView } from 'expo-blur';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { colors, spacing } from '../../theme/designTokens';
import {
  matchVideoUploadService,
  validateVideoFile,
  formatBytes,
  type UploadProgressInfo,
  type UploadCancelController,
} from '../../services/video/matchVideoUpload.service';
import type { ClubMatchVideo } from '../../models/ClubCameras';

export interface CoachVideoUploadModalProps {
  visible: boolean;
  clubId: string;
  createdByUid: string;
  initialTeamLabel?: string;
  eventId?: string;
  eventTitle?: string;
  onClose: () => void;
  onSuccess?: (video: ClubMatchVideo) => void;
  onPlayImmediate?: (video: { url: string; title: string; matchInfo?: string }) => void;
}

type UploadStep = 'select' | 'form' | 'uploading' | 'processing' | 'ready' | 'error';

const DEFAULT_TEAMS = ['Seniors R1', 'Seniors D1', 'U19 R1', 'U17 Nationaux', 'U15 R2', 'Équipe Féminine'];

export const CoachVideoUploadModal: React.FC<CoachVideoUploadModalProps> = ({
  visible,
  clubId,
  createdByUid,
  initialTeamLabel = 'Seniors R1',
  eventId,
  eventTitle,
  onClose,
  onSuccess,
  onPlayImmediate,
}) => {
  const [step, setStep] = useState<UploadStep>('select');
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
    rawBlob?: Blob | File;
  } | null>(null);

  const [sessionType, setSessionType] = useState<'match' | 'training'>('match');
  const [title, setTitle] = useState(eventTitle || '');
  const [teamLabel, setTeamLabel] = useState(initialTeamLabel);
  const [opponent, setOpponent] = useState('');
  const [customTeam, setCustomTeam] = useState('');

  const [progressInfo, setProgressInfo] = useState<UploadProgressInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [createdVideo, setCreatedVideo] = useState<ClubMatchVideo | null>(null);

  const cancelControllerRef = useRef<UploadCancelController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (visible) {
      setStep('select');
      setSelectedFile(null);
      setProgressInfo(null);
      setErrorMessage(null);
      setWarningMessage(null);
      setCreatedVideo(null);
      setTitle(eventTitle || '');
      setTeamLabel(initialTeamLabel);
    }
  }, [visible, eventTitle, initialTeamLabel]);

  const handleFilePicked = (file: {
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
    rawBlob?: Blob | File;
  }) => {
    const validation = validateVideoFile(file);
    if (!validation.valid) {
      Alert.alert('Fichier non valide', validation.error);
      return;
    }

    setSelectedFile(file);
    setWarningMessage(validation.warning || null);

    if (!title) {
      const defaultName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
    }
    setStep('form');
  };

  const pickDocumentNative = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        handleFilePicked({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
        });
      }
    } catch (err: any) {
      Alert.alert('Erreur', 'Impossible de sélectionner la vidéo : ' + (err?.message || 'inconnue'));
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    const effectiveTeam = customTeam.trim() || teamLabel;
    const finalTitle = title.trim() || (sessionType === 'match' ? `Match vs ${opponent || 'Adversaire'}` : 'Séance d’entraînement');

    setStep('uploading');
    setErrorMessage(null);

    try {
      // 1. Vérification des doublons
      const dup = await matchVideoUploadService.checkPotentialDuplicate(clubId, finalTitle, eventId);
      if (dup.isDuplicate) {
        const proceed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Captation déjà existante ?',
            `Une vidéo similaire (« ${dup.existingVideoTitle} ») est déjà enregistrée. Souhaitez-vous quand même continuer l’import ?`,
            [
              { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continuer', onPress: () => resolve(true) },
            ],
          );
        });
        if (!proceed) {
          setStep('form');
          return;
        }
      }

      // 2. Lancement de l'upload resumable
      const res = await matchVideoUploadService.uploadMatchVideoWithProgress(
        {
          clubId,
          teamLabel: effectiveTeam,
          title: finalTitle,
          opponent: sessionType === 'match' ? opponent.trim() : undefined,
          eventId,
          eventTitle,
          file: selectedFile,
          createdByUid,
          source: 'upload',
          vendor: 'generic',
        },
        (progress) => {
          setProgressInfo(progress);
          if (progress.status === 'processing') {
            setStep('processing');
          } else if (progress.status === 'ready') {
            setStep('ready');
          }
        },
        (controller) => {
          cancelControllerRef.current = controller;
        },
      );

      setCreatedVideo(res.video);
      setStep('ready');
      onSuccess?.(res.video);
    } catch (err: any) {
      if (err?.message?.includes('annulé')) {
        setStep('form');
      } else {
        setStep('error');
        setErrorMessage(err?.message || 'Erreur lors de l’envoi de la vidéo.');
      }
    }
  };

  const handleCancelUpload = () => {
    if (cancelControllerRef.current) {
      cancelControllerRef.current.cancel();
    }
    setStep('form');
  };

  const handleWatchNow = () => {
    if (createdVideo && createdVideo.storage_url) {
      onPlayImmediate?.({
        url: createdVideo.storage_url,
        title: createdVideo.title,
        matchInfo: `${createdVideo.team_label || 'Équipe'} · Import direct`,
      });
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.androidBackdrop} />
        )}

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.badge}>
                <Icon name="cloud-upload" size={13} color="#BF5AF2" />
                <ProDayText style={styles.badgeText}>IMPORT VIDÉO IN-APP</ProDayText>
              </View>
              <ProDayText style={styles.headerTitle}>
                {step === 'ready'
                  ? 'Vidéo Prête au Visionnage'
                  : step === 'uploading'
                    ? 'Téléversement en cours'
                    : step === 'processing'
                      ? 'Traitement en cours'
                      : 'Importer une vidéo de match ou séance'}
              </ProDayText>
            </View>

            {step !== 'uploading' && step !== 'processing' && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fermer">
                <Icon name="close" size={18} color="#8E8E93" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* RAPPEL FORMATS & LIMITES */}
            <View style={styles.infoBanner}>
              <Icon name="help" size={16} color="#0A84FF" />
              <ProDayText style={styles.infoBannerText}>
                Formats acceptés : <ProDayText style={{ fontWeight: '700' }}>MP4, MOV, WebM, M4V</ProDayText>. Fichiers jusqu’à 2 Go conseillés (4 Go max).
              </ProDayText>
            </View>

            {/* ÉTAPE 1 : SÉLECTION DU FICHIER */}
            {step === 'select' && (
              <View style={styles.selectStepContainer}>
                {/* Zone de glisser-déposer sur Web ou bouton d'import natif */}
                {Platform.OS === 'web' ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const file = e.dataTransfer.files[0];
                        handleFilePicked({
                          uri: URL.createObjectURL(file),
                          name: file.name,
                          size: file.size,
                          mimeType: file.type,
                          rawBlob: file,
                        });
                      }
                    }}
                    style={{
                      border: '2px dashed #3A3A3C',
                      borderRadius: 16,
                      padding: 32,
                      textAlign: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 12,
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          handleFilePicked({
                            uri: URL.createObjectURL(file),
                            name: file.name,
                            size: file.size,
                            mimeType: file.type,
                            rawBlob: file,
                          });
                        }
                      }}
                    />
                    <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(191, 90, 242, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BF5AF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#FFFFFF' }}>
                      Glissez-déposez votre vidéo ici
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: '#8E8E93' }}>
                      ou cliquez pour parcourir les fichiers de votre ordinateur
                    </p>
                  </div>
                ) : (
                  <TouchableOpacity onPress={pickDocumentNative} style={styles.nativePickerBox}>
                    <View style={styles.pickerIconWrap}>
                      <Icon name="videocam" size={32} color="#BF5AF2" />
                    </View>
                    <ProDayText style={styles.pickerMainText}>Choisir une vidéo sur cet appareil</ProDayText>
                    <ProDayText style={styles.pickerSubText}>MP4, MOV depuis votre galerie ou vos fichiers</ProDayText>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ÉTAPE 2 : INFORMATIONS ET VALIDATION */}
            {step === 'form' && selectedFile && (
              <View style={styles.formContainer}>
                {/* Résumé du fichier choisi */}
                <View style={styles.fileSummaryCard}>
                  <Icon name="document-text" size={24} color="#BF5AF2" />
                  <View style={{ flex: 1 }}>
                    <ProDayText style={styles.fileName} numberOfLines={1}>
                      {selectedFile.name}
                    </ProDayText>
                    <ProDayText style={styles.fileSize}>
                      Taille : {formatBytes(selectedFile.size || 0)}
                    </ProDayText>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFile(null);
                      setStep('select');
                    }}
                    style={styles.changeFileBtn}
                  >
                    <ProDayText style={styles.changeFileText}>Changer</ProDayText>
                  </TouchableOpacity>
                </View>

                {warningMessage ? (
                  <View style={styles.warningBanner}>
                    <Icon name="alert-circle" size={16} color="#FF9F0A" />
                    <ProDayText style={styles.warningText}>{warningMessage}</ProDayText>
                  </View>
                ) : null}

                {/* Sélecteur Type : Match vs Séance */}
                <View style={styles.segmentRow}>
                  <TouchableOpacity
                    onPress={() => setSessionType('match')}
                    style={[styles.segmentBtn, sessionType === 'match' && styles.segmentBtnActive]}
                  >
                    <Icon name="trophy" size={14} color={sessionType === 'match' ? '#FFFFFF' : '#8E8E93'} />
                    <ProDayText style={[styles.segmentText, sessionType === 'match' && styles.segmentTextActive]}>
                      Match officiel ou amical
                    </ProDayText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSessionType('training')}
                    style={[styles.segmentBtn, sessionType === 'training' && styles.segmentBtnActive]}
                  >
                    <Icon name="football" size={14} color={sessionType === 'training' ? '#FFFFFF' : '#8E8E93'} />
                    <ProDayText style={[styles.segmentText, sessionType === 'training' && styles.segmentTextActive]}>
                      Entraînement / Atelier
                    </ProDayText>
                  </TouchableOpacity>
                </View>

                {/* Titre de la captation */}
                <View style={styles.inputGroup}>
                  <ProDayText style={styles.inputLabel}>Titre de la vidéo</ProDayText>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Ex: J14 vs Entente Sportive ou Sorties de balle"
                    placeholderTextColor="#636366"
                    style={styles.textInput}
                  />
                </View>

                {/* Adversaire (si match) */}
                {sessionType === 'match' ? (
                  <View style={styles.inputGroup}>
                    <ProDayText style={styles.inputLabel}>Adversaire rencontré</ProDayText>
                    <TextInput
                      value={opponent}
                      onChangeText={setOpponent}
                      placeholder="Ex: AS Meudon"
                      placeholderTextColor="#636366"
                      style={styles.textInput}
                    />
                  </View>
                ) : null}

                {/* Équipe concernée */}
                <View style={styles.inputGroup}>
                  <ProDayText style={styles.inputLabel}>Équipe du club</ProDayText>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.teamChips}>
                    {DEFAULT_TEAMS.map((team) => (
                      <TouchableOpacity
                        key={team}
                        onPress={() => {
                          setTeamLabel(team);
                          setCustomTeam('');
                        }}
                        style={[styles.teamChip, teamLabel === team && !customTeam && styles.teamChipActive]}
                      >
                        <ProDayText
                          style={[
                            styles.teamChipText,
                            teamLabel === team && !customTeam && styles.teamChipTextActive,
                          ]}
                        >
                          {team}
                        </ProDayText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TextInput
                    value={customTeam}
                    onChangeText={setCustomTeam}
                    placeholder="Ou saisir une autre équipe…"
                    placeholderTextColor="#636366"
                    style={[styles.textInput, { marginTop: 8 }]}
                  />
                </View>

                {/* Bouton de démarrage du téléversement */}
                <PressableSpring
                  onPress={handleStartUpload}
                  scaleTo={0.98}
                  haptic
                  style={styles.primaryActionBtn}
                >
                  <Icon name="cloud-upload" size={16} color="#FFFFFF" />
                  <ProDayText style={styles.primaryActionText}>
                    Téléverser et intégrer au club
                  </ProDayText>
                </PressableSpring>
              </View>
            )}

            {/* ÉTAPE 3 : TÉLÉVERSEMENT & TRAITEMENT EN COURS */}
            {(step === 'uploading' || step === 'processing') && (
              <View style={styles.progressContainer}>
                <View style={styles.progressAnimationBox}>
                  <ActivityIndicator size="large" color="#BF5AF2" />
                </View>

                <ProDayText style={styles.progressTitle}>
                  {step === 'processing'
                    ? 'Finalisation & vérification de lecture…'
                    : 'Envoi de la vidéo vers ProDay…'}
                </ProDayText>

                <ProDayText style={styles.progressSubtitle}>
                  {progressInfo?.message || 'Préparation du fichier…'}
                </ProDayText>

                {/* Barre de progression */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progressInfo?.progressPercent || (step === 'processing' ? 100 : 5)}%` },
                    ]}
                  />
                </View>

                {/* Données chiffrées en temps réel */}
                <View style={styles.progressStatsRow}>
                  <ProDayText style={styles.progressStatText}>
                    {progressInfo?.progressPercent ?? 0}%
                  </ProDayText>
                  <ProDayText style={styles.progressStatText}>
                    {formatBytes(progressInfo?.bytesTransferred || 0)} / {formatBytes(progressInfo?.totalBytes || selectedFile?.size || 0)}
                  </ProDayText>
                </View>

                {progressInfo?.speedBytesPerSec ? (
                  <View style={styles.speedRow}>
                    <ProDayText style={styles.speedText}>
                      Débit : {formatBytes(progressInfo.speedBytesPerSec)}/s
                    </ProDayText>
                    {progressInfo.estimatedRemainingSec ? (
                      <ProDayText style={styles.speedText}>
                        Temps restant : {Math.ceil(progressInfo.estimatedRemainingSec / 60)} min
                      </ProDayText>
                    ) : null}
                  </View>
                ) : null}

                {/* Bouton d'annulation */}
                {step === 'uploading' && (
                  <TouchableOpacity onPress={handleCancelUpload} style={styles.cancelUploadBtn}>
                    <Icon name="close" size={16} color="#FF453A" />
                    <ProDayText style={styles.cancelUploadText}>Annuler l’envoi</ProDayText>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ÉTAPE 4 : SUCCÈS - VIDÉO PRÊTE */}
            {step === 'ready' && (
              <View style={styles.readyContainer}>
                <View style={styles.successIconBox}>
                  <Icon name="checkmark-circle" size={48} color="#30D158" />
                </View>

                <ProDayText style={styles.readyTitle}>Vidéo importée avec succès !</ProDayText>
                <ProDayText style={styles.readySubtitle}>
                  La captation est enregistrée et immédiatement lisible dans le lecteur intégré ProDay.
                </ProDayText>

                {/* Bouton direct 1-tap pour visionner */}
                <PressableSpring
                  onPress={handleWatchNow}
                  scaleTo={0.98}
                  haptic
                  style={styles.watchNowBtn}
                >
                  <Icon name="play" size={18} color="#FFFFFF" />
                  <ProDayText style={styles.watchNowText}>
                    Visionner dans le lecteur ProDay
                  </ProDayText>
                </PressableSpring>

                <TouchableOpacity onPress={onClose} style={styles.doneBtn}>
                  <ProDayText style={styles.doneBtnText}>Terminer et voir la bibliothèque</ProDayText>
                </TouchableOpacity>
              </View>
            )}

            {/* ÉTAPE 5 : ERREUR */}
            {step === 'error' && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={44} color="#FF453A" />
                <ProDayText style={styles.errorTitle}>Échec de l’envoi</ProDayText>
                <ProDayText style={styles.errorBody}>{errorMessage}</ProDayText>

                <TouchableOpacity onPress={() => setStep('form')} style={styles.retryBtn}>
                  <Icon name="refresh" size={16} color="#FFFFFF" />
                  <ProDayText style={styles.retryBtnText}>Réessayer l’envoi</ProDayText>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 14, 0.88)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
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
    backgroundColor: 'rgba(191, 90, 242, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  badgeText: {
    color: '#BF5AF2',
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
  body: {
    flexGrow: 1,
  },
  bodyContent: {
    padding: 20,
    gap: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.25)',
  },
  infoBannerText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#D1E5FF',
    flex: 1,
  },
  selectStepContainer: {
    paddingVertical: 12,
  },
  nativePickerBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  pickerIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(191, 90, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pickerMainText: {
    ...APPLE_TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pickerSubText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    marginTop: 4,
  },
  formContainer: {
    gap: 16,
  },
  fileSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  fileName: {
    ...APPLE_TYPOGRAPHY.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fileSize: {
    ...APPLE_TYPOGRAPHY.caption2,
    color: '#8E8E93',
  },
  changeFileBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  changeFileText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#BF5AF2',
    fontWeight: '600',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 159, 10, 0.12)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.25)',
  },
  warningText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#FFD60A',
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    padding: 3,
    gap: 4,
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
    backgroundColor: '#BF5AF2',
  },
  segmentText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
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
  teamChips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  teamChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  teamChipActive: {
    backgroundColor: 'rgba(191, 90, 242, 0.2)',
    borderColor: '#BF5AF2',
  },
  teamChipText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    fontWeight: '600',
  },
  teamChipTextActive: {
    color: '#BF5AF2',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#BF5AF2',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  primaryActionText: {
    ...APPLE_TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  progressAnimationBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(191, 90, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    ...APPLE_TYPOGRAPHY.title3,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  progressSubtitle: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    textAlign: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#BF5AF2',
    borderRadius: 5,
  },
  progressStatsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  progressStatText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#AEAEB2',
    fontWeight: '600',
  },
  speedRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  speedText: {
    ...APPLE_TYPOGRAPHY.caption2,
    color: '#636366',
  },
  cancelUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
  },
  cancelUploadText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#FF453A',
    fontWeight: '600',
  },
  readyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  readyTitle: {
    ...APPLE_TYPOGRAPHY.title2,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  readySubtitle: {
    ...APPLE_TYPOGRAPHY.body,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 420,
  },
  watchNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#30D158',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    marginTop: 12,
  },
  watchNowText: {
    ...APPLE_TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  doneBtn: {
    paddingVertical: 10,
    marginTop: 4,
  },
  doneBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
  },
  errorContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    ...APPLE_TYPOGRAPHY.title3,
    color: '#FF453A',
    fontWeight: '700',
  },
  errorBody: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#BF5AF2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  retryBtnText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
