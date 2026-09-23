import fs from 'fs';
import path from 'path';
import type { TeamEvent, TeamEventType } from '../models/TeamEvent';
import {
  buildCoachLoadSignals,
  COACH_LOAD_WINDOW_DAYS,
} from '../utils/coachLoadSignals';

const ROOT = path.resolve(__dirname, '..');
function read(relative: string): string {
  return fs.readFileSync(path.join(ROOT, relative), 'utf8');
}

const NOW = new Date('2026-09-15T10:00:00.000Z');

function daysAgo(days: number, hour = 18): Date {
  const date = new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function makeEvent(
  kind: TeamEventType,
  startsAt: Date,
  extra: Partial<TeamEvent> = {},
): TeamEvent {
  return {
    id: `${kind}_${startsAt.getTime()}`,
    title: kind === 'training' ? 'Séance' : 'Match',
    event_type: kind,
    organizer_uid: 'coach_1',
    organizer_name: 'Coach',
    starts_at: startsAt,
    city: 'Nantes',
    invitee_uids: [],
    rsvps: {},
    created_at: daysAgo(30),
    updated_at: daysAgo(1),
    ...extra,
  } as TeamEvent;
}

const ROSTER = [
  { uid: 'p1', displayName: 'Léo Martin' },
  { uid: 'p2', displayName: 'Sam Diallo' },
];

describe('coachLoadSignals — signaux réels uniquement', () => {
  it('ne compte dans la fenêtre que les événements des 7 derniers jours', () => {
    const report = buildCoachLoadSignals({
      roster: ROSTER,
      events: [
        makeEvent('friendly', daysAgo(2), {
          invitee_uids: ['p1'],
          rsvps: { p1: 'yes' },
        }),
        // Hors fenêtre : 9 jours.
        makeEvent('friendly', daysAgo(9), {
          invitee_uids: ['p1'],
          rsvps: { p1: 'yes' },
        }),
        // Futur : non joué.
        makeEvent('friendly', new Date(NOW.getTime() + 24 * 3600 * 1000), {
          invitee_uids: ['p1'],
          rsvps: { p1: 'yes' },
        }),
      ],
      now: NOW,
    });

    expect(report.windowDays).toBe(COACH_LOAD_WINDOW_DAYS);
    expect(report.matchesInWindow).toBe(1);
    expect(report.signals.find((s) => s.uid === 'p1')?.matchesLast7d).toBe(1);
  });

  it('exclut un événement annulé', () => {
    const report = buildCoachLoadSignals({
      roster: ROSTER,
      events: [
        makeEvent('friendly', daysAgo(3), {
          invitee_uids: ['p1'],
          rsvps: { p1: 'yes' },
          live_state: { status: 'cancelled', home_score: 0, away_score: 0 },
        }),
      ],
      now: NOW,
    });
    expect(report.matchesInWindow).toBe(0);
    expect(report.signals[0].matchesLast7d).toBe(0);
  });

  it('ne déduit jamais une présence sur une séance déjà pointée', () => {
    const report = buildCoachLoadSignals({
      roster: ROSTER,
      events: [
        makeEvent('training', daysAgo(1), {
          invitee_uids: ['p1', 'p2'],
          rsvps: { p1: 'yes', p2: 'yes' },
          // Seul p1 a été pointé présent.
          attendance_marks: { p1: 'present' },
        }),
      ],
      now: NOW,
    });
    const p1 = report.signals.find((s) => s.uid === 'p1');
    const p2 = report.signals.find((s) => s.uid === 'p2');
    expect(p1?.trainingsLast7d).toBe(1);
    expect(p2?.trainingsLast7d).toBe(0);
    expect(report.sources.attendance).toBe(true);
  });

  it('compte les présences annoncées seulement si la séance n’est pas pointée', () => {
    const report = buildCoachLoadSignals({
      roster: ROSTER,
      events: [
        makeEvent('training', daysAgo(1), {
          invitee_uids: ['p1'],
          rsvps: { p1: 'yes' },
        }),
      ],
      now: NOW,
    });
    expect(report.signals[0].trainingsLast7d).toBe(1);
  });

  it('préfère les minutes de la feuille de match et ne les additionne jamais aux minutes déclarées', () => {
    const withSheet = buildCoachLoadSignals({
      roster: ROSTER,
      events: [
        makeEvent('friendly', daysAgo(2), {
          invitee_uids: ['p1'],
          rsvps: { p1: 'yes' },
          player_match_stats: {
            p1: { uid: 'p1', player_name: 'Léo Martin', minutes_played: 90 },
          },
        }),
      ],
      wellnessByUid: { p1: { minutes_last_7d: 500 } },
      now: NOW,
    });
    expect(withSheet.signals[0].minutesLast7d).toBe(90);

    const declaredOnly = buildCoachLoadSignals({
      roster: ROSTER,
      events: [],
      wellnessByUid: { p1: { minutes_last_7d: 120 } },
      now: NOW,
    });
    expect(declaredOnly.signals[0].minutesLast7d).toBe(120);
  });

  it('calcule le délai depuis le dernier match joué (null si aucun)', () => {
    const report = buildCoachLoadSignals({
      roster: ROSTER,
      events: [
        makeEvent('friendly', daysAgo(12, 9), {
          invitee_uids: ['p1', 'p2'],
          attendance_marks: { p1: 'present' },
        }),
      ],
      now: NOW,
    });
    expect(report.signals.find((s) => s.uid === 'p1')?.daysSinceLastMatch).toBe(12);
    expect(report.signals.find((s) => s.uid === 'p2')?.daysSinceLastMatch).toBeNull();
  });

  it('remonte un statut déclaré indisponible sans détail médical', () => {
    const report = buildCoachLoadSignals({
      roster: ROSTER,
      events: [],
      wellnessByUid: { p1: { fatigue: 8 } , p2: { suspended: true } },
      now: NOW,
    });
    const status = report.alerts.find((a) => a.uid === 'p2');
    expect(status?.kind).toBe('availability');
    expect(report.actionable.some((a) => a.uid === 'p2')).toBe(true);
    expect(status?.message).not.toMatch(/\d+\s*%/);
    expect(report.unavailablePlayers).toBe(1);
  });

  it('déclare explicitement les sources absentes quand rien n’est lisible', () => {
    const report = buildCoachLoadSignals({
      roster: ROSTER,
      events: [],
      now: NOW,
    });
    expect(report.hasData).toBe(false);
    expect(report.counts.high).toBe(0);
    expect(report.counts.caution).toBe(0);
    expect(report.actionable).toHaveLength(0);
    expect(report.missing).toEqual(
      expect.arrayContaining([
        'événements de l’équipe',
        'pointages de présence',
        'minutes jouées',
        'check-ins de forme',
      ]),
    );
    expect(report.sources.roster).toBe(true);
    expect(report.sources.events).toBe(false);
  });

  it('distingue une source lisible d’une fenêtre vide, et date le dernier événement', () => {
    const report = buildCoachLoadSignals({
      roster: ROSTER,
      // Événement lu, mais hors fenêtre : la source fonctionne.
      events: [makeEvent('training', daysAgo(20))],
      now: NOW,
    });
    expect(report.sources.events).toBe(true);
    expect(report.eventsInWindow).toBe(0);
    expect(report.hasData).toBe(false);
    expect(report.missing).toContain('événements des 7 derniers jours');
    expect(report.missing).not.toContain('événements de l’équipe');
    expect(report.lastEvent?.eventType).toBe('training');
    expect(report.lastEvent?.startsAt.getTime()).toBe(daysAgo(20).getTime());
  });

  it('n’expose pas un événement futur ou annulé comme dernier événement', () => {
    const report = buildCoachLoadSignals({
      roster: ROSTER,
      events: [
        makeEvent('friendly', new Date(NOW.getTime() + 3 * 24 * 3600 * 1000)),
        makeEvent('training', daysAgo(1), {
          live_state: { status: 'cancelled', home_score: 0, away_score: 0 },
        }),
      ],
      now: NOW,
    });
    expect(report.lastEvent).toBeNull();
    expect(report.eventsInWindow).toBe(0);
  });

  it('n’invente aucune alerte de charge sans données', () => {
    const report = buildCoachLoadSignals({ roster: ROSTER, events: [], now: NOW });
    expect(report.alerts.every((a) => a.kind === 'missing')).toBe(true);
  });
});

describe('Tableau de bord Coach — bandeau de vigilance branché', () => {
  const HOME = 'screens/coach/CoachHomeScreen.tsx';

  it('ne contient plus le message d’attente', () => {
    const source = read(HOME);
    expect(source).not.toContain('Aucune alerte réelle connectée');
    expect(source).not.toContain('dès le branchement du suivi');
  });

  it('rend le panneau d’alertes existant avec les signaux réels', () => {
    const source = read(HOME);
    expect(source).toContain('CoachLoadAlertsPanel');
    expect(source).toContain('alerts={loadReport.alerts}');
    expect(source).toContain('useCoachLoadAlerts');
  });

  it('couvre les états chargement, erreur et absence de donnée', () => {
    const source = read(HOME);
    expect(source).toContain("loadState === 'loading'");
    expect(source).toContain("loadState === 'error'");
    expect(source).toContain('Aucune donnée de charge sur 7 jours');
    expect(source).toContain('reloadLoadAlerts');
  });

  it('le rafraîchissement pull-to-refresh relit réellement les données', () => {
    const source = read(HOME);
    expect(source).not.toContain('setTimeout(() => setRefreshing(false), 500)');
    expect(source).toContain('reloadLoadAlerts();');
  });
});
