"use client";

import { motion } from "framer-motion";
import { Briefcase, Check, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  SPONSOR_PARTNER_CONTACT_EMAIL,
  SPONSOR_PRICING_INTRO,
  SPONSOR_PRICING_TIERS,
  SPONSOR_VALUE_PILLARS,
  type SponsorPricingTierWeb,
} from "@/lib/content";
import {
  ANNUAL_DISCOUNT_PERCENT,
  formatPriceEur,
  monthlyEquivalentFromYearly,
  yearlyPriceFromMonthly,
} from "@/lib/pricing";
import { ROUTES } from "@/lib/routes";

const PILLAR_ICONS = {
  people: Users,
  "star-four-points": Sparkles,
  briefcase: Briefcase,
} as const;

type SponsorPricingSectionProps = {
  compact?: boolean;
  showPillars?: boolean;
};

function tierPrice(tier: SponsorPricingTierWeb, yearly: boolean): string {
  if (tier.monthlyEur === 0) return "0 €";
  if (yearly) {
    const yearlyEur = yearlyPriceFromMonthly(tier.monthlyEur);
    return `${formatPriceEur(yearlyEur)} €/an`;
  }
  return `${formatPriceEur(tier.monthlyEur)} €/mois`;
}

function tierPriceDetail(tier: SponsorPricingTierWeb, yearly: boolean): string | null {
  if (tier.monthlyEur === 0) return "Gratuit, sans engagement";
  if (yearly) {
    const yearlyEur = yearlyPriceFromMonthly(tier.monthlyEur);
    const equiv = monthlyEquivalentFromYearly(yearlyEur);
    return `soit ${formatPriceEur(equiv)} €/mois · −${ANNUAL_DISCOUNT_PERCENT} % vs mensuel`;
  }
  return `ou ${formatPriceEur(yearlyPriceFromMonthly(tier.monthlyEur))} €/an (−${ANNUAL_DISCOUNT_PERCENT} %)`;
}

export function SponsorPricingSection({
  compact,
  showPillars = !compact,
}: SponsorPricingSectionProps) {
  const [yearly, setYearly] = useState(false);

  return (
    <div className={compact ? "" : "mx-auto max-w-6xl px-4 sm:px-6"}>
      {!compact && (
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">
            Partenaires
          </p>
          <h2 className="mt-2 text-3xl font-bold text-neutral-900 sm:text-4xl">
            {SPONSOR_PRICING_INTRO.title}
          </h2>
          <p className="mt-4 text-neutral-600">{SPONSOR_PRICING_INTRO.subtitle}</p>
          <p className="mt-2 text-sm text-neutral-500">{SPONSOR_PRICING_INTRO.footnote}</p>
        </div>
      )}

      {showPillars && (
        <div className={`grid gap-4 sm:grid-cols-3 ${compact ? "mt-8" : "mt-12"}`}>
          {SPONSOR_VALUE_PILLARS.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.icon];
            return (
              <div
                key={pillar.title}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5"
              >
                <Icon size={22} className="text-blue-800" />
                <h3 className="mt-3 font-bold text-neutral-900">{pillar.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{pillar.body}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className={`flex flex-wrap items-center justify-center gap-4 ${compact ? "mt-8" : "mt-10"}`}>
        <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              !yearly ? "bg-white shadow-sm" : ""
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              yearly ? "bg-white shadow-sm" : ""
            }`}
          >
            Annuel (−{ANNUAL_DISCOUNT_PERCENT} %)
          </button>
        </div>
      </div>

      <div className={`mt-10 grid gap-6 lg:grid-cols-3 ${compact ? "" : ""}`}>
        {SPONSOR_PRICING_TIERS.map((tier) => {
          const highlighted = tier.highlighted === true;
          const detail = tierPriceDetail(tier, yearly);
          const ctaHref =
            tier.id === "starter" || tier.id === "national"
              ? `${ROUTES.beta}?role=sponsor`
              : `mailto:${SPONSOR_PARTNER_CONTACT_EMAIL}?subject=Devis%20Territorial%20ProDay`;

          return (
            <motion.article
              key={tier.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col rounded-3xl border p-6 sm:p-8 ${
                highlighted
                  ? "border-blue-900/30 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white shadow-xl ring-2 ring-amber-400/50"
                  : "border-neutral-200 bg-white shadow-sm"
              }`}
            >
              {tier.badge ? (
                <span className="mb-3 inline-block w-fit rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-950">
                  {tier.badge}
                </span>
              ) : null}
              <h3 className="text-xl font-bold">{tier.name}</h3>
              <p className={highlighted ? "mt-1 text-blue-100" : "mt-1 text-neutral-500"}>
                {tier.tagline}
              </p>
              <p className="mt-6">
                <span className="text-4xl font-black tabular-nums">{tierPrice(tier, yearly)}</span>
              </p>
              {detail ? (
                <p className={`mt-2 text-sm ${highlighted ? "text-blue-200/90" : "text-neutral-500"}`}>
                  {detail}
                </p>
              ) : null}
              <ul className="mt-6 flex-1 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <Check
                      size={16}
                      className={`mt-0.5 shrink-0 ${highlighted ? "text-amber-300" : "text-emerald-600"}`}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={ctaHref}
                className={`mt-8 block rounded-full px-6 py-3 text-center text-sm font-semibold transition ${
                  highlighted
                    ? "bg-amber-400 text-slate-950 hover:bg-amber-300"
                    : "bg-proday-ink text-white hover:bg-neutral-800"
                }`}
              >
                {tier.ctaLabel}
              </Link>
            </motion.article>
          );
        })}
      </div>

      <p className={`text-center text-sm text-neutral-500 ${compact ? "mt-8" : "mt-10"}`}>
        Devis Territorial ou sur-mesure :{" "}
        <a
          href={`mailto:${SPONSOR_PARTNER_CONTACT_EMAIL}`}
          className="font-medium text-proday-ink underline"
        >
          {SPONSOR_PARTNER_CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
