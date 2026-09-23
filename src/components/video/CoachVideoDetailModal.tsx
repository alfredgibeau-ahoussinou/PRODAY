/**
 * Modal de détails, édition et gestion persistante d'une captation vidéo.
 * Permet aux coachs et dirigeants d'éditer le titre, l'équipe, l'adversaire,
 * les droits de partage, de partager le lien, de télécharger le fichier
 * et de supprimer/archiver la vidéo de façon définitive dans Firestore.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { colors, spacing } from '../../theme/designTokens';
import { clubCamerasService } from '../../services/clubCameras.service';
import type { ClubMatchVideo, MatchVideoShareAudience } from '../../models/ClubCameras';

export interface CoachVideoDetailModalProps {
  visible: boolean;
  video: ClubMatchVideo | null;
  onClose: () => void;
  onPlay?: (video: ClubMatchVideo) => void;
  onVideoUpdated?: (updated: ClubMatchVideo) => void;
  onVideoDeleted?: (videoId: string) => void;
  canEdit?: boolean;
}

const AUDIENCE_OPTIONS: { id: MatchVideoShareAudience; label: string }[] = [
  { id: 'coaches', label: 'Staff & Coachs' },
  { id: 'players', label: 'Joueurs' },
  { id: 'parents', label: 'Parents' },
  { id: 'staff', label: 'Direction Club' },
];

export const CoachVideoDetailModal: React.FC<CoachVideoDetailModalProps> = ({
  visible,
  video,
  onClose,
  onPlay,
  onVideoUpdated,
  onVideoDeleted,
  canEdit = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [teamLabel, setTeamLabel] = useState('');
  const [opponent, setOpponent] = useState('');
  const [shareWith, setShareWith] = useState<MatchVideoShareAudience[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setTeamLabel(video.team_label || '');
      setOpponent(video.opponent || '');
      setShareWith(video.share_with || ['coaches']);
      setIsEditing(false);
      setConfirmDelete(false);
      setFeedbackMsg(null);
    }
  }, [video]);

  if (!video) return null;

  const toggleAudience = (aud: MatchVideoShareAudience) => {
    if (shareWith.includes(aud)) {
      if (shareWith.length === 1) return; // Garder au moins 1 audience
      setShareWith(shareWith.filter((a) => a !== aud));
    } else {
      setShareWith([...shareWith, aud]);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setFeedbackMsg({ text: 'Le titre de la captation est obligatoire.', type: 'error' });
      return;
    }

    setSaving(true);
    setFeedbackMsg(null);
    try {
      await clubCamerasService.updateMatchVideo(video.id, {
        title: title.trim(),
        team_label: teamLabel.trim() || undefined,
        opponent: opponent.trim() || undefined,
        share_with: shareWith,
      });

      const updatedVideo: ClubMatchVideo = {
        ...video,
        title: title.trim(),
        team_label: teamLabel.trim() || undefined,
        opponent: opponent.trim() || undefined,
        share_with: shareWith,
      };

      onVideoUpdated?.(updatedVideo);
      setIsEditing(false);
      setFeedbackMsg({ text: 'Modifications enregistrées avec succès.', type: 'success' });
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Erreur lors de la sauvegarde.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!video.storage_url) {
      setFeedbackMsg({ text: 'Aucun lien de visionnage disponible pour le partage.', type: 'error' });
      return;
    }

    try {
      const message = `Match vidéo ProDay : ${video.title}\nLien : ${video.storage_url}`;
      if (Platform.OS === 'web') {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          await navigator.clipboard.writeText(message);
          setFeedbackMsg({ text: 'Lien du match copié dans le presse-papier !', type: 'success' });
        }
      } else {
        await Share.share({
          title: video.title,
          message,
          url: video.storage_url,
        });
      }
    } catch {
      setFeedbackMsg({ text: 'Impossible de partager le lien.', type: 'error' });
    }
  };

  const handleDownload = () => {
    if (!video.storage_url) {
      setFeedbackMsg({ text: 'Aucun fichier source disponible au téléchargement.', type: 'error' });
      return;
    }
    void Linking.openURL(video.storage_url).catch(() => {
      setFeedbackMsg({ text: 'Impossible d’ouvrir le lien de téléchargement.', type: 'error' });
    });
  };

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await clubCamerasService.deleteMatchVideo(video.id);
      onVideoDeleted?.(video.id);
      onClose();
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Erreur lors de la suppression.', type: 'error' });
      setDeleting(false);
    }
  };

  const durationStr =
    video.duration_sec && video.duration_sec > 0
      ? `${Math.round(video.duration_sec / 60)} min`
      : 'Durée non calibrée';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <ProDayText variant="caption" muted style={styles.headerCategory}>
                {video.team_label || 'Équipe Club'} · {video.vendor === 'veo' ? 'Veo Cloud' : 'Captation ProDay'}
              </ProDayText>
              <ProDayText variant="title" style={styles.headerTitle} numberOfLines={2}>
                {video.title}
              </ProDayText>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}

              accessibilityRole="button"
              accessibilityLabel="Fermer">
              <Icon name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={{ paddingBottom: spacing.xl }}>
            {feedbackMsg && (
              <View
                style={[
                  styles.feedbackBanner,
                  feedbackMsg.type === 'error' ? styles.feedbackError : styles.feedbackSuccess,
                ]}
              >
                <Icon
                  name={feedbackMsg.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
                  size={16}
                  color={feedbackMsg.type === 'error' ? '#FF453A' : '#30D158'}
                />
                <ProDayText style={styles.feedbackText}>{feedbackMsg.text}</ProDayText>
              </View>
            )}

            {/* Quick Actions Row */}
            <View style={styles.actionsBar}>
              {video.storage_url && onPlay ? (
                <PressableSpring
                  onPress={() => {
                    onPlay(video);
                    onClose();
                  }}
                  style={[styles.actionBtn, styles.actionPlayBtn]}
                >
                  <Icon name="play" size={15} color="#FFFFFF" />
                  <ProDayText style={styles.actionPlayText}>Visionner</ProDayText>
                </PressableSpring>
              ) : null}

              {video.storage_url ? (
                <PressableSpring onPress={handleDownload} style={styles.actionBtn}>
                  <Icon name="download" size={15} color={colors.textSecondary} />
                  <ProDayText style={styles.actionBtnText}>Télécharger</ProDayText>
                </PressableSpring>
              ) : null}

              <PressableSpring onPress={handleShare} style={styles.actionBtn}>
                <Icon name="share" size={15} color={colors.textSecondary} />
                <ProDayText style={styles.actionBtnText}>Partager</ProDayText>
              </PressableSpring>
            </View>

            {/* Edition Mode vs Metadata Display */}
            {isEditing ? (
              <View style={styles.editSection}>
                <ProDayText variant="caption" muted style={styles.sectionTitle}>
                  MODIFIER LES INFORMATIONS
                </ProDayText>

                <View style={styles.fieldGroup}>
                  <ProDayText variant="caption" style={styles.fieldLabel}>
                    Titre de la vidéo *
                  </ProDayText>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Ex. Match vs FC Lyon"
                    placeholderTextColor="#64748B"
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldRow}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <ProDayText variant="caption" style={styles.fieldLabel}>
                      Équipe
                    </ProDayText>
                    <TextInput
                      value={teamLabel}
                      onChangeText={setTeamLabel}
                      placeholder="Ex. U17 R1"
                      placeholderTextColor="#64748B"
                      style={styles.input}
                    />
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <ProDayText variant="caption" style={styles.fieldLabel}>
                      Adversaire
                    </ProDayText>
                    <TextInput
                      value={opponent}
                      onChangeText={setOpponent}
                      placeholder="Ex. AS Saint-Priest"
                      placeholderTextColor="#64748B"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <ProDayText variant="caption" style={styles.fieldLabel}>
                    Audience autorisée à visionner
                  </ProDayText>
                  <View style={styles.audienceGrid}>
                    {AUDIENCE_OPTIONS.map((opt) => {
                      const selected = shareWith.includes(opt.id);
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          onPress={() => toggleAudience(opt.id)}
                          style={[styles.audienceChip, selected && styles.audienceChipActive]}
                        >
                          <Icon
                            name={selected ? 'checkmark-circle' : 'people'}
                            size={14}
                            color={selected ? '#BF5AF2' : colors.textSecondary}
                          />
                          <ProDayText
                            style={[styles.audienceChipText, selected && styles.audienceChipTextActive]}
                          >
                            {opt.label}
                          </ProDayText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.editButtonsRow}>
                  <TouchableOpacity
                    onPress={() => setIsEditing(false)}
                    style={styles.cancelBtn}
                    disabled={saving}
                  >
                    <ProDayText style={styles.cancelBtnText}>Annuler</ProDayText>
                  </TouchableOpacity>

                  <PressableSpring onPress={handleSave} style={styles.saveBtn} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ProDayText style={styles.saveBtnText}>Enregistrer</ProDayText>
                    )}
                  </PressableSpring>
                </View>
              </View>
            ) : (
              <View style={styles.metadataSection}>
                <View style={styles.metadataRow}>
                  <Icon name="calendar" size={16} color={colors.textSecondary} />
                  <ProDayText variant="caption" style={styles.metadataLabel}>
                    Date :
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.metadataValue}>
                    {(video.scheduled_at || video.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </ProDayText>
                </View>

                <View style={styles.metadataRow}>
                  <Icon name="time" size={16} color={colors.textSecondary} />
                  <ProDayText variant="caption" style={styles.metadataLabel}>
                    Durée :
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.metadataValue}>
                    {durationStr}
                  </ProDayText>
                </View>

                {video.opponent ? (
                  <View style={styles.metadataRow}>
                    <Icon name="shield" size={16} color={colors.textSecondary} />
                    <ProDayText variant="caption" style={styles.metadataLabel}>
                      Adversaire :
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.metadataValue}>
                      {video.opponent}
                    </ProDayText>
                  </View>
                ) : null}

                <View style={styles.metadataRow}>
                  <Icon name="people" size={16} color={colors.textSecondary} />
                  <ProDayText variant="caption" style={styles.metadataLabel}>
                    Partagée avec :
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.metadataValue}>
                    {video.share_with && video.share_with.length > 0
                      ? video.share_with
                          .map((w) => AUDIENCE_OPTIONS.find((a) => a.id === w)?.label || w)
                          .join(', ')
                      : 'Staff & Coachs uniquement'}
                  </ProDayText>
                </View>

                <View style={styles.metadataRow}>
                  <Icon name="sparkles" size={16} color={colors.textSecondary} />
                  <ProDayText variant="caption" style={styles.metadataLabel}>
                    Temps forts IA :
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.metadataValue}>
                    {video.clips && video.clips.length > 0
                      ? `${video.clips.length} séquence(s) indexée(s)`
                      : 'Non indexés'}
                  </ProDayText>
                </View>

                {canEdit ? (
                  <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editInfoBtn}>
                    <Icon name="settings" size={14} color="#BF5AF2" />
                    <ProDayText style={styles.editInfoBtnText}>Modifier titre & permissions</ProDayText>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {/* Suppression / Archivage */}
            {canEdit && (
              <View style={styles.dangerZone}>
                <ProDayText variant="caption" muted style={styles.dangerTitle}>
                  ZONE DE GESTION DU MATCH
                </ProDayText>

                {confirmDelete ? (
                  <View style={styles.confirmBox}>
                    <ProDayText style={styles.confirmWarning}>
                      Êtes-vous sûr de vouloir supprimer cette captation de ProDay ?
                    </ProDayText>
                    <ProDayText style={styles.confirmDisclaimer}>
                      Cette action retire la vidéo et tous ses temps forts du club. Si la vidéo est
                      issue d’une caméra Veo, l’enregistrement original reste préservé sur votre compte Veo.
                    </ProDayText>

                    <View style={styles.confirmButtonsRow}>
                      <TouchableOpacity
                        onPress={() => setConfirmDelete(false)}
                        style={styles.cancelDeleteBtn}
                        disabled={deleting}
                      >
                        <ProDayText style={styles.cancelDeleteBtnText}>Annuler</ProDayText>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleDeleteConfirmed}
                        style={styles.deleteBtn}
                        disabled={deleting}
                      >
                        {deleting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <ProDayText style={styles.deleteBtnText}>Confirmer la suppression</ProDayText>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setConfirmDelete(true)}
                    style={styles.openDeleteBtn}
                  >
                    <Icon name="trash" size={14} color="#FF453A" />
                    <ProDayText style={styles.openDeleteBtnText}>Supprimer cette captation</ProDayText>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerCategory: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#94A3B8',
  },
  headerTitle: {
    marginTop: 4,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#334155',
    marginLeft: spacing.sm,
  },
  scrollBody: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderWidth: 1,
    borderColor: '#30D158',
  },
  feedbackError: {
    backgroundColor: 'rgba(255, 69, 58, 0.15)',
    borderWidth: 1,
    borderColor: '#FF453A',
  },
  feedbackText: {
    color: '#FFFFFF',
    fontSize: 13,
    flex: 1,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionPlayBtn: {
    backgroundColor: '#BF5AF2',
    borderColor: '#BF5AF2',
  },
  actionPlayText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  actionBtnText: {
    color: '#CBD5E1',
    fontWeight: '500',
    fontSize: 13,
  },
  metadataSection: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metadataLabel: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  metadataValue: {
    color: '#F8FAFC',
    fontWeight: '600',
    flex: 1,
  },
  editInfoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(191, 90, 242, 0.12)',
  },
  editInfoBtnText: {
    color: '#BF5AF2',
    fontWeight: '600',
    fontSize: 13,
  },
  editSection: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#BF5AF2',
    gap: spacing.md,
  },
  sectionTitle: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#BF5AF2',
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fieldLabel: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  audienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  audienceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  audienceChipActive: {
    backgroundColor: 'rgba(191, 90, 242, 0.2)',
    borderColor: '#BF5AF2',
  },
  audienceChipText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  audienceChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#BF5AF2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dangerZone: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  dangerTitle: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#94A3B8',
    marginBottom: spacing.sm,
  },
  openDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 69, 58, 0.1)',
    alignSelf: 'flex-start',
  },
  openDeleteBtnText: {
    color: '#FF453A',
    fontWeight: '600',
    fontSize: 13,
  },
  confirmBox: {
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#FF453A',
    gap: 8,
  },
  confirmWarning: {
    color: '#FF453A',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmDisclaimer: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 17,
  },
  confirmButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: 6,
  },
  cancelDeleteBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  cancelDeleteBtnText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  deleteBtn: {
    backgroundColor: '#FF453A',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
