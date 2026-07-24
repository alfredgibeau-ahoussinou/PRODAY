import { buildDeviceCalendarDrafts } from '../core/calendar/deviceCalendar.mapper';
import { buildSectionIntelligence } from '../features/v3/engines/sectionIntelligence.engine';
import type { CalendarEntity } from '../core/calendar/calendarSync.engine';

describe('Phase 6. Staff dashboards + calendrier device', () => {
  it('prépare les brouillons calendrier device', () => {
    const start = new Date(Date.now() + 7200000);
    const entities: CalendarEntity[] = [
      {
        id: 'cal-1',
        kind: 'match',
        title: 'Match amical',
        subtitle: 'Senior',
        startsAt: start,
        city: 'Paris',
        tab: 'matchs',
        sourceId: 'm1',
        autoAdded: false,
      },
    ];
    const drafts = buildDeviceCalendarDrafts(entities, new Date());
    expect(drafts[0].title).toContain('ProDay');
    expect(drafts[0].endDate.getTime()).toBeGreaterThan(drafts[0].startDate.getTime());
  });

  it('insight cabinet physio pour RDV en attente', () => {
    const intel = buildSectionIntelligence({
      tab: 'home',
      pendingAppointments: 3,
      todayAppointments: 2,
    });
    expect(intel.insights[0]?.label).toBe('Cabinet');
  });

  it('insight sponsor pour prospects actifs', () => {
    const intel = buildSectionIntelligence({
      tab: 'home',
      sponsorLeads: 5,
      activeOffers: 2,
    });
    expect(intel.insights[0]?.label).toBe('Prospects');
  });
});
