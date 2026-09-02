import { Linking, Platform, Share } from 'react-native';

export interface CalendarEventPayload {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Service d'exportation de calendrier 1-tap pour ProDay.
 * Permet d'ajouter instantanément un match ou un entraînement dans Google Agenda / Apple Calendar.
 */
export const calendarExportService = {
  /**
   * Génère l'URL Google Calendar directe pour l'événement.
   */
  getGoogleCalendarUrl(event: CalendarEventPayload): string {
    const startIso = event.startDate.toISOString().replace(/-|:|\.\d+/g, '');
    const endIso = event.endDate.toISOString().replace(/-|:|\.\d+/g, '');
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startIso}/${endIso}`,
      details: event.description || 'Événement ProDay Football',
      location: event.location || '',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  },

  /**
   * Génère le format standard iCalendar (.ics) universel.
   */
  generateIcsContent(event: CalendarEventPayload): string {
    const startIso = event.startDate.toISOString().replace(/-|:|\.\d+/g, '');
    const endIso = event.endDate.toISOString().replace(/-|:|\.\d+/g, '');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ProDay//Football Match Calendar//FR',
      'BEGIN:VEVENT',
      `UID:${event.id}@proday.app`,
      `DTSTAMP:${startIso}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || 'Événement ProDay'}`,
      `LOCATION:${event.location || ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  },

  /**
   * Exporte un événement directement via l'application native de calendrier ou partage de lien.
   */
  async exportEventToCalendar(event: CalendarEventPayload): Promise<void> {
    const googleUrl = this.getGoogleCalendarUrl(event);

    if (Platform.OS === 'web') {
      await Linking.openURL(googleUrl);
      return;
    }

    try {
      await Share.share({
        title: event.title,
        message: `${event.title} - ${event.startDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}\nLieu : ${event.location || 'Stade'}\nAjouter au calendrier : ${googleUrl}`,
      });
    } catch {
      await Linking.openURL(googleUrl);
    }
  },
};
