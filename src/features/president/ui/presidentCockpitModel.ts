/**
 * Helpers purs cockpit Président — priorités actionnables, snapshot finance (testables).
 */
import type { PresidentNavItemId } from '../navigation/presidentNavConfig';
import type { PresidentHealth } from '../hooks/usePresidentHealth';

export type PresidentCockpitPriority = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string;
  nav: PresidentNavItemId;
  tone: 'ok' | 'warn' | 'alert';
};

export type PresidentFinanceSnapshot = {
  soldeEur: number;
  recettesEur: number;
  depensesEur: number;
  entryCount: number;
  label: string;
  hint: string;
};

export function formatPresidentEur(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: rounded % 1 === 0 ? 0 : 2,
  }).format(rounded);
  return formatted;
}

export function buildPresidentFinanceSnapshot(input: {
  soldeEur: number;
  recettesEur: number;
  depensesEur: number;
  entryCount: number;
}): PresidentFinanceSnapshot {
  const label = formatPresidentEur(input.soldeEur);
  if (input.entryCount === 0) {
    return {
      ...input,
      label,
      hint: 'Aucun mouvement — enregistrez cotisations et dépenses (manuel, pas de SEPA auto).',
    };
  }
  return {
    ...input,
    label,
    hint: `${formatPresidentEur(input.recettesEur)} en recettes · ${formatPresidentEur(input.depensesEur)} en dépenses · ledger cotisations`,
  };
}

/**
 * Priorités directionnelles cliquables (ordre d’urgence).
 * Complète les insights texte sans les remplacer.
 */
export function buildPresidentCockpitPriorities(input: {
  health: PresidentHealth;
  pendingMemberships: number;
  teamsWithoutCoach: number;
  matchesToday: number;
  financeEntryCount: number;
}): PresidentCockpitPriority[] {
  const out: PresidentCockpitPriority[] = [];

  if (input.pendingMemberships > 0) {
    out.push({
      id: 'pending_members',
      title:
        input.pendingMemberships === 1
          ? '1 adhésion à valider'
          : `${input.pendingMemberships} adhésions à valider`,
      body: 'Débloquez l’accès licenciés et les convocations.',
      ctaLabel: 'Adhérents',
      nav: 'members',
      tone: 'alert',
    });
  }

  if (input.teamsWithoutCoach > 0) {
    out.push({
      id: 'without_coach',
      title:
        input.teamsWithoutCoach === 1
          ? '1 équipe sans coach'
          : `${input.teamsWithoutCoach} équipes sans coach`,
      body: 'Affectez le staff pour sécuriser le sportif.',
      ctaLabel: 'Staff',
      nav: 'staff',
      tone: 'warn',
    });
  }

  if (input.matchesToday > 0) {
    out.push({
      id: 'match_today',
      title:
        input.matchesToday === 1
          ? '1 match aujourd’hui'
          : `${input.matchesToday} matchs aujourd’hui`,
      body: 'Suivez résultats, communication et présence.',
      ctaLabel: 'Sportif',
      nav: 'sport',
      tone: 'ok',
    });
  }

  if (input.financeEntryCount === 0) {
    out.push({
      id: 'finance_empty',
      title: 'Finances à initialiser',
      body: 'Enregistrez cotisations et dépenses pour un solde fiable.',
      ctaLabel: 'Finances',
      nav: 'finance',
      tone: 'warn',
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'stable',
      title: 'Structure stable',
      body: input.health.insights[0] ?? 'Surveillez partenaires et objectifs de saison.',
      ctaLabel: 'Partenaires',
      nav: 'sponsors',
      tone: 'ok',
    });
  }

  return out.slice(0, 4);
}

export function presidentOverallStatusLabel(overall: number): string {
  if (overall >= 75) return 'Structure saine';
  if (overall >= 50) return 'Attention requise';
  return 'Priorité direction';
}
