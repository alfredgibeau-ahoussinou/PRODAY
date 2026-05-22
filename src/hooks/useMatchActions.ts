import { useCallback } from 'react';
import { Alert } from 'react-native';
import type { User } from '../models/User';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import { clubsService } from '../services/clubs.service';

export function useMatchActions(profile: User | null) {
  const getClubIdentity = useCallback(async () => {
    if (!profile) return null;
    if (profile.profile.club_id) {
      const club = await clubsService.getById(profile.profile.club_id);
      return {
        id: profile.profile.club_id,
        name: club?.name ?? profile.display_name,
      };
    }
    return { id: profile.uid, name: profile.display_name };
  }, [profile]);

  const acceptMatch = useCallback(
    async (match: FriendlyMatch, onDone?: () => void) => {
      if (!profile) {
        Alert.alert('Connexion requise', 'Connectez-vous depuis l’onglet Profil.');
        return;
      }
      const club = await getClubIdentity();
      if (!club) return;
      if (match.requester_club_id === club.id) {
        Alert.alert('Info', 'Vous ne pouvez pas accepter votre propre proposition.');
        return;
      }
      try {
        await friendlyMatchesService.acceptMatch(match.id, club.id, club.name);
        Alert.alert('Match accepté', `Vous affrontez ${match.requester_club_name}.`);
        onDone?.();
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
      }
    },
    [profile, getClubIdentity]
  );

  const cancelMatch = useCallback(
    async (match: FriendlyMatch, onDone?: () => void) => {
      if (!profile) return;
      const club = await getClubIdentity();
      if (!club || match.requester_club_id !== club.id) {
        Alert.alert('Action refusée', 'Seul le club demandeur peut annuler.');
        return;
      }
      Alert.alert('Annuler le match', 'Confirmer l’annulation ?', [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendlyMatchesService.cancelMatch(match.id);
              onDone?.();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec.');
            }
          },
        },
      ]);
    },
    [profile, getClubIdentity]
  );

  const markPlayed = useCallback(
    async (match: FriendlyMatch, onDone?: () => void) => {
      try {
        await friendlyMatchesService.markPlayed(match.id);
        onDone?.();
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec.');
      }
    },
    []
  );

  const canAccept = useCallback(
    (match: FriendlyMatch) => match.status === 'OPEN',
    []
  );

  const isRequester = useCallback(
    (match: FriendlyMatch, clubId: string) => match.requester_club_id === clubId,
    []
  );

  return { acceptMatch, cancelMatch, markPlayed, canAccept, isRequester, getClubIdentity };
}
