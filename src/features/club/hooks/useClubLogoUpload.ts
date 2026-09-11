import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { clubsService } from '../../../services/clubs.service';
import { canEditClubBranding } from '../../../utils/roleCapabilities';
import { pickProfileImage } from '../../../utils/pickMedia';
import { useClubTheme } from '../shell/ClubThemeContext';

/**
 * Parcours unique Accueil / Hub : picker → upload → persist logo_url → refresh thème.
 * Éditable par tout compte rôle Club rattaché (pôle Club), pas seulement owner_uid.
 */
export function useClubLogoUpload(onUploaded?: () => void | Promise<void>) {
  const profile = useSessionProfile();
  const { club, logoUrl, applyLogoUrl, refreshClub } = useClubTheme();
  const [uploading, setUploading] = useState(false);

  const clubId = club?.id ?? profile?.profile.club_id ?? null;
  const hasLogo = Boolean(logoUrl);
  const canEdit = canEditClubBranding(profile?.role, profile?.profile.club_id, clubId);

  const pickAndUpload = useCallback(async () => {
    if (!profile?.uid || !clubId) {
      Alert.alert('Club', 'Aucun club lié à ce compte.');
      return;
    }
    if (!canEditClubBranding(profile.role, profile.profile.club_id, clubId)) {
      Alert.alert(
        'Logo du club',
        'Seuls les comptes Club rattachés à ce club peuvent ajouter ou changer le logo.',
      );
      return;
    }

    const file = await pickProfileImage();
    if (!file) return;

    setUploading(true);
    try {
      const url = await clubsService.updateLogo(clubId, profile.uid, file);
      applyLogoUrl(url);
      await refreshClub();
      await onUploaded?.();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Impossible d’enregistrer le logo.';
      const isBilling =
        errMsg.includes('402') ||
        errMsg.toLowerCase().includes('billing') ||
        errMsg.toLowerCase().includes('delinquent') ||
        errMsg.toLowerCase().includes('facturation');

      if (isBilling) {
        Alert.alert(
          'Facturation Firebase requise (402)',
          'Le compte Google Cloud / Firebase du projet est suspendu (défaut de paiement sur la console GCP).\n\nSouhaitez-vous afficher ce logo en aperçu local sur cet appareil pour poursuivre ?',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Aperçu local',
              onPress: () => {
                applyLogoUrl(file.uri);
                void onUploaded?.();
              },
            },
          ],
        );
      } else {
        Alert.alert('Logo du club', errMsg);
      }
    } finally {
      setUploading(false);
    }
  }, [profile, clubId, applyLogoUrl, refreshClub, onUploaded]);

  return {
    uploading,
    hasLogo,
    canEdit,
    pickAndUpload,
    actionLabel: hasLogo ? 'Changer le logo' : 'Ajouter le logo',
  };
}
