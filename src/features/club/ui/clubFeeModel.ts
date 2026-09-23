/**
 * Cotisations dues / impayés / retards — logique pure, testable sans Firestore.
 *
 * ## Ce qui rend ces chiffres honnêtes
 *
 * Un « impayé » se calcule ici comme `net dû − encaissements rattachés`, et rien d'autre.
 * Deux refus structurent tout le fichier :
 *
 *  1. **Aucun montant dû n'est supposé.** Une échéance qui n'a pas été enregistrée par le
 *     club ne produit pas de ligne : l'absence de données n'est pas un défaut de paiement.
 *  2. **Aucun encaissement n'est rattaché d'office.** Un paiement ne réduit une échéance
 *     que s'il la désigne (`fee_id`). Les encaissements non rattachés sont **comptés à
 *     part** (`unallocatedEur`) au lieu d'être répartis au hasard : les attribuer
 *     silencieusement éteindrait des relances légitimes ou en déclencherait d'injustes.
 */

import { clubFeeNetDueEur, type ClubFee } from '../../../models/ClubFee';
import type { ClubFinanceEntry } from '../../../models/ClubFinanceEntry';
import { formatClubFinanceEntryDate, formatClubFinanceEur } from './clubFinanceModel';
import type { ClubSeasonLabel } from '../../../utils/clubSeason';

/** Fenêtre pendant laquelle une échéance à venir est signalée comme proche. */
export const CLUB_FEE_DUE_SOON_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ClubFeeAging = 'settled' | 'upcoming' | 'due_soon' | 'overdue';

export const CLUB_FEE_AGING_LABELS: Record<ClubFeeAging, string> = {
  settled: 'Réglée',
  upcoming: 'À échoir',
  due_soon: 'Échéance proche',
  overdue: 'En retard',
};

export type ClubFeeRow = {
  feeId: string;
  label: string;
  memberName: string;
  memberUid: string | null;
  category: string;
  season: ClubSeasonLabel;
  dueDate: Date;
  dueDateLabel: string;
  netDueEur: number;
  paidEur: number;
  outstandingEur: number;
  aging: ClubFeeAging;
  agingLabel: string;
  hint: string;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Fin de la journée d'échéance — une échéance du 30 n'est pas en retard le 30. */
function endOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

export function isActiveClubFinanceEntry(e: ClubFinanceEntry): boolean {
  return e.status === 'active' && !e.deleted_at;
}

/** Encaissements rattachés à une échéance précise. */
export function clubFeePaidEur(feeId: string, entries: ClubFinanceEntry[]): number {
  return round2(
    entries
      .filter((e) => isActiveClubFinanceEntry(e) && e.fee_id === feeId)
      .reduce((sum, e) => sum + e.amount_eur, 0),
  );
}

/**
 * Statut d'une échéance. L'ordre des tests compte : une échéance soldée reste « Réglée »
 * même passée — signaler « en retard » une cotisation payée la veille de l'échéance serait
 * un faux positif.
 */
export function clubFeeAging(
  fee: Pick<ClubFee, 'amount_due_eur' | 'discount_eur' | 'due_date'>,
  paidEur: number,
  now: Date = new Date(),
): ClubFeeAging {
  const netDue = clubFeeNetDueEur(fee);
  if (paidEur >= netDue) return 'settled';
  const deadline = endOfDay(fee.due_date);
  if (now.getTime() > deadline) return 'overdue';
  if (now.getTime() >= deadline - CLUB_FEE_DUE_SOON_DAYS * MS_PER_DAY) return 'due_soon';
  return 'upcoming';
}

/**
 * Échéances d'une saison, avec leur solde réel.
 *
 * `season` filtre sur la saison enregistrée de l'échéance, jamais sur la date d'un
 * encaissement : une cotisation 2026-2027 réglée par anticipation en juillet doit rester
 * rattachée à 2026-2027.
 */
export function buildClubFeeRows(input: {
  fees: ClubFee[];
  entries: ClubFinanceEntry[];
  season?: ClubSeasonLabel | null;
  now?: Date;
}): ClubFeeRow[] {
  const now = input.now ?? new Date();
  const active = input.fees.filter(
    (f) => f.status === 'active' && !f.deleted_at && (!input.season || f.season === input.season),
  );

  const rows = active.map((fee) => {
    const netDueEur = clubFeeNetDueEur(fee);
    const paidEur = clubFeePaidEur(fee.id, input.entries);
    const outstandingEur = round2(Math.max(0, netDueEur - paidEur));
    const aging = clubFeeAging(fee, paidEur, now);
    const memberName = fee.member_name?.trim() || 'Adhérent non nommé';

    const hintParts = [
      `Net dû ${formatClubFinanceEur(netDueEur)}`,
      `échéance ${formatClubFinanceEntryDate(fee.due_date)}`,
    ];
    if (paidEur > 0) hintParts.push(`encaissé ${formatClubFinanceEur(paidEur)}`);
    if (outstandingEur > 0) hintParts.push(`reste ${formatClubFinanceEur(outstandingEur)}`);
    if (fee.discount_eur > 0) hintParts.push(`remise ${formatClubFinanceEur(fee.discount_eur)}`);

    return {
      feeId: fee.id,
      label: fee.label.trim() || memberName,
      memberName,
      memberUid: fee.member_uid ?? null,
      category: fee.category,
      season: fee.season,
      dueDate: fee.due_date,
      dueDateLabel: formatClubFinanceEntryDate(fee.due_date),
      netDueEur,
      paidEur,
      outstandingEur,
      aging,
      agingLabel: CLUB_FEE_AGING_LABELS[aging],
      hint: hintParts.join(' · '),
    } satisfies ClubFeeRow;
  });

  return rows.sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
}

export type ClubFeeSummary = {
  feesCount: number;
  netDueEur: number;
  paidEur: number;
  outstandingEur: number;
  overdueCount: number;
  overdueEur: number;
  dueSoonCount: number;
  settledCount: number;
  /** Encaissements « cotisation » du ledger qui ne désignent aucune échéance. */
  unallocatedCount: number;
  unallocatedEur: number;
};

/**
 * Synthèse. Deux totaux sont volontairement **séparés** : le reste dû sur échéances
 * enregistrées, et l'argent encaissé non rattaché. Les additionner reviendrait à choisir
 * arbitrairement quels adhérents sont à jour.
 */
export function summarizeClubFees(
  rows: ClubFeeRow[],
  entries: ClubFinanceEntry[],
): ClubFeeSummary {
  const active = rows.reduce(
    (acc, row) => {
      acc.netDueEur += row.netDueEur;
      acc.paidEur += row.paidEur;
      acc.outstandingEur += row.outstandingEur;
      if (row.aging === 'overdue') {
        acc.overdueCount += 1;
        acc.overdueEur += row.outstandingEur;
      }
      if (row.aging === 'due_soon') acc.dueSoonCount += 1;
      if (row.aging === 'settled') acc.settledCount += 1;
      return acc;
    },
    {
      netDueEur: 0,
      paidEur: 0,
      outstandingEur: 0,
      overdueCount: 0,
      overdueEur: 0,
      dueSoonCount: 0,
      settledCount: 0,
    },
  );

  const unallocated = entries.filter(
    (e) => isActiveClubFinanceEntry(e) && e.type === 'cotisation' && !e.fee_id,
  );

  return {
    feesCount: rows.length,
    netDueEur: round2(active.netDueEur),
    paidEur: round2(active.paidEur),
    outstandingEur: round2(active.outstandingEur),
    overdueCount: active.overdueCount,
    overdueEur: round2(active.overdueEur),
    dueSoonCount: active.dueSoonCount,
    settledCount: active.settledCount,
    unallocatedCount: unallocated.length,
    unallocatedEur: round2(unallocated.reduce((s, e) => s + e.amount_eur, 0)),
  };
}

/** Libellé de synthèse, ou l'énoncé explicite de l'absence d'échéance. */
export function resolveClubFeeSummaryLabel(summary: ClubFeeSummary): string {
  if (summary.feesCount === 0) {
    return 'Aucune échéance enregistrée pour cette saison : aucun impayé n’est calculable.';
  }
  const parts = [`${summary.feesCount} échéance${summary.feesCount > 1 ? 's' : ''}`];
  parts.push(`reste ${formatClubFinanceEur(summary.outstandingEur)}`);
  if (summary.overdueCount > 0) {
    parts.push(`${summary.overdueCount} en retard · ${formatClubFinanceEur(summary.overdueEur)}`);
  }
  return parts.join(' · ');
}

/**
 * Définition affichée à l'utilisateur. Un « en retard » sans définition écrite est un
 * chiffre que personne ne peut contester ni vérifier.
 */
export function clubFeeOutstandingDefinition(): string {
  return `« En retard » = la date d’échéance enregistrée est dépassée et le total rattaché à cette échéance est inférieur au net dû. Une échéance sans date est impossible : le montant dû et l’échéance sont saisis ensemble.`;
}

/**
 * Traduction d'une erreur d'écriture Finances en énoncé exploitable.
 *
 * Un « Missing or insufficient permissions. » brut n'apprend rien : on ne sait pas si la
 * donnée est invalide, la session expirée, ou les règles non déployées. Chaque cas est
 * distingué, et dans **tous** les cas la phrase dit qu'aucune donnée n'a été enregistrée.
 */
export function humanizeClubFinanceWriteError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? '');
  const msg = raw.toLowerCase();

  if (msg.includes('insufficient permissions') || msg.includes('permission-denied')) {
    return 'Le service a refusé l’opération : les règles Firestore du module financier ne sont pas encore déployées sur ce projet. Aucune donnée n’a été enregistrée. Un administrateur doit les publier (firebase deploy --only firestore:rules), puis réessayez.';
  }
  if (msg.includes('unavailable') || msg.includes('network') || msg.includes('offline')) {
    return 'Réseau indisponible : rien n’a été enregistré. Vérifiez la connexion puis réessayez.';
  }
  if (msg.includes('unauthenticated') || msg.includes('auth') || msg.includes('token')) {
    return 'Session expirée : rien n’a été enregistré. Reconnectez-vous puis réessayez.';
  }
  if (msg.includes('deadline') || msg.includes('timeout')) {
    return 'Le service n’a pas répondu à temps : rien n’a été enregistré. Réessayez.';
  }
  return raw || 'Opération impossible : rien n’a été enregistré.';
}

/**
 * Ce qu'implique l'argent non rattaché. Dit à l'écran parce que c'est la seule limite
 * restante du calcul, et qu'elle vient de la donnée, pas du calcul.
 */
export function clubFeeUnallocatedNote(summary: ClubFeeSummary): string {
  if (summary.unallocatedCount === 0) {
    return 'Tous les encaissements de cotisation du ledger sont rattachés à une échéance.';
  }
  return `${summary.unallocatedCount} encaissement${summary.unallocatedCount > 1 ? 's' : ''} de cotisation (${formatClubFinanceEur(summary.unallocatedEur)}) n’est rattaché à aucune échéance : ces montants ne réduisent aucun reste dû. Ouvrez l’écriture pour la rattacher.`;
}
