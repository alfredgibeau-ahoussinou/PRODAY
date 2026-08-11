/** Bêta iOS — 15 août 2026 à 18 h (Europe/Paris, CEST UTC+2). */
export const IOS_BETA_LAUNCH_ISO = '2026-08-15T16:00:00.000Z';

export const IOS_BETA_LAUNCH_LABEL = '15 août 2026 à 18 h';

export const IOS_BETA_LAUNCH_LABEL_SHORT = '15 août 2026';

/** Date initialement annoncée, avant report. */
export const IOS_BETA_LAUNCH_PREVIOUS_LABEL_SHORT = '11 août 2026';

export const BETA_CAMPAIGN_STATE_DOC = 'beta_campaign/state';

export const ENGAGEMENT_EMAIL_INTERVAL_MS = 2 * 24 * 60 * 60 * 1000;

export function getIosBetaLaunchDate(): Date {
  return new Date(IOS_BETA_LAUNCH_ISO);
}

export function isIosBetaLaunched(now: Date = new Date()): boolean {
  return now.getTime() >= getIosBetaLaunchDate().getTime();
}

export function msUntilIosBetaLaunch(now: Date = new Date()): number {
  return Math.max(0, getIosBetaLaunchDate().getTime() - now.getTime());
}
