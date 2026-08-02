/** Bêta iOS — 11 août 2026 à 18 h (Europe/Paris, CEST UTC+2). */
export const IOS_BETA_LAUNCH_ISO = "2026-08-11T16:00:00.000Z";

export const IOS_BETA_LAUNCH_LABEL = "11 août 2026 à 18 h";

export const IOS_BETA_LAUNCH_LABEL_SHORT = "11 août 2026";

export function getIosBetaLaunchDate(): Date {
  return new Date(IOS_BETA_LAUNCH_ISO);
}

export function isIosBetaLaunched(now: Date = new Date()): boolean {
  return now.getTime() >= getIosBetaLaunchDate().getTime();
}

export function getTestFlightUrl(): string {
  return process.env.NEXT_PUBLIC_BETA_TESTFLIGHT_URL?.trim() ?? "";
}

/** TestFlight affiché uniquement après la date de lancement et si l'URL est configurée. */
export function isTestFlightAvailable(now: Date = new Date()): boolean {
  return isIosBetaLaunched(now) && Boolean(getTestFlightUrl());
}

export function getIosBetaStatusMessage(now: Date = new Date()): string {
  if (isTestFlightAvailable(now)) {
    return "La bêta iOS est ouverte — installez ProDay via TestFlight.";
  }
  return `La bêta iOS sera disponible à partir du ${IOS_BETA_LAUNCH_LABEL}.`;
}
