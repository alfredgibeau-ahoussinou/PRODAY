import type { MessageCatalog } from '../types';
import { UI_EN } from './ui.en';
import { MODULES_EN } from './modules.en';
import { SECONDARY_EN } from './secondary.en';
import { TERTIARY_EN } from './tertiary.en';

export const en: MessageCatalog = {
  ...UI_EN,
  ...MODULES_EN,
  ...SECONDARY_EN,
  ...TERTIARY_EN,
  'common.search': 'Search…',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.close': 'Close',

  'language.title': 'Choose language',
  'language.search': 'Search for a language…',
  'language.current': 'Current language',
  'language.hint':
    'Five languages available: French, English, Spanish, German and Korean.',
  'language.translating': 'Loading interface…',

  'preferences.title': 'Preferences',
  'preferences.subtitle': 'Calendar, language and sync',
  'preferences.language': 'App language',
  'preferences.languageHint': 'Interface and menus',
  'preferences.calendarSync': 'Device calendar sync',
  'preferences.calendarSyncHint': 'Matches and call-ups in your iOS/Android calendar',
  'preferences.syncNow': 'Sync now',
  'preferences.neverSynced': 'Never synced',
  'preferences.syncedJustNow': 'Just now',
  'preferences.syncedMinutes': '{{n}} min ago',
  'preferences.syncedHours': '{{n}} h ago',
  'preferences.syncedDays': '{{n}} d ago',
  'preferences.syncDisabled': 'Sync disabled',
  'preferences.syncDisabledBody': 'Enable calendar sync to continue.',
  'preferences.syncOk': 'Calendar synced',
  'preferences.syncOkBody': '{{n}} event(s) exported.',
  'preferences.syncPermission': 'Permission required',
  'preferences.syncPermissionBody': 'Allow ProDay to access your calendar in device settings.',
  'preferences.syncEmpty': 'Nothing to sync',
  'preferences.syncEmptyBody': 'No scheduled events yet.',
  'preferences.syncError': 'Sync failed. Try again later.',

  'profile.chapters.account': 'Account',
  'profile.chapters.showcase': 'Showcase',
  'profile.chapters.career': 'Career',
  'profile.chapters.activity': 'Activity',
  'profile.chapters.settings': 'Settings',

  'nav.overflow': 'Navigation',
  'nav.menu': 'Menu',
  'nav.menuA11y': 'Navigation menu',

  'tabs.home': 'Home',
  'tabs.recrutement': 'Transfer',
  'tabs.matchs': 'Matches',
  'tabs.covoiturage': 'Carpool',
  'tabs.sante': 'Health',
  'tabs.feed': 'Feed',
  'tabs.reels': 'Reels',
  'tabs.famille': 'Family',
  'tabs.messages': 'Messages',
  'tabs.profil': 'Profile',
  'tabs.shop': 'Shop',
};
