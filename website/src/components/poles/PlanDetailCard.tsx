"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import {
  isPremiumWebPlan,
  type WebSubscriptionPlan,
} from "@/lib/content";
import type { PoleStyle } from "@/lib/poles";
import {
  ANNUAL_DISCOUNT_PERCENT,
  annualSavingsFromMonthly,
  formatPriceEur,
  fullAnnualPrice,
  monthlyEquivalentFromYearly,
} from "@/lib/pricing";
import { ROUTES } from "@/lib/routes";

type PlanDetailCardProps = {
  plan: WebSubscriptionPlan;
  yearly: boolean;
  styles: PoleStyle;
  variantLabel?: string;
  /** Official pole accent hex for Terminal chrome */
  accent?: string;
};

export function PlanDetailCard({
  plan,
  yearly,
  styles,
  variantLabel,
  accent = "#0054F0",
}: PlanDetailCardProps) {
  const premium = isPremiumWebPlan(plan);
  const fullYear = fullAnnualPrice(plan.monthlyEur);
  const savings = annualSavingsFromMonthly(plan.monthlyEur);
  const monthlyFromYearly = monthlyEquivalentFromYearly(plan.yearlyEur);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`flex flex-col border bg-transparent ${
        premium ? "border-[color:var(--plan-accent)]/45" : "border-white/10"
      }`}
      style={{ ["--plan-accent" as string]: accent }}
    >
      <div className="border-b border-white/10 p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {variantLabel ? (
                <span
                  className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em]"
                  style={{
                    backgroundColor: `${accent}22`,
                    color: accent,
                  }}
                >
                  {variantLabel}
                </span>
              ) : null}
              {premium ? (
                <span
                  className="rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-black"
                  style={{ backgroundColor: accent }}
                >
                  Pro
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 font-display text-xl font-medium tracking-[-0.02em] text-white sm:text-2xl">
              {plan.label}
            </h3>
            <p className={`mt-1 text-sm ${styles.textMuted}`}>{plan.tagline}</p>
          </div>

          <div className="text-left sm:text-right">
            {yearly ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Annuel · −{ANNUAL_DISCOUNT_PERCENT}%
                </p>
                <p className="mt-2 tabular-nums">
                  <span className="font-display text-4xl font-medium tracking-[-0.03em] text-white">
                    {formatPriceEur(plan.yearlyEur)} €
                  </span>
                  <span className="text-sm text-white/40"> /an</span>
                </p>
                <p className="mt-1 text-sm text-white/45">
                  soit {formatPriceEur(monthlyFromYearly)} €/mois
                </p>
                <p className="mt-1 text-xs text-emerald-300/90">
                  −{formatPriceEur(savings)} € vs {formatPriceEur(fullYear)} €
                </p>
              </>
            ) : (
              <>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                  Mensuel
                </p>
                <p className="mt-2 tabular-nums">
                  <span className="font-display text-4xl font-medium tracking-[-0.03em] text-white">
                    {formatPriceEur(plan.monthlyEur)} €
                  </span>
                  <span className="text-sm text-white/40"> /mois</span>
                </p>
              </>
            )}
            {"commissionPercent" in plan && plan.commissionPercent != null ? (
              <p className="mt-2 text-xs font-medium text-amber-200/90">
                + {plan.commissionPercent} % par RDV via l&apos;app
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {"commissionNote" in plan && plan.commissionNote ? (
        <div className="border-b border-white/10 px-6 py-3 sm:px-7">
          <p className="text-center text-sm text-white/55">{plan.commissionNote}</p>
        </div>
      ) : null}

      <div className="grid flex-1 gap-0 sm:grid-cols-2">
        <div className="border-b border-white/10 p-6 sm:border-b-0 sm:border-r sm:p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            Gratuit
          </p>
          <ul className="mt-4 space-y-2.5">
            {plan.freeIncludes.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-white/60">
                <Check size={15} className="mt-0.5 shrink-0 text-white/25" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 sm:p-7">
          <p
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            Pro
          </p>
          <ul className="mt-4 space-y-2.5">
            {plan.proIncludes.map((f) => (
              <li key={f} className="flex gap-2 text-sm text-white/85">
                <Check size={15} className="mt-0.5 shrink-0" style={{ color: accent }} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-auto border-t border-white/10 p-6 text-center sm:p-7">
        <p className="text-xs text-white/40">
          Abonnements App Store / Google Play
        </p>
        <Link
          href={ROUTES.betaWaitlist}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full px-7 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:brightness-110"
          style={{ backgroundColor: accent }}
        >
          Liste d&apos;attente
        </Link>
      </div>
    </motion.article>
  );
}
