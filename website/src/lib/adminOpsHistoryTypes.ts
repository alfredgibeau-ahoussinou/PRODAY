/**
 * Entrée d'historique de vérification e-mail — partagée par le store ops
 * (route admin + page RSC) et le module scheduler Netlify (qui réimporte ce
 * contrat sous forme de types dupliqués localement, voir netlify/functions).
 */
export type OpsHistoryEntry = {
  at: string;
  ok: boolean;
  source: "manual" | "scheduled";
  /** Rappel actionnable le cas échéant (ex. reconnexion Gmail). */
  hint?: string;
  /** Message d'erreur brut (jamais de secret). */
  log?: string;
};
