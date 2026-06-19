import { Alert } from 'react-native';
import type { User } from '../models/User';
import type { SponsorProspect } from '../models/SponsorOffer';
import { sponsorProspectDraftMessage } from './sponsorProspectMessage';
import { messagesService } from '../services/messages.service';
import { usersService } from '../services/users.service';

export { sponsorProspectDraftMessage } from './sponsorProspectMessage';

export async function openSponsorProspectChat(
  profile: User,
  prospect: SponsorProspect,
  openChat: (threadId: string, draft?: string) => void
): Promise<void> {
  const ownerUid = prospect.owner_uid?.trim();
  if (!ownerUid) {
    Alert.alert(
      'Contact impossible',
      'Ce club n’a pas encore de responsable enregistré sur ProDay.'
    );
    return;
  }

  try {
    const owner = await usersService.getPublicById(ownerUid);
    if (!owner) {
      Alert.alert('Contact impossible', 'Profil du club introuvable.');
      return;
    }

    const threadId = await messagesService.getOrCreateThread(
      profile.uid,
      profile.display_name,
      owner.uid,
      prospect.name || owner.display_name,
      { currentRole: profile.role, otherRole: owner.role }
    );

    openChat(threadId, sponsorProspectDraftMessage(prospect.name));
  } catch (e) {
    Alert.alert(
      'Erreur',
      e instanceof Error ? e.message : 'Impossible d’ouvrir la conversation.'
    );
  }
}
