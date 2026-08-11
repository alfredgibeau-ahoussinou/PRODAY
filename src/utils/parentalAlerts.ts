import type { ParentalSettings } from '../models/ParentalSettings';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Alertes supervision — partagées Guardian portal + Pôle Parent. */
export function buildParentalAlerts(input: {
  settings: ParentalSettings;
  minutesUsedToday: number;
}): string[] {
  const alerts: string[] = [];
  const { settings, minutesUsedToday } = input;
  const limit = settings.daily_limit_minutes ?? 90;
  const bonus =
    settings.screen_time_bonus_day === todayKey()
      ? settings.screen_time_bonus_minutes ?? 0
      : 0;
  const effectiveLimit = limit + bonus;

  if (settings.unlock_request?.status === 'pending') {
    alerts.push(`Demande de +${settings.unlock_request.minutes} min en attente`);
  }
  if (settings.screen_time_enabled && minutesUsedToday >= effectiveLimit) {
    alerts.push('Limite de temps d’écran atteinte');
  } else if (settings.screen_time_enabled && minutesUsedToday >= effectiveLimit * 0.9) {
    alerts.push('Temps d’écran bientôt épuisé');
  }
  const pendingContacts = (settings.approved_contacts ?? []).filter((c) => !c.approved);
  if (pendingContacts.length > 0) {
    alerts.push(`${pendingContacts.length} contact(s) en attente d’approbation`);
  }
  return alerts;
}
