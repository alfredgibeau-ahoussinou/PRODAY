import type { MessageCatalog } from '../types';
import { UI_FR } from './ui.fr';
import { MODULES_FR } from './modules.fr';
import { SECONDARY_FR } from './secondary.fr';
import { TERTIARY_FR } from './tertiary.fr';

export const fr: MessageCatalog = {
  ...UI_FR,
  ...MODULES_FR,
  ...SECONDARY_FR,
  ...TERTIARY_FR,
  'common.search': 'Rechercher…',
  'common.cancel': 'Annuler',
  'common.save': 'Enregistrer',
  'common.close': 'Fermer',

  'language.title': 'Choisir la langue',
  'language.search': 'Rechercher une langue…',
  'language.current': 'Langue actuelle',
  'language.hint':
    'Cinq langues disponibles : français, anglais, espagnol, allemand et coréen.',
  'language.translating': 'Chargement de l’interface…',

  'preferences.title': 'Préférences',
  'preferences.subtitle': 'Calendrier, langue et synchronisation',
  'preferences.language': 'Langue de l’app',
  'preferences.languageHint': 'Interface et menus',
  'preferences.calendarSync': 'Sync calendrier appareil',
  'preferences.calendarSyncHint': 'Matchs et convocations dans votre agenda iOS/Android',
  'preferences.syncNow': 'Sync maintenant',
  'preferences.neverSynced': 'Jamais synchronisé',
  'preferences.syncedJustNow': 'À l’instant',
  'preferences.syncedMinutes': 'Il y a {{n}} min',
  'preferences.syncedHours': 'Il y a {{n}} h',
  'preferences.syncedDays': 'Il y a {{n}} j',
  'preferences.syncDisabled': 'Sync désactivée',
  'preferences.syncDisabledBody': 'Activez la synchronisation calendrier pour continuer.',
  'preferences.syncOk': 'Agenda synchronisé',
  'preferences.syncOkBody': '{{n}} événement(s) exporté(s).',
  'preferences.syncPermission': 'Permission requise',
  'preferences.syncPermissionBody':
    'Autorisez ProDay à accéder à votre calendrier dans les réglages de l’appareil.',
  'preferences.syncEmpty': 'Rien à synchroniser',
  'preferences.syncEmptyBody': 'Aucun événement planifié pour le moment.',
  'preferences.syncError': 'Synchronisation impossible. Réessayez plus tard.',

  'profile.chapters.account': 'Compte',
  'profile.chapters.showcase': 'Vitrine',
  'profile.chapters.career': 'Parcours',
  'profile.chapters.activity': 'Activité',
  'profile.chapters.settings': 'Paramètres',

  'nav.overflow': 'Navigation',

  'tabs.home': 'Accueil',
  'tabs.recrutement': 'Mercato',
  'tabs.matchs': 'Matchs',
  'tabs.covoiturage': 'Covoiturage',
  'tabs.sante': 'Santé',
  'tabs.feed': 'Fil',
  'tabs.reels': 'Reels',
  'tabs.famille': 'Famille',
  'tabs.messages': 'Messages',
  'tabs.profil': 'Profil',
  'tabs.shop': 'Shop',
};
