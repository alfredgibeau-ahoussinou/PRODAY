import { useCallback } from 'react';
import { Alert } from 'react-native';
import type { User } from '../models/User';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import { clubsService } from '../services/clubs.service';
import { teamEventsService } from '../services/teamEvents.service';
import { usersService } from '../services/users.service';
import { filterMembersByCategory, memberUidsExcluding } from '../utils/clubMembersFilter';

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

        const categories = match.category ? [match.category] : undefined;

        if (profile.profile.club_id) {
          const accepterMembers = await usersService.listMembersByClubId(profile.profile.club_id);
          const filtered = filterMembersByCategory(accepterMembers, categories);
          const inviteeUids = memberUidsExcluding(filtered, profile.uid);
          await teamEventsService.createFriendlyConvocation({
            matchId: match.id,
            opponentName: match.requester_club_name,
            organizerUid: profile.uid,
            organizerName: profile.display_name,
            clubId: profile.profile.club_id,
            clubName: club.name,
            startsAt: match.date,
            city: match.city,
            locationLabel: match.time_label,
            inviteeUids,
            categories,
          });
        }

        const requesterMembers = await usersService.listMembersByClubId(match.requester_club_id);
        const requesterFiltered = filterMembersByCategory(requesterMembers, categories);
        const requesterInvitees = memberUidsExcluding(
          requesterFiltered,
          match.requester_uid
        );
        const requesterOrganizerUid =
          match.requester_uid ??
          requesterMembers.find(
            (m) =>
              m.role === 'coach' ||
              m.role === 'organizer' ||
              m.role === 'agent' ||
              m.role === 'club'
          )?.uid ??
          requesterMembers[0]?.uid;

        if (requesterOrganizerUid && requesterInvitees.length > 0) {
          const requesterOrganizer =
            requesterMembers.find((m) => m.uid === requesterOrganizerUid) ??
            (await usersService.getById(requesterOrganizerUid));
          await teamEventsService.createFriendlyConvocation({
            matchId: match.id,
            opponentName: match.opponent_club_name ?? club.name,
            organizerUid: requesterOrganizerUid,
            organizerName: requesterOrganizer?.display_name ?? match.requester_club_name,
            clubId: match.requester_club_id,
            clubName: match.requester_club_name,
            startsAt: match.date,
            city: match.city,
            locationLabel: match.time_label,
            inviteeUids: requesterInvitees,
            categories,
          });
        }

        Alert.alert(
          'Match accepté',
          profile.profile.club_id
            ? `Convocations créées pour les deux clubs — ${match.requester_club_name}.`
            : `Vous affrontez ${match.requester_club_name}.`
        );
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
