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
};

export function PlanDetailCard({
  plan,
  yearly,
  styles,
  variantLabel,
}: PlanDetailCardProps) {
  const premium = isPremiumWebPlan(plan);
  const isFree = plan.monthlyEur <= 0;
  const fullYear = fullAnnualPrice(plan.monthlyEur);
  const savings = annualSavingsFromMonthly(plan.monthlyEur);
  const monthlyFromYearly = monthlyEquivalentFromYearly(plan.yearlyEur);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`overflow-hidden rounded-3xl ${styles.card} ${
        premium ? styles.cardHighlight : ""
      } ${isFree ? "ring-1 ring-emerald-400/35" : ""}`}
    >
      <div className="border-b border-white/10 p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            {isFree && (
              <span className="inline-block rounded-full bg-emerald-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
                Visio · Gratuit
              </span>
            )}
            {variantLabel && (
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                {variantLabel}
              </span>
            )}
            {premium && (
              <span className="ml-2 inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
                Elite
              </span>
            )}
            <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-white">
              {plan.label}
            </h3>
            <p className={`mt-1 text-sm ${styles.textMuted}`}>{plan.tagline}</p>
          </div>
          <div className="text-right">
            {isFree ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Téléconsultation
                </p>
                <p className="mt-1 tabular-nums">
                  <span className="text-4xl font-black text-white">0 €</span>
                  <span className="text-lg text-white/50"> /séance*</span>
                </p>
                <p className={`mt-1 text-sm ${styles.textMuted}`}>
                  15 ou 30 min · sans abonnement
                </p>
              </>
            ) : yearly ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Annuel · −{ANNUAL_DISCOUNT_PERCENT} %
                </p>
                <p className="mt-1 tabular-nums">
                  <span className="text-4xl font-black text-white">
                    {formatPriceEur(plan.yearlyEur)} €
                  </span>
                  <span className="text-lg text-white/50"> /an</span>
                </p>
                <p className={`mt-1 text-sm ${styles.textMuted}`}>
                  soit {formatPriceEur(monthlyFromYearly)} €/mois
                </p>
                <p className="mt-1 text-xs text-emerald-300">
                  −{formatPriceEur(savings)} € vs {formatPriceEur(fullYear)} €
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                  Mensuel
                </p>
                <p className="mt-1 tabular-nums">
                  <span className="text-4xl font-black text-white">
                    {formatPriceEur(plan.monthlyEur)} €
                  </span>
                  <span className="text-lg text-white/50"> /mois</span>
                </p>
              </>
            )}
            {"commissionPercent" in plan && plan.commissionPercent != null && (
              <p className="mt-2 text-xs font-medium text-amber-200">
                + {plan.commissionPercent} % par RDV via l&apos;app
              </p>
            )}
          </div>
        </div>
      </div>

      {"commissionNote" in plan && plan.commissionNote && (
        <div className="border-b border-white/10 bg-white/5 px-6 py-3 sm:px-8">
          <p className="text-center text-sm text-white/70">{plan.commissionNote}</p>
        </div>
      )}

      {isFree ? (
        <div className="p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Inclus
          </p>
          <ul className="mt-4 space-y-2.5">
            {plan.freeIncludes.map((f) => (
              <li key={f} className="flex gap-2 text-sm font-medium text-white">
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-white/45">
            * Gratuit côté ProDay / Daily. L&apos;honoraire du praticien reste
            évent. facturé hors app.
          </p>
        </div>
      ) : (
        <div className="grid gap-0 sm:grid-cols-2">
          <div className="border-b border-white/10 p-6 sm:border-b-0 sm:border-r sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Gratuit
            </p>
            <ul className="mt-4 space-y-2.5">
              {plan.freeIncludes.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-white/75">
                  <Check size={16} className="mt-0.5 shrink-0 text-white/30" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Pro
            </p>
            <ul className="mt-4 space-y-2.5">
              {plan.proIncludes.map((f) => (
                <li key={f} className="flex gap-2 text-sm font-medium text-white">
                  <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="border-t border-white/10 p-6 text-center">
        <p className={`text-sm ${styles.textMuted}`}>
          {isFree
            ? "Rejoignez la bêta santé. Visio incluse dès le compte gratuit."
            : "IAP en cours de déploiement. Accès gratuit pour les inscrits."}
        </p>
        <Link
          href={ROUTES.betaWaitlist}
          className={`mt-4 inline-block rounded-full px-8 py-3 text-sm font-semibold transition hover:scale-[1.02] ${styles.cta}`}
        >
          {isFree ? "Tester la visio gratuite" : "Rejoindre la bêta"}
        </Link>
      </div>
    </motion.article>
  );
}
