import type { MessageCatalog } from '../types';
import { UI_DE } from './ui.de';
import { MODULES_DE } from './modules.de';
import { SECONDARY_DE } from './secondary.de';
import { TERTIARY_DE } from './tertiary.de';

export const de: MessageCatalog = {
  ...UI_DE,
  ...MODULES_DE,
  ...SECONDARY_DE,
  ...TERTIARY_DE,
  'common.search': 'Suchen…',
  'common.cancel': 'Abbrechen',
  'common.save': 'Speichern',
  'common.close': 'Schließen',

  'language.title': 'Sprache wählen',
  'language.search': 'Sprache suchen…',
  'language.current': 'Aktuelle Sprache',
  'language.hint':
    'Fünf Sprachen verfügbar: Französisch, Englisch, Spanisch, Deutsch und Koreanisch.',
  'language.translating': 'Oberfläche wird geladen…',

  'preferences.title': 'Einstellungen',
  'preferences.subtitle': 'Kalender, Sprache und Synchronisation',
  'preferences.language': 'App-Sprache',
  'preferences.languageHint': 'Oberfläche und Menüs',
  'preferences.calendarSync': 'Gerätekalender synchronisieren',
  'preferences.calendarSyncHint': 'Spiele und Einberufungen in Ihrem iOS/Android-Kalender',
  'preferences.syncNow': 'Jetzt synchronisieren',
  'preferences.neverSynced': 'Nie synchronisiert',
  'preferences.syncedJustNow': 'Gerade eben',
  'preferences.syncedMinutes': 'Vor {{n}} Min.',
  'preferences.syncedHours': 'Vor {{n}} Std.',
  'preferences.syncedDays': 'Vor {{n}} T.',
  'preferences.syncDisabled': 'Synchronisation deaktiviert',
  'preferences.syncDisabledBody': 'Aktivieren Sie die Kalendersynchronisation, um fortzufahren.',
  'preferences.syncOk': 'Kalender synchronisiert',
  'preferences.syncOkBody': '{{n}} Ereignis(se) exportiert.',
  'preferences.syncPermission': 'Berechtigung erforderlich',
  'preferences.syncPermissionBody':
    'Erlauben Sie ProDay in den Geräteeinstellungen den Zugriff auf Ihren Kalender.',
  'preferences.syncEmpty': 'Nichts zu synchronisieren',
  'preferences.syncEmptyBody': 'Noch keine geplanten Ereignisse.',
  'preferences.syncError': 'Synchronisation fehlgeschlagen. Bitte später erneut versuchen.',

  'profile.chapters.account': 'Konto',
  'profile.chapters.showcase': 'Schaufenster',
  'profile.chapters.career': 'Karriere',
  'profile.chapters.activity': 'Aktivität',
  'profile.chapters.settings': 'Einstellungen',

  'nav.overflow': 'Navigation',
  'nav.menu': 'Menü',
  'nav.menuA11y': 'Navigationsmenü',

  'tabs.home': 'Start',
  'tabs.recrutement': 'Transfer',
  'tabs.matchs': 'Spiele',
  'tabs.covoiturage': 'Mitfahren',
  'tabs.sante': 'Gesundheit',
  'tabs.feed': 'Feed',
  'tabs.reels': 'Reels',
  'tabs.messages': 'Nachrichten',
  'tabs.profil': 'Profil',
  'tabs.shop': 'Shop',
};
