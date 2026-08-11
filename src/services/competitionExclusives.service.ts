/**
 * Callable-style helpers for competition exclusives (client-side + CF-ready).
 */
import { competitionsService } from './competitions.service';
import {
  attachHighlightLinks,
  buildFixtureAiSummary,
  buildRecruitmentFormSignals,
  buildTalentRadar,
} from '../utils/competitionExclusives';

export const competitionExclusivesService = {
  async generateAndStoreFixtureSummary(fixtureId: string): Promise<string> {
    const fixture = await competitionsService.getFixture(fixtureId);
    if (!fixture) throw new Error('Match introuvable');
    const summary = buildFixtureAiSummary(fixture);
    await competitionsService.updateFixtureExtras(fixtureId, { ai_summary: summary });
    return summary;
  },

  async linkHighlights(fixtureId: string, urls: string[]): Promise<string[]> {
    const fixture = await competitionsService.getFixture(fixtureId);
    if (!fixture) throw new Error('Match introuvable');
    const next = attachHighlightLinks(fixture.highlight_urls, urls);
    await competitionsService.updateFixtureExtras(fixtureId, { highlight_urls: next });
    return next;
  },

  async talentRadar(seasonId: string) {
    const stats = await competitionsService.listPlayerStats(seasonId);
    return buildTalentRadar(stats);
  },

  async recruitmentSignals(seasonId: string) {
    const stats = await competitionsService.listPlayerStats(seasonId);
    return buildRecruitmentFormSignals(stats);
  },
};
