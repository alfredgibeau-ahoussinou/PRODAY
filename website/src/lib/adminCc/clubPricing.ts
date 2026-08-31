/**
 * Moteur de tarification Club (devis Admin).
 * Aligné sur le catalogue vitrine : Tout inclus à partir de 3 € / adhérent.
 */

export const CLUB_BASE_EUR_PER_MEMBER = 3;

export type ClubQuoteOptionId =
  | "video_byo"
  | "video_veo_pack"
  | "ai_premium"
  | "multi_site"
  | "priority_support";

export type ClubQuoteOption = {
  id: ClubQuoteOptionId;
  label: string;
  /** Supplément mensuel fixe (€) ou multiplicateur adhérent */
  kind: "fixed_monthly" | "per_member";
  amountEur: number;
  description: string;
};

export const CLUB_QUOTE_OPTIONS: ClubQuoteOption[] = [
  {
    id: "video_byo",
    label: "Vidéo (matériel club)",
    kind: "fixed_monthly",
    amountEur: 0,
    description: "Inclus dans Tout inclus — pas de surcoût structure.",
  },
  {
    id: "video_veo_pack",
    label: "Pack ProDay Pro + Veo",
    kind: "fixed_monthly",
    amountEur: 149,
    description: "Caméra / installation / cloud — montant indicatif admin, ajustable.",
  },
  {
    id: "ai_premium",
    label: "IA premium club",
    kind: "per_member",
    amountEur: 0.4,
    description: "Agents & automatisations avancées.",
  },
  {
    id: "multi_site",
    label: "Multi sites",
    kind: "fixed_monthly",
    amountEur: 39,
    description: "Structures secondaires / antennes.",
  },
  {
    id: "priority_support",
    label: "Support prioritaire",
    kind: "fixed_monthly",
    amountEur: 29,
    description: "SLA fondateurs + canal dédié.",
  },
];

/** Remise volume adhérents (mensuel / adhérent). */
export function volumeRateEurPerMember(members: number): number {
  const n = Math.max(0, Math.floor(members));
  if (n >= 400) return 2.4;
  if (n >= 250) return 2.6;
  if (n >= 150) return 2.75;
  if (n >= 80) return 2.9;
  return CLUB_BASE_EUR_PER_MEMBER;
}

export type ClubQuoteInput = {
  members: number;
  optionIds: ClubQuoteOptionId[];
  /** Override manuel du taux / adhérent (€) */
  customRateEur?: number | null;
  /** Remise commerciale % */
  discountPercent?: number;
  billing: "monthly" | "annual";
};

export type ClubQuoteResult = {
  members: number;
  ratePerMember: number;
  membersSubtotal: number;
  optionsSubtotal: number;
  grossMonthly: number;
  discountPercent: number;
  netMonthly: number;
  annualGross: number;
  annualNet: number;
  annualSavings: number;
  lineItems: { label: string; amountEur: number }[];
};

const ANNUAL_DISCOUNT = 0.2;

export function computeClubQuote(input: ClubQuoteInput): ClubQuoteResult {
  const members = Math.max(0, Math.floor(input.members || 0));
  const rate =
    typeof input.customRateEur === "number" && input.customRateEur > 0
      ? input.customRateEur
      : volumeRateEurPerMember(members);

  const membersSubtotal = Math.round(members * rate * 100) / 100;
  const lineItems: { label: string; amountEur: number }[] = [
    {
      label: `${members} adhérents × ${rate.toFixed(2).replace(".", ",")} €`,
      amountEur: membersSubtotal,
    },
  ];

  let optionsSubtotal = 0;
  for (const id of input.optionIds) {
    const opt = CLUB_QUOTE_OPTIONS.find((o) => o.id === id);
    if (!opt || opt.amountEur <= 0) continue;
    const amount =
      opt.kind === "per_member"
        ? Math.round(members * opt.amountEur * 100) / 100
        : opt.amountEur;
    optionsSubtotal += amount;
    lineItems.push({ label: opt.label, amountEur: amount });
  }

  const grossMonthly = Math.round((membersSubtotal + optionsSubtotal) * 100) / 100;
  const discountPercent = Math.min(40, Math.max(0, input.discountPercent ?? 0));
  const netMonthly =
    Math.round(grossMonthly * (1 - discountPercent / 100) * 100) / 100;

  const annualGross = Math.round(grossMonthly * 12 * 100) / 100;
  const annualNet =
    Math.round(netMonthly * 12 * (1 - ANNUAL_DISCOUNT) * 100) / 100;
  const annualSavings = Math.round((netMonthly * 12 - annualNet) * 100) / 100;

  return {
    members,
    ratePerMember: rate,
    membersSubtotal,
    optionsSubtotal,
    grossMonthly,
    discountPercent,
    netMonthly,
    annualGross,
    annualNet,
    annualSavings,
    lineItems,
  };
}

export function formatEur(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}
