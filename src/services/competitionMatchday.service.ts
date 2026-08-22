import type { User } from '../models/User';
import type { CompetitionFixture } from '../models/Competition';
import type { PlayerMatchSheetStat } from '../models/TeamEvent';
import { teamEventsService } from './teamEvents.service';
import { competitionsService } from './competitions.service';
import { motmVotesService } from './motmVotes.service';
import { notificationService } from './notification.service';
import { computeAutoPotm } from '../utils/competitionPotm';
import { rollupPlayerCompetitionStats } from '../utils/competitionPlayerRollup';

/** Create / reuse a team_event linked to a competition fixture (home club match day). */
export async function materializeFixtureTeamEvent(
  fixture: CompetitionFixture,
  profile: User,
): Promise<string> {
  if (fixture.team_event_id) return fixture.team_event_id;

  const eventId = await teamEventsService.create({
    title: `${fixture.home_name} vs ${fixture.away_name}`,
    description: `Journée ${fixture.matchday} — compétition`,
    event_type: 'competition',
    organizer_uid: profile.uid,
    organizer_name: profile.display_name,
    club_id: profile.profile.club_id,
    club_name: undefined,
    competition_fixture_id: fixture.id,
    starts_at: fixture.kickoff_at,
    city: profile.city ?? '',
    invitee_uids: [],
    reminder_hours_before: 24,
  });

  await competitionsService.linkTeamEvent(fixture.id, eventId);
  return eventId;
}

/** After fixture validation: roll sheet stats, PotM, optional push. */
export async function onFixtureValidatedMatchdayPipeline(
  fixtureId: string,
): Promise<void> {
  const fixture = await competitionsService.getFixture(fixtureId);
  if (!fixture || fixture.status !== 'validated') return;

  let sheetStats: Record<string, PlayerMatchSheetStat> | undefined;
  let organizerUid: string | undefined;
  if (fixture.team_event_id) {
    const event = await teamEventsService.getById(fixture.team_event_id);
    sheetStats = event?.player_match_stats;
    organizerUid = event?.organizer_uid?.trim() || undefined;

    // MotM votes override auto PotM when available
    const standings = await motmVotesService.standings(fixture.team_event_id);
    if (standings[0]) {
      await competitionsService.updateFixtureExtras(fixture.id, {
        auto_potm_uid: standings[0].uid,
        auto_potm_name: standings[0].name,
      });
    } else if (sheetStats) {
      const potm = computeAutoPotm(sheetStats);
      if (potm) {
        await competitionsService.updateFixtureExtras(fixture.id, {
          auto_potm_uid: potm.uid,
          auto_potm_name: potm.name,
        });
      }
    }
  }

  if (sheetStats) {
    const existing = await competitionsService.listPlayerStats(fixture.season_id);
    const rolled = rollupPlayerCompetitionStats({
      seasonId: fixture.season_id,
      competitionId: fixture.competition_id,
      sheetStats: Object.values(sheetStats),
      existing,
      homeCleanSheet: (fixture.away_score ?? 1) === 0,
      awayCleanSheet: (fixture.home_score ?? 1) === 0,
      potmUid: fixture.auto_potm_uid ?? undefined,
    });
    await competitionsService.upsertPlayerStats(
      fixture.season_id,
      fixture.competition_id,
      rolled,
    );
  }

  if (organizerUid && fixture.team_event_id) {
    void notificationService.sendPush(organizerUid, undefined, {
      title: 'Résultat validé',
      body: `${fixture.home_name} ${fixture.home_score}-${fixture.away_score} ${fixture.away_name}`,
      data: {
        type: 'competition_result',
        fixtureId: fixture.id,
        eventId: fixture.team_event_id,
      },
    });
  }

  try {
    const { competitionExclusivesService } = await import('./competitionExclusives.service');
    await competitionExclusivesService.generateAndStoreFixtureSummary(fixtureId);
  } catch {
    // non-blocking
  }
}

export async function notifyUpcomingCompetitionFixture(
  fixture: CompetitionFixture,
  uid: string,
): Promise<void> {
  await notificationService.sendPush(uid, undefined, {
    title: 'Prochain match',
    body: `${fixture.home_name} vs ${fixture.away_name} — J${fixture.matchday}`,
  });
}
