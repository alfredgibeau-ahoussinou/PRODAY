import { Alert } from 'react-native';
import type { User } from '../models/User';
import { messagesService } from '../services/messages.service';
import { usersService } from '../services/users.service';
import { openContactConversation } from './openContactConversation';

/** Ouvre un fil messagerie sécurisé avec le conducteur (règles player↔agent respectées). */
export async function openCarpoolDriverChat(
  profile: User,
  driverUid: string,
  driverName: string,
  openChat: (threadId: string) => void,
): Promise<void> {
  if (!driverUid || driverUid === profile.uid) {
    Alert.alert('Covoiturage', 'Impossible de vous contacter vous-même.');
    return;
  }

  const target = await usersService.getById(driverUid);
  if (target) {
    await openContactConversation(
      profile,
      target,
      driverName || target.display_name,
      openChat,
    );
    return;
  }

  try {
    const threadId = await messagesService.getOrCreateThread(
      profile.uid,
      profile.display_name,
      driverUid,
      driverName || 'Conducteur',
      { currentRole: profile.role },
    );
    openChat(threadId);
  } catch (e) {
    Alert.alert(
      'Erreur',
      e instanceof Error ? e.message : 'Impossible d’ouvrir la conversation.',
    );
  }
}
