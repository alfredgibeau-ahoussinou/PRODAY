"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PulseSimulator } from "@/components/PulseSimulator";
import { VerificationTimeline } from "@/components/VerificationTimeline";
import { UniverseModuleExplorer } from "@/components/universe/UniverseModuleExplorer";
import { UNIVERSE_THEME } from "@/components/universe/universeTheme";
import {
  JOURNEYS,
  PRODUCT_LINES,
  UNIVERSE_PAGE_CONFIG,
  getWebPlanById,
  type UniversePageId,
} from "@/lib/content";
import { formatPriceEur } from "@/lib/pricing";
import { ROUTES } from "@/lib/routes";

type UniversePageProps = {
  universe: UniversePageId;
};

export function UniversePage({ universe }: UniversePageProps) {
  const config = UNIVERSE_PAGE_CONFIG[universe];
  const theme = UNIVERSE_THEME[universe];
  const journeys = useMemo(
    () =>
      JOURNEYS.filter((j) =>
        (config.journeyIds as readonly string[]).includes(j.id),
      ),
    [config.journeyIds],
  );
  const [activeJourney, setActiveJourney] = useState(0);
  const journey = journeys[activeJourney] ?? journeys[0];
  const pricingPlans = config.pricingPlanIds
    .map((id) => getWebPlanById(id))
    .filter((p): p is NonNullable<typeof p> => p != null);
  const otherUniverses = PRODUCT_LINES.filter((l) => l.id !== universe);

  return (
    <>
      <PageHeader
        kicker={config.brand.tagline}
        title={config.hero.title}
        description={config.brand.mission}
        image={config.hero.image}
        logo={config.brand.logo}
        logoAlt={config.brand.fullName}
        accent={theme.pageHeaderAccent}
      />

      <section className="border-b border-neutral-200 bg-white py-10">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {config.highlights.map((h) => (
            <div
              key={h.label}
              className={`rounded-2xl border p-5 ${theme.highlightBorder}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wider ${theme.highlightLabel}`}>
                {h.label}
              </p>
              <p className="mt-2 text-lg font-bold">{h.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">{config.modulesTitle}</h2>
          <p className="mt-3 max-w-3xl text-proday-muted">{config.modulesSubtitle}</p>
          <UniverseModuleExplorer universe={universe} modules={config.modules} />
        </div>
      </section>

      {journey && (
        <section className="border-y border-neutral-200 bg-neutral-50/80 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">Votre parcours</h2>
            <p className="mt-3 max-w-2xl text-proday-muted">
              De l&apos;inscription aux premières actions — étape par étape dans l&apos;app.
            </p>
            {journeys.length > 1 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {journeys.map((j, i) => (
                  <button
                    key={j.id}
                    type="button"
                    onClick={() => setActiveJourney(i)}
                    className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                      activeJourney === i ? theme.journeyActive : theme.journeyIdle
                    }`}
                  >
                    <span className="mr-1.5">{j.emoji}</span>
                    {j.role}
                  </button>
                ))}
              </div>
            )}
            <motion.ol
              key={journey.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {journey.steps.map((step, i) => (
                <li
                  key={step}
                  className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold">
                    {i + 1}
                  </span>
                  <p className="mt-4 font-medium leading-snug">{step}</p>
                </li>
              ))}
            </motion.ol>
            <p className="mt-8 text-sm text-proday-muted">{config.audienceNote}</p>
          </div>
        </section>
      )}

      {config.showPulse && (
        <section className={universe === "woman" ? "bg-pink-50/50 py-16" : "py-16"}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">Pulse ProDay</h2>
            <p className="mt-3 max-w-2xl text-proday-muted">
              Score de visibilité exclusif — profil, stats, activité et confiance combinés.
            </p>
          </div>
          <PulseSimulator
            fullPage
            variant={universe === "woman" ? "woman" : "default"}
          />
        </section>
      )}

      {config.showVerification && (
        <section className="bg-blue-50/30 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-blue-950 sm:text-3xl">
              Profils vérifiés
            </h2>
            <p className="mt-3 max-w-2xl text-proday-muted">
              Diplômes, licences et justificatifs — badge orange puis vert après validation admin.
            </p>
          </div>
          <VerificationTimeline embedded />
        </section>
      )}

      {pricingPlans.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">{config.pricingTitle}</h2>
                <p className="mt-2 text-proday-muted">
                  Gratuit pour démarrer — Pro au tarif mensuel de base.
                </p>
              </div>
              <Link
                href={`${ROUTES.pricing}?u=${universe}`}
                className="text-sm font-semibold underline underline-offset-4"
              >
                Tous les tarifs {config.brand.name} →
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pricingPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`${ROUTES.pricing}?u=${universe}`}
                  className={`block rounded-2xl border p-6 transition hover:shadow-md ${theme.pricingCard}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-proday-muted">
                    {plan.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold tabular-nums">
                    {formatPriceEur(plan.monthlyEur)} €
                    <span className="text-base font-normal text-proday-muted">/mois</span>
                  </p>
                  <p className="mt-2 text-sm text-proday-muted">{plan.tagline}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-lg font-bold">Autres univers ProDay</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {otherUniverses.map((line) => (
              <Link
                key={line.id}
                href={line.href}
                className={`group relative min-h-[200px] overflow-hidden rounded-2xl bg-gradient-to-br sm:min-h-[220px] ${UNIVERSE_THEME[line.id].crossCard} text-white`}
              >
                <div className="relative z-10 max-w-[58%] p-6 sm:max-w-[55%]">
                  <Image
                    src={line.logo}
                    alt={line.brand.fullName}
                    width={48}
                    height={48}
                    className="rounded-xl bg-white/10 ring-1 ring-white/20"
                  />
                  <p className="mt-4 text-xs font-semibold tracking-widest text-white/70">
                    {line.brand.tagline}
                  </p>
                  <p className="mt-2 text-xl font-bold">{line.brand.fullName}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-white/85">{line.brand.mission}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                    Explorer
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
                <div className="absolute inset-y-0 right-0 w-[48%] sm:w-[45%]">
                  <Image
                    src={line.image}
                    alt={line.brand.fullName}
                    fill
                    className="object-cover object-center transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 48vw, 320px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`bg-gradient-to-br ${theme.ctaGradient} py-16 text-center text-white`}>
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">{config.cta.title}</h2>
          <p className={`mt-4 ${theme.ctaText}`}>{config.cta.description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={ROUTES.beta}
              className={`inline-block rounded-full px-8 py-3.5 text-sm font-semibold ${theme.ctaBtn}`}
            >
              {config.cta.beta}
            </Link>
            <Link
              href={`${ROUTES.pricing}?u=${universe}`}
              className={`inline-block rounded-full border px-8 py-3.5 text-sm font-semibold ${theme.ctaBtnOutline}`}
            >
              Voir les tarifs
            </Link>
            <Link
              href={ROUTES.quiz}
              className={`inline-block rounded-full border px-8 py-3.5 text-sm font-semibold ${theme.ctaBtnOutline}`}
            >
              Quiz profil
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
