import { getAdminConfigHealth } from "@/lib/adminConfigHealth";
import { fetchBetaWaitlistAdmin } from "@/lib/adminBetaApi";
import { fetchAdminPlatformStats } from "@/lib/adminPlatformApi";
import { fetchTrafficStatsAdmin } from "@/lib/adminTrafficApi";
import {
  buildActionRequired,
  buildInsights,
  computeHealthScore,
} from "@/lib/adminCc/insights";

/** Agrégat serveur partagé par les pages Control Center. */
export async function loadAccOverview() {
  const [beta, visits, platform] = await Promise.all([
    fetchBetaWaitlistAdmin({ pageSize: 1 }),
    fetchTrafficStatsAdmin(),
    fetchAdminPlatformStats(),
  ]);

  const config = getAdminConfigHealth();
  const configOk = config.filter((c) => c.ok).length;
  const configFailing = config.length - configOk;

  const days = visits.data.days ?? [];
  const todayKey = new Date().toISOString().slice(0, 10);
  const weekCutoff = new Date();
  weekCutoff.setUTCDate(weekCutoff.getUTCDate() - 6);
  const weekKey = weekCutoff.toISOString().slice(0, 10);

  const siteToday = days
    .filter((d) => d.day_key === todayKey)
    .reduce((a, d) => a + d.site_visits, 0);
  const siteWeek = days
    .filter((d) => d.day_key >= weekKey)
    .reduce((a, d) => a + d.site_visits, 0);

  const insightInput = {
    pendingBeta: beta.counts.pending,
    pastDue: platform.data.subscriptions.past_due,
    reportsOpen: platform.data.reports.open,
    usersTotal: platform.data.users.total,
    usersActive: platform.data.users.active,
    proCount: platform.data.subscriptions.pro_count,
    configFailing,
    siteWeek,
    siteToday,
  };

  const health = computeHealthScore({
    configTotal: config.length,
    configOk,
    pendingBeta: beta.counts.pending,
    pastDue: platform.data.subscriptions.past_due,
    reportsOpen: platform.data.reports.open,
  });

  const actions = buildActionRequired(insightInput);
  const actionRequired = actions.filter((a) => a.count > 0).length;

  return {
    beta,
    visits,
    platform,
    config,
    configFailing,
    siteToday,
    siteWeek,
    health,
    actions,
    insights: buildInsights(insightInput),
    badges: {
      pendingBeta: beta.counts.pending,
      pastDue: platform.data.subscriptions.past_due,
      actionRequired,
    },
  };
}
