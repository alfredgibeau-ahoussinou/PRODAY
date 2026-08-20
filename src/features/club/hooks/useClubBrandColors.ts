import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { clubsService } from '../../../services/clubs.service';
import { normalizeCoachHexColor } from '../../../utils/coachColorPicker';
import { useClubTheme } from '../shell/ClubThemeContext';

/**
 * Enregistre primary/secondary sur le document club (owner only) + refresh thème.
 */
export function useClubBrandColors(onSaved?: () => void | Promise<void>) {
  const profile = useSessionProfile();
  const { club, brand, applyBrandColors, refreshClub } = useClubTheme();
  const [saving, setSaving] = useState(false);

  const clubId = club?.id ?? profile?.profile.club_id ?? null;
  const canEdit = Boolean(
    profile?.uid && clubId && (!club || club.owner_uid === profile.uid),
  );

  const saveColors = useCallback(
    async (primary: string, secondary: string) => {
      if (!profile?.uid || !clubId) {
        Alert.alert('Club', 'Aucun club lié à ce compte.');
        return false;
      }
      if (club && club.owner_uid !== profile.uid) {
        Alert.alert(
          'Couleurs du club',
          'Seul le propriétaire du club peut modifier les couleurs.',
        );
        return false;
      }

      const p = normalizeCoachHexColor(primary);
      const s = normalizeCoachHexColor(secondary);
      if (!p || !s) {
        Alert.alert('Couleurs du club', 'Couleurs invalides — utilisez un hex #RRGGBB.');
        return false;
      }

      setSaving(true);
      try {
        const next = await clubsService.updateBrandColors(clubId, profile.uid, {
          primary: p,
          secondary: s,
        });
        applyBrandColors(next.primary, next.secondary);
        await refreshClub();
        await onSaved?.();
        return true;
      } catch (e) {
        Alert.alert(
          'Couleurs du club',
          e instanceof Error ? e.message : 'Impossible d’enregistrer les couleurs.',
        );
        return false;
      } finally {
        setSaving(false);
      }
    },
    [profile?.uid, clubId, club, applyBrandColors, refreshClub, onSaved],
  );

  return {
    saving,
    canEdit,
    currentPrimary: brand?.primary,
    currentSecondary: brand?.secondary,
    saveColors,
  };
}
