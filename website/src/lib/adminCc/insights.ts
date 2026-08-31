/** Insights déterministes (pas de faux LLM) à partir des stats réelles. */

export type AccInsight = {
  id: string;
  problem: string;
  impact: string;
  recommendation: string;
  href: string;
  severity: "info" | "warning" | "critical";
};

export type AccActionItem = {
  id: string;
  label: string;
  count: number;
  href: string;
  tone: "amber" | "red" | "blue" | "teal";
};

export type AccInsightInput = {
  pendingBeta: number;
  pastDue: number;
  reportsOpen: number;
  usersTotal: number;
  usersActive: number;
  proCount: number;
  configFailing: number;
  siteWeek: number;
  siteToday: number;
};

export function buildActionRequired(input: AccInsightInput): AccActionItem[] {
  const items: AccActionItem[] = [];
  if (input.pendingBeta > 0) {
    items.push({
      id: "beta",
      label: "Inscriptions bêta à traiter",
      count: input.pendingBeta,
      href: "/admin/ops/beta",
      tone: "amber",
    });
  }
  if (input.pastDue > 0) {
    items.push({
      id: "past_due",
      label: "Abonnements impayés / past due",
      count: input.pastDue,
      href: "/admin/finances/subscriptions?focus=past_due",
      tone: "red",
    });
  }
  if (input.reportsOpen > 0) {
    items.push({
      id: "reports",
      label: "Signalements ouverts",
      count: input.reportsOpen,
      href: "/admin/security/reports",
      tone: "amber",
    });
  }
  if (input.configFailing > 0) {
    items.push({
      id: "config",
      label: "Intégrations / secrets manquants",
      count: input.configFailing,
      href: "/admin/platform/health",
      tone: "red",
    });
  }
  if (items.length === 0) {
    items.push({
      id: "clear",
      label: "Aucune action bloquante",
      count: 0,
      href: ACC_HOME_SAFE,
      tone: "teal",
    });
  }
  return items;
}

const ACC_HOME_SAFE = "/admin/home";

export function buildInsights(input: AccInsightInput): AccInsight[] {
  const out: AccInsight[] = [];

  if (input.pendingBeta >= 5) {
    out.push({
      id: "beta-backlog",
      problem: `File d’attente bêta élevée (${input.pendingBeta}).`,
      impact: "Friction d’onboarding et délai de confiance fondateurs.",
      recommendation: "Traiter la file ou lancer une campagne d’approbation groupée.",
      href: "/admin/ops/beta",
      severity: input.pendingBeta >= 20 ? "critical" : "warning",
    });
  }

  if (input.pastDue > 0) {
    out.push({
      id: "past-due",
      problem: `${input.pastDue} abonnement(s) en past_due.`,
      impact: "Risque de churn et de CA non encaissé.",
      recommendation: "Ouvrir Finances → Impayés et relancer ou suspendre.",
      href: "/admin/finances/subscriptions?focus=past_due",
      severity: "critical",
    });
  }

  if (input.usersTotal > 0) {
    const activeRatio = input.usersActive / input.usersTotal;
    if (activeRatio < 0.35) {
      out.push({
        id: "low-active",
        problem: `Ratio actifs faible (${Math.round(activeRatio * 100)} %).`,
        impact: "Engagement plateforme sous-utilisé.",
        recommendation: "Analyser les rôles inactifs et relancer via Communication.",
        href: "/admin/users",
        severity: "warning",
      });
    } else {
      out.push({
        id: "healthy-active",
        problem: `${input.usersActive} utilisateurs actifs sur ${input.usersTotal}.`,
        impact: "Base engagée — opportunité d’upsell Pro / Club.",
        recommendation: "Croiser avec Finances et Commercial (devis Tout inclus).",
        href: "/admin/finances",
        severity: "info",
      });
    }
  }

  if (input.proCount > 0 && input.usersTotal > 0) {
    const conversion = input.proCount / input.usersTotal;
    out.push({
      id: "pro-mix",
      problem: `${input.proCount} comptes Pro (${Math.round(conversion * 100)} % de la base).`,
      impact: "Indicateur de monétisation individuelle (hors devis club).",
      recommendation: "Comparer avec le pipeline Commercial clubs.",
      href: "/admin/commercial",
      severity: "info",
    });
  }

  if (input.configFailing > 0) {
    out.push({
      id: "config",
      problem: `${input.configFailing} check(s) config en échec.`,
      impact: "APIs admin / bêta potentiellement dégradées.",
      recommendation: "Corriger les secrets Netlify listés dans Santé système.",
      href: "/admin/platform/health",
      severity: "critical",
    });
  }

  if (input.siteToday === 0 && input.siteWeek > 0) {
    out.push({
      id: "traffic-today",
      problem: "Aucune visite site enregistrée aujourd’hui (UTC).",
      impact: "Peut être normal hors pic, ou tracking en panne.",
      recommendation: "Vérifier /api/analytics/visit et le dashboard Visites.",
      href: "/admin/ops/visites",
      severity: "warning",
    });
  }

  if (out.length === 0) {
    out.push({
      id: "stable",
      problem: "Aucun signal critique sur les flux branchés.",
      impact: "Ops nominale sur bêta, plateforme et config.",
      recommendation: "Poursuivre le pipeline Commercial et le suivi Finances.",
      href: "/admin/commercial",
      severity: "info",
    });
  }

  return out.slice(0, 6);
}

/** Score santé 0–100 à partir des checks config + signaux ops. */
export function computeHealthScore(input: {
  configTotal: number;
  configOk: number;
  pendingBeta: number;
  pastDue: number;
  reportsOpen: number;
}): { score: number; label: string } {
  const configRatio =
    input.configTotal > 0 ? input.configOk / input.configTotal : 0.5;
  let score = Math.round(configRatio * 70);
  if (input.pastDue === 0) score += 10;
  else score += Math.max(0, 10 - input.pastDue * 3);
  if (input.reportsOpen === 0) score += 10;
  else score += Math.max(0, 10 - input.reportsOpen * 2);
  if (input.pendingBeta < 10) score += 10;
  else if (input.pendingBeta < 30) score += 5;
  score = Math.max(0, Math.min(100, score));
  const label =
    score >= 90 ? "Excellent" : score >= 75 ? "Stable" : score >= 55 ? "Attention" : "Critique";
  return { score, label };
}
