/** Affichage admin : +20 000 de base + 150 / jour depuis le début du tracking. */
export const SITE_VISITS_DISPLAY_BASE = 20_000;
export const SITE_VISITS_DISPLAY_PER_DAY = 150;

function utcDayMs(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function daysSinceTrackingStart(trackingStartedAt: Date | null): number {
  if (!trackingStartedAt || Number.isNaN(trackingStartedAt.getTime())) return 0;
  return Math.max(
    0,
    Math.floor((utcDayMs(new Date()) - utcDayMs(trackingStartedAt)) / 86_400_000),
  );
}

export function boostDisplayedSiteVisitsTotal(
  real: number,
  trackingStartedAt: Date | null,
): number {
  return (
    real +
    SITE_VISITS_DISPLAY_BASE +
    daysSinceTrackingStart(trackingStartedAt) * SITE_VISITS_DISPLAY_PER_DAY
  );
}

export function boostDisplayedDailySiteVisits(real: number): number {
  return real + SITE_VISITS_DISPLAY_PER_DAY;
}
