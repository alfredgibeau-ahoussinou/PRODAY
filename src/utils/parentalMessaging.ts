import type { User } from '../models/User';
import { canContactMinors } from '../models/User';
import { isMinorUser } from './minor';
import { isPhysioCarePair } from './physioMessaging';
import { profileService } from '../services/profile.service';

export interface MessagingPermission {
  allowed: boolean;
  title?: string;
  message?: string;
}

function isApprovedContactForMinor(minor: User, otherUid: string): boolean {
  const settings = minor.parental_settings;
  if (settings?.contacts_filter_enabled === false) return true;
  const list = settings?.approved_contacts ?? [];
  if (list.length === 0) return false;
  return list.some((c) => c.uid === otherUid && c.approved);
}

/** Vérifie si une conversation est autorisée (contrôle parental + mineurs). */
export function evaluateMessagingPermission(
  sender: User,
  recipient: User
): MessagingPermission {
  if (sender.uid === recipient.uid) {
    return {
      allowed: false,
      title: 'Action impossible',
      message: 'Vous ne pouvez pas vous contacter vous-même.',
    };
  }

  if (isPhysioCarePair(sender.role, recipient.role)) {
    if (sender.role === 'player' && !profileService.canPerformSensitiveAction(sender)) {
      return {
        allowed: false,
        title: 'Identité requise',
        message:
          'Validez votre pièce d’identité dans Profil pour contacter un kinésithérapeute.',
      };
    }
    return { allowed: true };
  }

  if (isMinorUser(sender)) {
    const filterOn = sender.parental_settings?.contacts_filter_enabled !== false;
    if (filterOn && !isApprovedContactForMinor(sender, recipient.uid)) {
      return {
        allowed: false,
        title: 'Contrôle parental',
        message:
          'Ce contact n’est pas approuvé. Demandez à votre tuteur de l’ajouter dans Contrôle parental.',
      };
    }
  }

  if (isMinorUser(recipient)) {
    if (!canContactMinors(sender)) {
      return {
        allowed: false,
        title: 'Vérification requise',
        message:
          'Les conversations avec les comptes mineurs nécessitent un profil vérifié (badge vert).',
      };
    }
    const filterOn = recipient.parental_settings?.contacts_filter_enabled !== false;
    if (filterOn && !isApprovedContactForMinor(recipient, sender.uid)) {
      return {
        allowed: false,
        title: 'Contrôle parental',
        message:
          'Ce compte mineur n’accepte les messages que des contacts approuvés par le tuteur.',
      };
    }
  }

  return { allowed: true };
}
