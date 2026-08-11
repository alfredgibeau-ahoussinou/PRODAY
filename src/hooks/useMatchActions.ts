import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRequireAuth } from './useRequireAuth';
import type { User } from '../models/User';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import { clubsService } from '../services/clubs.service';
import { teamEventsService } from '../services/teamEvents.service';
import { usersService } from '../services/users.service';
import { filterMembersByCategory, memberUidsExcluding } from '../utils/clubMembersFilter';

export function useMatchActions(profile: User | null) {
  const { requireAuth } = useRequireAuth();

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
      if (!requireAuth('Connectez-vous pour accepter ce match amical.') || !profile) return;
      const club = await getClubIdentity();
      if (!club) return;

      const isRequester = match.requester_club_id === club.id;
      const acceptingCounter = match.status === 'COUNTERED' && isRequester;
      if (isRequester && !acceptingCounter) {
        Alert.alert('Info', 'Vous ne pouvez pas accepter votre propre proposition.');
        return;
      }

      try {
        await friendlyMatchesService.acceptMatch(match.id, club.id, club.name);

        const counter = match.counter_proposal;
        const startsAt =
          acceptingCounter && counter?.date ? counter.date : match.date;
        const city =
          acceptingCounter && counter?.city ? counter.city : match.city;
        const timeLabel =
          acceptingCounter && counter?.time_label
            ? counter.time_label
            : match.time_label;
        const categories = match.category ? [match.category] : undefined;

        const opponentForAccepter = acceptingCounter
          ? match.opponent_club_name ?? club.name
          : match.requester_club_name;
        const opponentForRequester = acceptingCounter
          ? match.requester_club_name
          : match.opponent_club_name ?? club.name;

        // Club qui valide (destinataire d’une invitation, ou demandeur sur une contre-proposition)
        const accepterClubId = acceptingCounter
          ? match.opponent_club_id ?? club.id
          : profile.profile.club_id ?? club.id;
        const accepterClubName = acceptingCounter
          ? match.opponent_club_name ?? club.name
          : club.name;

        if (accepterClubId) {
          const accepterMembers = await usersService.listMembersByClubId(accepterClubId);
          const filtered = filterMembersByCategory(accepterMembers, categories);
          const inviteeUids = memberUidsExcluding(
            filtered,
            acceptingCounter ? match.requester_uid : profile.uid,
          );
          const organizerUid = acceptingCounter
            ? accepterMembers.find(
                (m) =>
                  m.role === 'coach' ||
                  m.role === 'organizer' ||
                  m.role === 'agent' ||
                  m.role === 'club',
              )?.uid ?? accepterMembers[0]?.uid
            : profile.uid;
          if (organizerUid && inviteeUids.length > 0) {
            const organizer =
              accepterMembers.find((m) => m.uid === organizerUid) ??
              (await usersService.getPublicById(organizerUid));
            await teamEventsService.createFriendlyConvocation({
              matchId: match.id,
              opponentName: acceptingCounter
                ? match.requester_club_name
                : opponentForAccepter,
              organizerUid,
              organizerName: organizer?.display_name ?? accepterClubName,
              clubId: accepterClubId,
              clubName: accepterClubName,
              startsAt,
              city,
              locationLabel: timeLabel,
              inviteeUids,
              categories,
            });
          }
        }

        const requesterMembers = await usersService.listMembersByClubId(match.requester_club_id);
        const requesterFiltered = filterMembersByCategory(requesterMembers, categories);
        const requesterInvitees = memberUidsExcluding(
          requesterFiltered,
          match.requester_uid,
        );
        const requesterOrganizerUid =
          match.requester_uid ??
          requesterMembers.find(
            (m) =>
              m.role === 'coach' ||
              m.role === 'organizer' ||
              m.role === 'agent' ||
              m.role === 'club',
          )?.uid ??
          requesterMembers[0]?.uid;

        if (requesterOrganizerUid && requesterInvitees.length > 0) {
          const requesterOrganizer =
            requesterMembers.find((m) => m.uid === requesterOrganizerUid) ??
            (await usersService.getPublicById(requesterOrganizerUid));
          await teamEventsService.createFriendlyConvocation({
            matchId: match.id,
            opponentName: acceptingCounter
              ? match.opponent_club_name ?? club.name
              : opponentForRequester,
            organizerUid: requesterOrganizerUid,
            organizerName:
              requesterOrganizer?.display_name ?? match.requester_club_name,
            clubId: match.requester_club_id,
            clubName: match.requester_club_name,
            startsAt,
            city,
            locationLabel: timeLabel,
            inviteeUids: requesterInvitees,
            categories,
          });
        }

        Alert.alert(
          'Match confirmé',
          'Le match est créé dans les calendriers des deux clubs. Les joueurs peuvent recevoir la convocation.',
        );
        onDone?.();
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
      }
    },
    [profile, getClubIdentity, requireAuth],
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
    async (match: FriendlyMatch, onDone?: () => void, onOpenProfile?: () => void) => {
      Alert.alert('Match joué', 'Confirmer que ce match amical a bien eu lieu ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await friendlyMatchesService.markPlayed(match.id);
              Alert.alert(
                'Match enregistré',
                'Pensez à mettre à jour vos stats saison sur votre profil pour booster votre Visibilité.',
                [
                  { text: 'Plus tard', style: 'cancel' },
                  { text: 'Mon profil', onPress: onOpenProfile },
                ]
              );
              onDone?.();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec.');
            }
          },
        },
      ]);
    },
    []
  );

  const canAccept = useCallback(
    (match: FriendlyMatch, clubId?: string | null) => {
      if (!clubId) {
        return match.status === 'OPEN';
      }
      if (match.requester_club_id === clubId) {
        return match.status === 'COUNTERED';
      }
      if (match.status === 'INVITED') {
        return !match.opponent_club_id || match.opponent_club_id === clubId;
      }
      return match.status === 'OPEN';
    },
    [],
  );

  const declineMatch = useCallback(
    async (match: FriendlyMatch, onDone?: () => void) => {
      if (!requireAuth('Connectez-vous pour répondre.') || !profile) return;
      const club = await getClubIdentity();
      if (!club) return;
      Alert.alert('Refuser', 'Refuser cette proposition de match ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendlyMatchesService.declineMatch(match.id, club.id);
              onDone?.();
            } catch (e) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec.');
            }
          },
        },
      ]);
    },
    [profile, getClubIdentity, requireAuth],
  );

  const counterPropose = useCallback(
    async (
      match: FriendlyMatch,
      patch: {
        date: Date;
        time_label: string;
        city: string;
        message?: string;
      },
      onDone?: () => void,
    ) => {
      if (!requireAuth('Connectez-vous pour proposer une autre date.') || !profile) return;
      const club = await getClubIdentity();
      if (!club) return;
      try {
        await friendlyMatchesService.counterPropose({
          matchId: match.id,
          clubId: club.id,
          clubName: club.name,
          date: patch.date,
          time_label: patch.time_label,
          city: patch.city,
          message: patch.message,
        });
        Alert.alert(
          'Contre-proposition envoyée',
          'Le club adverse pourra accepter ou refuser votre nouvelle proposition.',
        );
        onDone?.();
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec.');
      }
    },
    [profile, getClubIdentity, requireAuth],
  );

  const isRequester = useCallback(
    (match: FriendlyMatch, clubId: string) => match.requester_club_id === clubId,
    [],
  );

  return {
    acceptMatch,
    cancelMatch,
    markPlayed,
    declineMatch,
    counterPropose,
    canAccept,
    isRequester,
    getClubIdentity,
  };
}
