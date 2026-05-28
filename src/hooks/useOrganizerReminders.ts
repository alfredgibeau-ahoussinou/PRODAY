import { useCallback, useEffect, useState } from 'react';
import type { TeamEvent } from '../models/TeamEvent';
import { getPendingInviteeUids } from '../models/TeamEvent';
import { teamEventsService } from '../services/teamEvents.service';

const HOUR_MS = 60 * 60 * 1000;

export interface OrganizerReminderItem {
  event: TeamEvent;
  pendingCount: number;
}

/** Événements de l’organisateur avec réponses en attente (relance suggérée, sans Cloud Functions). */
export function useOrganizerReminders(organizerUid: string | undefined) {
  const [items, setItems] = useState<OrganizerReminderItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!organizerUid) {
      setItems([]);
      return;
    }
    setLoading(true);
    const events = await teamEventsService.listForUser(organizerUid);
    const now = Date.now();
    const horizon = 14 * 24 * HOUR_MS;
    const due: OrganizerReminderItem[] = [];

    for (const event of events) {
      if (event.organizer_uid !== organizerUid) continue;
      const pending = getPendingInviteeUids(event);
      if (pending.length === 0) continue;
      const t = event.starts_at.getTime();
      if (t < now || t - now > horizon) continue;
      due.push({ event, pendingCount: pending.length });
    }

    due.sort((a, b) => a.event.starts_at.getTime() - b.event.starts_at.getTime());
    setItems(due.slice(0, 5));
    setLoading(false);
  }, [organizerUid]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh };
}
