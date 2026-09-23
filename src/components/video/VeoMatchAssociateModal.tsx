/**
 * Modale d'association de match VEO au club — ProDay
 * Permet d'associer une captation Veo Cam ou un flux vidéo réel à une rencontre du club.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { APPLE_TYPOGRAPHY } from '../../theme/appleTypography';
import { veoService } from '../../services/veo/veo.service';
import type { ClubMatchVideo } from '../../models/ClubCameras';
import { colors } from '../../theme/designTokens';

interface VeoMatchAssociateModalProps {
  visible: boolean;
  clubId: string;
  createdByUid: string;
  onClose: () => void;
  onSuccess?: (video: ClubMatchVideo) => void;
  /** Fiche de match du calendrier : préremplit le formulaire et rattache la captation à l'événement. */
  eventId?: string;
  eventTitle?: string;
  teamLabel?: string;
  scheduledAt?: Date;
}

export const VeoMatchAssociateModal: React.FC<VeoMatchAssociateModalProps> = ({
  visible,
  clubId,
  createdByUid,
  onClose,
  onSuccess,
  eventId,
  eventTitle,
  teamLabel: teamLabelProp,
  scheduledAt,
}) => {
  const [title, setTitle] = useState(eventTitle ?? '');
  const [veoUrl, setVeoUrl] = useState('');
  const [teamLabel, setTeamLabel] = useState(teamLabelProp ?? 'Seniors R1');
  const [opponent, setOpponent] = useState('');
  const [saving, setSaving] = useState(false);

  const authStatus = veoService.getVeoAuthStatus();

  const handleAssociate = async () => {
    if (!veoUrl.trim()) {
      Alert.alert('URL requise', 'Veuillez renseigner le lien de la vidéo ou du match Veo.');
      return;
    }

    const parsed = veoService.parseVeoUrl(veoUrl);
    if (!parsed.isValid) {
      Alert.alert('URL Invalide', parsed.error || 'Le format du lien de captation est incorrect.');
      return;
    }

    setSaving(true);
    try {
      const matchVideo = await veoService.associateMatch({
        clubId,
        title: title.trim() || eventTitle?.trim() || `${teamLabel} vs ${opponent || 'Adversaire'}`,
        veoUrl: veoUrl.trim(),
        teamLabel: teamLabel.trim(),
        opponent: opponent.trim() || undefined,
        createdByUid,
        eventId: eventId ?? undefined,
        eventTitle: eventTitle ?? undefined,
        scheduledAt,
      });

      Alert.alert(
        'Captation Associée',
        `La vidéo « ${matchVideo.title} » est désormais rattachée au club et disponible en visionnage immédiat.`
      );
      onSuccess?.(matchVideo);
      onClose();
      // Reset form
      setTitle('');
      setVeoUrl('');
      setOpponent('');
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d’associer la vidéo Veo au match.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Icon name="videocam" size={18} color="#000000" />
              </View>
              <View>
                <ProDayText style={styles.title}>Associer un Match Veo</ProDayText>
                <ProDayText style={styles.sub}>
                  {eventTitle
                    ? `Rattacher une captation vidéo au match « ${eventTitle} »`
                    : 'Rattacher une captation vidéo au calendrier du club'}
                </ProDayText>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Statut VEO */}
            <View style={styles.authNotice}>
              <Icon name="shield" size={14} color="#F59E0B" />
              <ProDayText style={styles.authNoticeText}>
                Connectez-vous à votre compte Veo dans la rubrique Vidéo pour récupérer vos matchs automatiquement, ou collez le lien de votre captation ci-dessous.
              </ProDayText>
            </View>

            {/* URL Veo ou flux */}
            <View style={styles.formGroup}>
              <ProDayText style={styles.label}>Lien du match Veo ou flux vidéo *</ProDayText>
              <TextInput
                value={veoUrl}
                onChangeText={setVeoUrl}
                placeholder="https://app.veo.co/matches/mon-match ou https://..."
                placeholderTextColor="#636366"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ProDayText style={styles.hint}>
                Prend en charge les liens publics Veo Cam, embeds et flux MP4 / HLS.
              </ProDayText>
            </View>

            {/* Titre du match */}
            <View style={styles.formGroup}>
              <ProDayText style={styles.label}>Intitulé de la rencontre</ProDayText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ex. Seniors R1 vs RC France"
                placeholderTextColor="#636366"
                style={styles.input}
              />
            </View>

            {/* Équipe & Catégorie */}
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <ProDayText style={styles.label}>Équipe / Catégorie</ProDayText>
                <TextInput
                  value={teamLabel}
                  onChangeText={setTeamLabel}
                  placeholder="Seniors R1, U17 R2..."
                  placeholderTextColor="#636366"
                  style={styles.input}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <ProDayText style={styles.label}>Adversaire</ProDayText>
                <TextInput
                  value={opponent}
                  onChangeText={setOpponent}
                  placeholder="Club adverse"
                  placeholderTextColor="#636366"
                  style={styles.input}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <ProDayText style={styles.cancelText}>Annuler</ProDayText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAssociate}
              disabled={saving}
              style={[styles.submitBtn, saving && { opacity: 0.6 }]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <>
                  <Icon name="checkmark-circle" size={14} color="#000000" />
                  <ProDayText style={styles.submitText}>Associer au Club</ProDayText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#16161A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#BF5AF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...APPLE_TYPOGRAPHY.headline,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sub: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#8E8E93',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  body: {
    padding: 18,
    gap: 14,
  },
  authNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  authNoticeText: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#F59E0B',
    flex: 1,
    lineHeight: 16,
  },
  formGroup: {
    gap: 6,
  },
  label: {
    ...APPLE_TYPOGRAPHY.caption1,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    ...APPLE_TYPOGRAPHY.subheadline,
  },
  hint: {
    ...APPLE_TYPOGRAPHY.caption2,
    color: '#8E8E93',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  cancelText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    color: '#8E8E93',
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#BF5AF2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  submitText: {
    ...APPLE_TYPOGRAPHY.subheadline,
    color: '#000000',
    fontWeight: '700',
  },
});
