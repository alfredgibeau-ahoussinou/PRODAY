"use client";

import { motion } from "framer-motion";
import { Briefcase, Check, Star, Users } from "lucide-react";
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
  "star-four-points": Star,
  briefcase: Briefcase,
} as const;

type SponsorPricingSectionProps = {
  compact?: boolean;
  showPillars?: boolean;
  dark?: boolean;
  yearly?: boolean;
  hideToggle?: boolean;
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
  if (tier.monthlyEur === 0) return "Gratuit · 10 messages clubs / mois";
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
  dark = true,
  yearly: yearlyProp,
  hideToggle = false,
}: SponsorPricingSectionProps) {
  const [yearlyLocal, setYearlyLocal] = useState(false);
  const yearly = yearlyProp ?? yearlyLocal;

  return (
    <div className={compact ? "" : "mx-auto max-w-6xl px-4 sm:px-6"}>
      {!compact && (
        <div className="max-w-2xl">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.22em] ${dark ? "text-amber-400/90" : "text-neutral-500"}`}
          >
            Partenaires
          </p>
          <h2
            className={`font-display mt-2 text-3xl font-bold uppercase tracking-tight sm:text-4xl ${dark ? "text-white" : "text-neutral-900"}`}
          >
            {SPONSOR_PRICING_INTRO.title}
          </h2>
          <p className={`mt-4 ${dark ? "text-white/60" : "text-neutral-600"}`}>
            {SPONSOR_PRICING_INTRO.subtitle}
          </p>
          <p className={`mt-2 text-sm ${dark ? "text-white/40" : "text-neutral-500"}`}>
            {SPONSOR_PRICING_INTRO.footnote}
          </p>
        </div>
      )}

      {showPillars && (
        <div className={`grid gap-4 sm:grid-cols-3 ${compact ? "mt-8" : "mt-12"}`}>
          {SPONSOR_VALUE_PILLARS.map((pillar) => {
            const Icon = PILLAR_ICONS[pillar.icon];
            return (
              <div
                key={pillar.title}
                className={
                  dark
                    ? "card-premium rounded-2xl p-5"
                    : "rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5"
                }
              >
                <Icon size={22} className={dark ? "text-amber-400" : "text-blue-800"} />
                <h3 className={`mt-3 font-display font-bold ${dark ? "text-white" : "text-neutral-900"}`}>
                  {pillar.title}
                </h3>
                <p className={`mt-2 text-sm ${dark ? "text-white/55" : "text-neutral-600"}`}>
                  {pillar.body}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!hideToggle && (
      <div className={`flex flex-wrap items-center justify-center gap-4 ${compact ? "mt-8" : "mt-10"}`}>
        <div
          className={`inline-flex rounded-full p-1 ${
            dark ? "border border-white/10 bg-white/5" : "border border-neutral-200 bg-neutral-100"
          }`}
        >
          {(["Mensuel", "Annuel"] as const).map((label, idx) => {
            const isYearly = idx === 1;
            const active = yearly === isYearly;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setYearlyLocal(isYearly)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                  active
                    ? dark
                      ? "bg-white text-neutral-950"
                      : "bg-white shadow-sm"
                    : dark
                      ? "text-white/60"
                      : ""
                }`}
              >
                {label}
                {isYearly ? ` (−${ANNUAL_DISCOUNT_PERCENT} %)` : ""}
              </button>
            );
          })}
        </div>
      </div>
      )}

      <div className={`grid gap-4 lg:grid-cols-3 ${compact ? "mt-0" : "mt-10"}`}>
        {SPONSOR_PRICING_TIERS.map((tier) => {
          const highlighted = tier.highlighted === true;
          const detail = tierPriceDetail(tier, yearly);
          const ctaHref =
            tier.id === "starter"
              ? `${ROUTES.sponsorDevis}?package=starter`
              : `${ROUTES.sponsorDevis}?package=${tier.id}`;

          return (
            <motion.article
              key={tier.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col border p-6 sm:p-7 ${
                highlighted
                  ? "border-[#D4AF37]/45 bg-transparent text-white"
                  : dark
                    ? "border-white/10 bg-transparent text-white"
                    : "rounded-2xl border-neutral-200 bg-white shadow-sm"
              }`}
            >
              {tier.badge ? (
                <span className="mb-3 inline-block w-fit rounded-full bg-[#D4AF37] px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-black">
                  {tier.badge}
                </span>
              ) : null}
              <h3 className="font-display text-xl font-medium tracking-[-0.02em]">
                {tier.name}
              </h3>
              <p
                className={
                  dark ? "mt-1 text-sm text-white/50" : "mt-1 text-neutral-500"
                }
              >
                {tier.tagline}
              </p>
              <p className="mt-6">
                <span className="font-display text-4xl font-medium tracking-[-0.03em] tabular-nums">
                  {tierPrice(tier, yearly)}
                </span>
              </p>
              {detail ? (
                <p
                  className={`mt-2 text-sm ${
                    dark ? "text-white/45" : "text-neutral-500"
                  }`}
                >
                  {detail}
                </p>
              ) : null}
              <ul className="mt-6 flex-1 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm">
                    <Check
                      size={15}
                      className={`mt-0.5 shrink-0 ${
                        highlighted ? "text-[#D4AF37]" : "text-emerald-400"
                      }`}
                    />
                    <span className={dark ? "text-white/75" : ""}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={ctaHref}
                className={`mt-8 inline-flex min-h-11 items-center justify-center rounded-full px-6 py-2.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.16em] transition ${
                  highlighted
                    ? "bg-[#D4AF37] text-black hover:brightness-110"
                    : dark
                      ? "border border-white/15 text-white hover:border-white/30"
                      : "bg-proday-ink text-white hover:bg-neutral-800"
                }`}
              >
                {tier.ctaLabel}
              </Link>
            </motion.article>
          );
        })}
      </div>

      <p
        className={`text-center text-sm ${compact ? "mt-8" : "mt-10"} ${dark ? "text-white/45" : "text-neutral-500"}`}
      >
        Devis Territorial ou sur-mesure :{" "}
        <Link
          href={ROUTES.sponsorDevis}
          className={`font-medium underline ${dark ? "text-white/80" : "text-proday-ink"}`}
        >
          demander un devis en ligne
        </Link>
        {" · "}
        <a
          href={`mailto:${SPONSOR_PARTNER_CONTACT_EMAIL}`}
          className={`font-medium underline ${dark ? "text-white/80" : "text-proday-ink"}`}
        >
          {SPONSOR_PARTNER_CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
