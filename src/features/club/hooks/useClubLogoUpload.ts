import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { clubsService } from '../../../services/clubs.service';
import { pickProfileImage } from '../../../utils/pickMedia';
import { useClubTheme } from '../shell/ClubThemeContext';

/**
 * Parcours unique Accueil / Hub : picker → upload → persist logo_url → refresh thème.
 */
export function useClubLogoUpload(onUploaded?: () => void | Promise<void>) {
  const profile = useSessionProfile();
  const { club, logoUrl, applyLogoUrl, refreshClub } = useClubTheme();
  const [uploading, setUploading] = useState(false);

  const clubId = club?.id ?? profile?.profile.club_id ?? null;
  const hasLogo = Boolean(logoUrl);
  const canEdit = Boolean(
    profile?.uid && clubId && (!club || club.owner_uid === profile.uid),
  );

  const pickAndUpload = useCallback(async () => {
    if (!profile?.uid || !clubId) {
      Alert.alert('Club', 'Aucun club lié à ce compte.');
      return;
    }
    if (club && club.owner_uid !== profile.uid) {
      Alert.alert(
        'Logo du club',
        'Seul le propriétaire du club peut ajouter ou changer le logo.',
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
      Alert.alert(
        'Logo du club',
        e instanceof Error ? e.message : 'Impossible d’enregistrer le logo.',
      );
    } finally {
      setUploading(false);
    }
  }, [profile?.uid, clubId, club, applyLogoUrl, refreshClub, onUploaded]);

  return {
    uploading,
    hasLogo,
    canEdit,
    pickAndUpload,
    actionLabel: hasLogo ? 'Changer le logo' : 'Ajouter le logo',
  };
}
