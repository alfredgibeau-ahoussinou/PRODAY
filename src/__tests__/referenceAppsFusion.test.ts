import { buildActivityFeed } from '../features/v3/engines/activityFeed.engine';
import { explainHealthScores } from '../features/v3/engines/healthExplain.engine';
import { pickHealthProgram, programProgress } from '../features/v3/engines/healthProgram.engine';
import { summarizeCarpoolTrip } from '../features/v3/engines/carpoolGeo.engine';
import { suggestFieldSlots } from '../features/v3/engines/playtomicFields.engine';
import { clusterGeoMarkers } from '../core/geo/geoCluster.engine';
import { computeHealthSnapshot } from '../core/health/healthState.engine';
import { estimateTravelMinutes, formatTravelEta } from '../utils/geoEta';
import { teamThreadId } from '../utils/teamChatIds';
import type { TeamEvent } from '../models/TeamEvent';

describe('Fusion références apps — moteurs V3', () => {
  it('calcule ETA trajet (Uber)', () => {
    expect(estimateTravelMinutes(10)).toBe(14);
    expect(formatTravelEta(14)).toBe('~14 min');
  });

  it('explique les scores santé (WHOOP)', () => {
    const health = computeHealthSnapshot({
      globalScore: 60,
      upcomingEventsCount: 4,
      pendingConvocations: 2,
      recentMatchCount: 3,
      streakDays: 2,
      profileCompletion: 80,
    });
    const exp = explainHealthScores(
      {
        globalScore: 60,
        upcomingEventsCount: 4,
        pendingConvocations: 2,
        recentMatchCount: 3,
        streakDays: 2,
        profileCompletion: 80,
      },
      health
    );
    expect(exp.fatigueFactors.length).toBeGreaterThan(0);
    expect(exp.summary.length).toBeGreaterThan(10);
  });

  it('construit un fil activité (Strava)', () => {
    const event = {
      id: 'e1',
      title: 'Match amical',
      city: 'Paris',
      organizer_uid: 'u1',
      organizer_name: 'Coach',
      starts_at: new Date(Date.now() + 86400000),
      invitee_uids: ['p1'],
      rsvps: { p1: 'yes' as const },
      event_type: 'friendly' as const,
      carpool_slots: [],
      created_at: new Date(),
      updated_at: new Date(),
    } satisfies TeamEvent;
    const feed = buildActivityFeed({
      uid: 'p1',
      teamEvents: [event],
      openMatches: [],
      applications: [],
    });
    expect(feed.some((f) => f.kind === 'rsvp_yes')).toBe(true);
  });

  it('sélectionne un programme santé (NTC)', () => {
    const prog = pickHealthProgram('OVERLOADED');
    expect(prog.id).toBe('recovery');
    expect(prog.days).toHaveLength(7);
    expect(programProgress([1, 2, 3])).toBe(43);
  });

  it('résume un trajet covoit avec score IA', () => {
    const trip = summarizeCarpoolTrip({
      userLocation: { latitude: 48.85, longitude: 2.35 },
      slot: {
        driver_uid: 'd1',
        driver_name: 'Driver',
        meeting_location: { latitude: 48.86, longitude: 2.36 },
      },
      rec: { eventId: 'e1', driverUid: 'd1', iaScore: 88, distanceKm: 2 },
    });
    expect(trip.etaLabel).toMatch(/min/);
    expect(trip.iaScore).toBe(88);
  });

  it('clusterise les marqueurs géo (Google Maps)', () => {
    const markers = Array.from({ length: 8 }, (_, i) => ({
      id: `m${i}`,
      kind: 'match' as const,
      title: `Match ${i}`,
      subtitle: 'Paris',
      city: 'Paris',
      location: { latitude: 48.85 + i * 0.001, longitude: 2.35 },
      distanceKm: i,
      tab: 'matchs' as const,
      entityId: `x${i}`,
    }));
    const { clusters } = clusterGeoMarkers(markers);
    expect(clusters.length).toBeGreaterThan(0);
  });

  it('Playtomic masqué tant que l’API n’est pas branchée', () => {
    const fields = suggestFieldSlots({ city: 'Paris', limit: 2 });
    expect(fields).toEqual([]);
  });

  it('identifie un thread équipe (Discord/WhatsApp)', () => {
    expect(teamThreadId('abc')).toBe('team__abc');
    expect(teamThreadId('abc').startsWith('team__')).toBe(true);
  });
});
