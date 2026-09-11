/** Bêta iOS : 15 août 2026 à 18 h (Europe/Paris, CEST UTC+2). */
export const IOS_BETA_LAUNCH_ISO = "2026-08-15T16:00:00.000Z";

export const IOS_BETA_LAUNCH_LABEL = "15 août 2026 à 18 h";

export const IOS_BETA_LAUNCH_LABEL_SHORT = "15 août 2026";

/** Date initialement annoncée, avant report. */
export const IOS_BETA_LAUNCH_PREVIOUS_LABEL_SHORT = "11 août 2026";

/** Message public : report de la bêta. */
export const IOS_BETA_DELAY_NOTICE =
  "La bêta a été décalée au 15 août 2026 en raison d'améliorations nécessaires au bon développement de l'application.";

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
    return "La bêta iOS est ouverte. Installez ProDay via TestFlight.";
  }
  if (isIosBetaLaunched(now)) {
    return "La bêta iOS est en cours de déploiement pour les beta-testeurs inscrits via TestFlight.";
  }
  return `${IOS_BETA_DELAY_NOTICE} Ouverture iOS (TestFlight) : ${IOS_BETA_LAUNCH_LABEL}.`;
}
