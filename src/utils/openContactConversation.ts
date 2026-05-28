import { Alert } from 'react-native';
import type { User } from '../models/User';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { messagesService } from '../services/messages.service';
import { profileService } from '../services/profile.service';
import { evaluateMessagingPermission } from './parentalMessaging';

export async function openContactConversation(
  profile: User,
  target: User,
  targetDisplayName: string,
  openChat: (threadId: string) => void
): Promise<void> {
  if (
    ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
    !profileService.canPerformSensitiveAction(profile)
  ) {
    Alert.alert(
      'Vérification requise',
      'Validez votre diplôme ou licence pour contacter d’autres profils.'
    );
    return;
  }

  const permission = evaluateMessagingPermission(profile, target);
  if (!permission.allowed) {
    Alert.alert(permission.title ?? 'Messagerie bloquée', permission.message ?? '');
    return;
  }

  try {
    const threadId = await messagesService.getOrCreateThread(
      profile.uid,
      profile.display_name,
      target.uid,
      targetDisplayName || target.display_name,
      { currentRole: profile.role, otherRole: target.role }
    );
    openChat(threadId);
  } catch (e) {
    Alert.alert(
      'Erreur',
      e instanceof Error ? e.message : 'Impossible d’ouvrir la conversation.'
    );
  }
}
