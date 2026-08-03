import { useCallback, useEffect, useState } from 'react';
import type { EventRegistration, OrganizerEvent } from '../models/EventOrganizer';
import { eventOrganizerService } from '../services/eventOrganizer.service';

export function useOrganizerEvents(organizerUid: string | null | undefined, refreshSignal = 0) {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(Boolean(organizerUid));

  const refresh = useCallback(async () => {
    if (!organizerUid) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setEvents(await eventOrganizerService.listByOrganizer(organizerUid));
    } finally {
      setLoading(false);
    }
  }, [organizerUid]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSignal]);

  return { events, loading, refresh };
}

export function useOrganizerEventDetail(eventId: string | null, refreshSignal = 0) {
  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(Boolean(eventId));

  const refresh = useCallback(async () => {
    if (!eventId) {
      setEvent(null);
      setRegistrations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [ev, regs] = await Promise.all([
        eventOrganizerService.getById(eventId),
        eventOrganizerService.listRegistrations(eventId),
      ]);
      setEvent(ev);
      setRegistrations(regs);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSignal]);

  return { event, registrations, loading, refresh };
}
