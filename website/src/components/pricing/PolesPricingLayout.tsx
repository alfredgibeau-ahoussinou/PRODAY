"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Fragment } from "react";
import { getPoleBrandColors } from "@/lib/brandColors";
import {
  NO_COMMITMENT_BADGE,
  NO_COMMITMENT_FREE_LINE,
  NO_COMMITMENT_INTRO,
  NO_COMMITMENT_OFFER_LINE,
  NO_COMMITMENT_QUOTE_LINE,
  POLE_REFERRAL_LINE,
} from "@/lib/commercialCopy";
import { SPONSOR_PRICING_TIERS } from "@/lib/content";
import {
  SHOWCASE_POLES,
  plansForPole,
  resolvePricingPoleFromHash,
  type PoleId,
  type PoleDefinition,
} from "@/lib/poles";
import {
  ANNUAL_DISCOUNT_PERCENT,
  formatPriceEur,
  monthlyEquivalentFromYearly,
  yearlyPriceFromMonthly,
} from "@/lib/pricing";
import { ROUTES } from "@/lib/routes";
import { PricingPoleAccent } from "@/components/pricing/PricingPoleAccent";
import { VeoCameraMark } from "@/components/poles/VeoCameraMark";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

function brandKeyForPole(poleId: PoleId): string {
  if (poleId === "amateur" || poleId === "pro_joueur") return "joueur";
  if (poleId === "pro_staff") return "coach";
  if (poleId === "evenements") return "pro_club";
  return poleId;
}

function leadPriceLabel(poleId: PoleId, yearly: boolean): { amount: string; unit: string; note: string } {
  if (poleId === "supporter" || poleId === "parent") {
    return {
      amount: "0",
      unit: "€",
      note: NO_COMMITMENT_FREE_LINE,
    };
  }
  if (poleId === "sponsor") {
    const paid = SPONSOR_PRICING_TIERS.find((t) => t.monthlyEur > 0);
    const starter = SPONSOR_PRICING_TIERS[0];
    if (!paid || !starter) return { amount: "0", unit: "€", note: NO_COMMITMENT_QUOTE_LINE };
    return {
      amount: yearly
        ? formatPriceEur(yearlyPriceFromMonthly(paid.monthlyEur))
        : formatPriceEur(paid.monthlyEur),
      unit: yearly ? "€ / an" : "€ / mois",
      note: `Dès ${starter.name} gratuit · 3 formules · ${NO_COMMITMENT_BADGE.toLowerCase()}`,
    };
  }
  const plans = plansForPole(poleId);
  const plan = plans[0];
  if (!plan) return { amount: "…", unit: "", note: "" };
  return {
    amount: yearly ? formatPriceEur(plan.yearlyEur) : formatPriceEur(plan.monthlyEur),
    unit: yearly ? "€ / an" : "€ / mois",
    note: yearly
      ? `soit ${formatPriceEur(monthlyEquivalentFromYearly(plan.yearlyEur))} €/mois · ${NO_COMMITMENT_BADGE.toLowerCase()}`
      : plans.length > 1
        ? `${plans.length} formules · ${NO_COMMITMENT_BADGE.toLowerCase()}`
        : `ou ${formatPriceEur(plan.yearlyEur)} €/an (−${ANNUAL_DISCOUNT_PERCENT} %) · ${NO_COMMITMENT_BADGE.toLowerCase()}`,
  };
}

export function PolesPricingLayout() {
  const [yearly, setYearly] = useState(false);
  const [activePole, setActivePole] = useState<PoleId>(() => {
    if (typeof window === "undefined") return SHOWCASE_POLES[0]!.id;
    const fromHash = resolvePricingPoleFromHash(window.location.hash);
    if (fromHash && SHOWCASE_POLES.some((p) => p.id === fromHash)) {
      return fromHash;
    }
    return SHOWCASE_POLES[0]!.id;
  });

  useEffect(() => {
    const fromHash = resolvePricingPoleFromHash(window.location.hash);
    if (fromHash && SHOWCASE_POLES.some((p) => p.id === fromHash)) {
      const el = document.getElementById(fromHash);
      if (el) {
        window.setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
      }
    }
  }, []);

  return (
    <div className="bg-black text-white">
      {/* Sticky controls */}
      <div className="sticky top-[4.1rem] z-30 border-b border-white/10 bg-black/70 backdrop-blur-xl sm:top-16">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">
                {yearly
                  ? `Annuel · −${ANNUAL_DISCOUNT_PERCENT} % · ${NO_COMMITMENT_BADGE.toLowerCase()}`
                  : `Mensuel · ${NO_COMMITMENT_BADGE.toLowerCase()}`}
              </p>
              <p className="mt-1 text-xs text-white/45 sm:text-sm">
                {NO_COMMITMENT_INTRO} Sponsoring possible ·{" "}
                <Link
                  href={ROUTES.sponsor}
                  className="text-white/70 underline-offset-2 hover:text-white hover:underline"
                >
                  voir le pôle Sponsor
                </Link>
                . {POLE_REFERRAL_LINE}
              </p>
            </div>
            <div className="inline-flex rounded-full border border-white/15 p-1">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
                  !yearly ? "bg-white text-black" : "text-white/55 hover:text-white"
                }`}
              >
                Mensuel
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
                  yearly ? "bg-white text-black" : "text-white/55 hover:text-white"
                }`}
              >
                Annuel −{ANNUAL_DISCOUNT_PERCENT}%
              </button>
            </div>
          </div>

          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Pôles"
          >
            {SHOWCASE_POLES.map((pole) => {
              const on = pole.id === activePole;
              const brand = getPoleBrandColors(brandKeyForPole(pole.id));
              return (
                <button
                  key={pole.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => {
                    setActivePole(pole.id);
                    const el = document.getElementById(pole.id);
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    window.history.replaceState(null, "", `#${pole.id}`);
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    on ? "text-black" : "border border-white/15 text-white/65 hover:border-white/30"
                  }`}
                  style={on ? { backgroundColor: brand.accent } : undefined}
                >
                  {pole.navLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {SHOWCASE_POLES.map((pole, index) => (
        <PolePricingChapter
          key={pole.id}
          pole={pole}
          index={index}
          yearly={yearly}
          highlighted={pole.id === activePole}
          onFocus={() => setActivePole(pole.id)}
        />
      ))}
    </div>
  );
}

function PolePricingChapter({
  pole,
  index,
  yearly,
  highlighted,
  onFocus,
}: {
  pole: PoleDefinition;
  index: number;
  yearly: boolean;
  highlighted: boolean;
  onFocus: () => void;
}) {
  const reduce = useReducedMotion();
  const brand = getPoleBrandColors(brandKeyForPole(pole.id));
  const plans = plansForPole(pole.id);
  const lead = leadPriceLabel(pole.id, yearly);
  const num = String(index + 1).padStart(2, "0");

  return (
    <section
      id={pole.id}
      onMouseEnter={onFocus}
      className="scroll-mt-36 border-b border-white/10"
      style={
        {
          ["--pole-accent" as string]: brand.accent,
          ["--pole-accent-soft" as string]: brand.soft,
        } as React.CSSProperties
      }
    >
      <div
        className={`relative mx-auto max-w-6xl px-4 py-16 transition sm:px-6 sm:py-24 ${
          highlighted ? "opacity-100" : "opacity-90"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-40"
          style={{
            background: `radial-gradient(ellipse 50% 40% at 0% 0%, ${brand.soft}, transparent 70%)`,
          }}
        />

        <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--pole-accent)]">
              {num} · {pole.kicker}
            </p>
            <h2 className="mt-4 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-[1.0] tracking-[-0.04em] text-white">
              {pole.navLabel}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55 sm:text-base">
              {pole.description}
            </p>

            <div className="mt-8 lg:hidden">
              <PricingPoleAccent poleId={pole.id} />
            </div>

            <div className="mt-10">
              <p className="font-display text-[clamp(3.5rem,12vw,6rem)] font-medium leading-[0.88] tracking-[-0.06em] text-white">
                {lead.amount}
                <span className="ml-2 align-baseline text-[clamp(1rem,2vw,1.4rem)] tracking-[-0.02em] text-white/35">
                  {lead.unit}
                </span>
              </p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                {lead.note}
              </p>
              <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/45">
                {pole.id === "sponsor" || pole.id === "pro_club"
                  ? NO_COMMITMENT_QUOTE_LINE
                  : pole.id === "supporter" || pole.id === "parent"
                    ? POLE_REFERRAL_LINE
                    : NO_COMMITMENT_OFFER_LINE}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={
                  pole.id === "sponsor" || pole.id === "pro_club"
                    ? pole.id === "sponsor"
                      ? ROUTES.sponsorDevis
                      : ROUTES.clubDevis
                    : ROUTES.betaWaitlist
                }
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
                style={{ backgroundColor: brand.accent }}
              >
                {pole.id === "sponsor" || pole.id === "pro_club"
                  ? "Demander un devis"
                  : "Liste d’attente"}
                <ArrowRight size={14} />
              </Link>
              <Link
                href={pole.href}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/50"
              >
                Voir le pôle
              </Link>
            </div>
          </div>

          <div className="border-t border-white/10 pt-10 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
            <div className="mb-8 hidden lg:block">
              <PricingPoleAccent poleId={pole.id} />
            </div>

            {pole.id === "supporter" || pole.id === "parent" ? (
              <InclusionList
                title={pole.id === "parent" ? "Tout inclus · 0 €" : "Tout inclus · 0 €"}
                items={
                  pole.id === "parent"
                    ? [
                        "Supervision du compte enfant",
                        "Messages et approbation contacts",
                        "Agenda et alertes retard coach",
                        "Temps d’écran et contrôles",
                        "Trajet live (si activé)",
                      ]
                    : [
                        "Matchs et scores live",
                        "Suivis illimités",
                        "Débats et réels",
                        "Shop communauté",
                        "Sans paywall store",
                      ]
                }
              />
            ) : pole.id === "sponsor" ? (
              <SponsorTierCards yearly={yearly} />
            ) : pole.id === "pro_club" ? (
              <ClubPlansCompare yearly={yearly} plans={plans} />
            ) : plans[0] ? (
              <FreeVsPro
                free={plans[0].freeIncludes}
                pro={plans[0].proIncludes}
                proLabel={plans[0].label}
                reduce={!!reduce}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function InclusionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--pole-accent)]">
        {title}
      </p>
      <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
        {items.map((item) => (
          <li key={item} className="flex gap-3 py-3.5 text-sm text-white/70">
            <Check size={16} className="mt-0.5 shrink-0 text-[var(--pole-accent)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FreeVsPro({
  free,
  pro,
  proLabel,
  reduce,
}: {
  free: readonly string[];
  pro: readonly string[];
  proLabel: string;
  reduce: boolean;
}) {
  const [tier, setTier] = useState<"free" | "pro">("pro");
  const items = tier === "free" ? free : pro;

  return (
    <div>
      <div className="inline-flex rounded-full border border-white/15 p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tier === "free"}
          onClick={() => setTier("free")}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            tier === "free" ? "bg-white text-black" : "text-white/55"
          }`}
        >
          Gratuit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tier === "pro"}
          onClick={() => setTier("pro")}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            tier === "pro" ? "text-black" : "text-white/55"
          }`}
          style={tier === "pro" ? { backgroundColor: "var(--pole-accent)" } : undefined}
        >
          {proLabel}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-white/45">
        {tier === "free" ? NO_COMMITMENT_FREE_LINE : NO_COMMITMENT_OFFER_LINE}
      </p>
      <AnimatePresence mode="wait">
        <motion.ul
          key={tier}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.25, ease }}
          className="mt-4 divide-y divide-white/10 border-y border-white/10"
          role="tabpanel"
        >
          {items.map((item) => (
            <li key={item} className="flex gap-3 py-3.5 text-sm text-white/70">
              <Check size={16} className="mt-0.5 shrink-0 text-[var(--pole-accent)]" />
              {item}
            </li>
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}

type WebPlan = ReturnType<typeof plansForPole>[number];

function ClubPlansCompare({
  yearly,
  plans,
}: {
  yearly: boolean;
  plans: WebPlan[];
}) {
  const order = [
    "club_amateur",
    "club_pro",
    "club_premium",
    "club_video_pro",
  ] as const;
  const sorted = order
    .map((id) => plans.find((p) => p.id === id))
    .filter((p): p is WebPlan => p != null);

  type Cell = boolean | string;
  const rows: { feature: string; group?: string; cells: Cell[] }[] = [
    {
      group: "Gestion",
      feature: "Licenciés, convocations, calendrier",
      cells: [true, true, true, true],
    },
    { feature: "Covoiturage", cells: [true, true, true, true] },
    { feature: "Résultats & classements", cells: [true, true, true, true] },
    {
      group: "Avancé",
      feature: "Compétitions & admin",
      cells: [false, true, true, true],
    },
    {
      feature: "Analyse de forme",
      cells: [true, true, true, true],
    },
    {
      feature: "Tactique IA / IA / vidéo (votre matériel)",
      cells: [false, "Coach abo.", true, true],
    },
    {
      feature: "Pack caméra clé en main",
      cells: [false, false, false, true],
    },
    {
      feature: "Coachs inclus (0 €)",
      cells: [false, false, true, true],
    },
    {
      feature: "Pass joueur optionnel",
      cells: ["3,99 €", "3,99 €", "3,99 €", "3,99 €"],
    },
  ];

  function priceLabel(p: WebPlan): string {
    if ("quoteOnly" in p && p.quoteOnly) {
      return "Sur devis · À partir de 3 € / adhérent";
    }
    if (yearly) return `${formatPriceEur(p.yearlyEur)} €/an`;
    return `${formatPriceEur(p.monthlyEur)} €`;
  }

  function shortLabel(p: WebPlan): ReactNode {
    if (p.id === "club_video_pro") {
      return (
        <span className="inline-flex flex-col items-center gap-1">
          <VeoCameraMark size="md" caption={false} className="mx-auto" />
          <span>
            Pro + <span className="sr-only">Veo</span>
          </span>
        </span>
      );
    }
    return p.label.replace("Club ", "").replace("ProDay ", "");
  }

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--pole-accent)]">
        Comparatif Club · 4 formules
      </p>
      <p className="mt-2 text-xs text-white/45">
        Premium inclut la vidéo avec votre matériel. Pro + Veo = option clé en main.{" "}
        {NO_COMMITMENT_QUOTE_LINE}
      </p>
      <div className="mt-5 overflow-x-auto rounded-sm border border-white/10">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 bg-black/40">
              <th className="px-3 py-3 text-xs text-white/40">Offre</th>
              {sorted.map((p) => (
                <th key={p.id} className="px-2 py-3 text-center sm:px-3">
                  <span className="block text-xs font-semibold text-white sm:text-sm">
                    {shortLabel(p)}
                  </span>
                  <span className="mt-1 block font-display text-sm text-[var(--pole-accent)] sm:text-base">
                    {priceLabel(p)}
                  </span>
                  <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
                    {NO_COMMITMENT_BADGE}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Fragment key={`${row.group ?? ""}-${row.feature}`}>
                {row.group ? (
                  <tr className="border-t border-white/10 bg-white/[0.03]">
                    <td
                      colSpan={5}
                      className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--pole-accent)]"
                    >
                      {row.group}
                    </td>
                  </tr>
                ) : null}
                <tr className="border-t border-white/[0.06]">
                  <th scope="row" className="px-3 py-2.5 text-left text-xs font-medium text-white/75">
                    {row.feature}
                  </th>
                  {row.cells.map((cell, i) => (
                    <td key={i} className="px-2 py-2.5 text-center text-xs text-white/70 sm:px-3">
                      {cell === true ? (
                        <Check size={16} className="mx-auto text-[var(--pole-accent)]" />
                      ) : cell === false ? (
                        <span className="text-white/25">…</span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <Link
        href={`${ROUTES.proClub}#video`}
        className="mt-4 inline-flex text-xs font-semibold text-[var(--pole-accent)] hover:opacity-80"
      >
        Détail module vidéo →
      </Link>
    </div>
  );
}

function SponsorTierCards({ yearly }: { yearly: boolean }) {
  return (
    <div className="space-y-6">
      {SPONSOR_PRICING_TIERS.map((tier) => {
        const price =
          tier.monthlyEur === 0
            ? "Gratuit"
            : yearly
              ? `${formatPriceEur(yearlyPriceFromMonthly(tier.monthlyEur))} €/an`
              : `${formatPriceEur(tier.monthlyEur)} €/mois`;
        return (
          <div
            key={tier.id}
            className={`border-b border-white/10 pb-6 last:border-0 ${
              "highlighted" in tier && tier.highlighted
                ? "rounded-sm bg-[var(--pole-accent)]/10 px-4 pt-4"
                : ""
            }`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--pole-accent)]">
                {tier.name}
              </p>
              <div className="text-right">
                <p className="font-display text-xl font-medium text-white">{price}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
                  {NO_COMMITMENT_BADGE}
                </p>
              </div>
            </div>
            <p className="mt-1 text-sm text-white/45">{tier.tagline}</p>
            <ul className="mt-3 space-y-1.5">
              {tier.features.slice(0, 3).map((f) => (
                <li key={f} className="flex gap-2 text-xs text-white/65">
                  <Check size={14} className="mt-0.5 shrink-0 text-[var(--pole-accent)]" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <Link
        href={ROUTES.sponsorDevis}
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--pole-accent)]"
      >
        Comparer & demander un devis
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
