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
import { themeIdForUniverse, UNIVERSE_THEME } from "@/components/universe/universeTheme";
import { CAROUSEL_POLES, POLE_IMAGES, poleSectionHref, pricingHrefForUniverse } from "@/lib/poles";
import {
  JOURNEYS,
  UNIVERSE_PAGE_CONFIG,
  getWebPlanById,
  type UniversePageId,
} from "@/lib/content";
import { formatPriceEur } from "@/lib/pricing";
import { demoUrlForUniverse, ROUTES } from "@/lib/routes";

const PATH_BY_UNIVERSE: Record<UniversePageId, string> = {
  homme: ROUTES.homme,
  woman: ROUTES.woman,
  amateur: ROUTES.amateur,
  supporter: ROUTES.supporter,
  pro: ROUTES.pro,
  pro_joueur: ROUTES.proJoueur,
  pro_club: ROUTES.proClub,
  pro_staff: ROUTES.proStaff,
};

const POLE_ID_BY_UNIVERSE: Partial<Record<UniversePageId, string>> = {
  amateur: "amateur",
  supporter: "supporter",
  pro_joueur: "pro_joueur",
  pro_club: "pro_club",
  pro_staff: "pro_staff",
};

type UniversePageProps = {
  universe: UniversePageId;
};

export function UniversePage({ universe }: UniversePageProps) {
  const config = UNIVERSE_PAGE_CONFIG[universe];
  const themeId = themeIdForUniverse(universe);
  const theme = UNIVERSE_THEME[themeId];
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
  const currentPoleId = POLE_ID_BY_UNIVERSE[universe];
  const otherPoles = CAROUSEL_POLES.filter((p) => p.id !== currentPoleId);

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[120vh] opacity-100"
        style={{ background: theme.ambientWash }}
        aria-hidden
      />
      <div className="relative">
      <PageHeader
        pathname={PATH_BY_UNIVERSE[universe]}
        kicker={config.brand.tagline}
        title={config.hero.title}
        description={config.brand.mission}
        image={config.hero.image}
        logo={config.brand.logo}
        logoAlt={config.brand.fullName}
        accent={theme.pageHeaderAccent}
        dark
      />

      <section
        className="border-b border-white/10 py-12"
        style={{ background: `linear-gradient(180deg, ${theme.brandDeep}22 0%, #000 100%)` }}
      >
        <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {config.highlights.map((h) => (
            <div
              key={h.label}
              className={`rounded-2xl p-5 ${theme.highlightBorder}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wider ${theme.highlightLabel}`}>
                {h.label}
              </p>
              <p className="mt-2 font-display text-lg font-bold text-white">{h.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="modules" className="scroll-mt-24 bg-black py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className={`font-signature text-2xl italic ${theme.highlightLabel}`}>
            Modules
          </p>
          <h2 className="font-display mt-2 text-2xl font-extrabold uppercase tracking-[-0.03em] text-white sm:text-3xl">{config.modulesTitle}</h2>
          <p className="mt-3 max-w-3xl text-white/55">{config.modulesSubtitle}</p>
          <UniverseModuleExplorer universe={themeId} modules={config.modules} />
        </div>
      </section>

      {journey && (
        <section id="parcours" className="scroll-mt-24 border-y border-white/10 bg-[#050505] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Votre parcours</h2>
            <p className="mt-3 max-w-2xl text-white/55">
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
                  className="card-premium rounded-2xl p-6"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="mt-4 font-medium leading-snug text-white/85">{step}</p>
                </li>
              ))}
            </motion.ol>
            <p className="mt-8 text-sm text-white/50">{config.audienceNote}</p>
          </div>
        </section>
      )}

      {config.showPulse && (
        <section id="pulse" className={`scroll-mt-24 py-16 ${theme.softSectionBg || "bg-[#030303]"}`}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Visibilité ProDay</h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Score de visibilité exclusif — profil, stats, activité et confiance combinés.
            </p>
          </div>
          <PulseSimulator fullPage universe={config.line} />
        </section>
      )}

      {config.showVerification && (
        <section id="verification" className={`scroll-mt-24 py-16 ${theme.verificationSectionBg || "bg-[#050505]"}`}>
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className={`font-display text-2xl font-bold sm:text-3xl ${theme.verificationTitle || "text-white"}`}>
              Profils vérifiés
            </h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Diplômes, licences et justificatifs — badge orange puis vert après validation admin.
            </p>
          </div>
          <VerificationTimeline embedded />
        </section>
      )}

      {pricingPlans.length > 0 ? (
        <section id="tarifs" className="scroll-mt-24 bg-[#030303] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{config.pricingTitle}</h2>
                <p className="mt-2 text-white/55">
                  Gratuit pour démarrer — Pro au tarif mensuel de base.
                </p>
              </div>
              <Link
                href={pricingHrefForUniverse(universe)}
                className="text-sm font-semibold text-white/70 underline underline-offset-4 hover:text-white"
              >
                Tous les tarifs {config.brand.name}
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={pricingHrefForUniverse(universe)}
                  className={`block rounded-2xl border p-6 transition hover:shadow-md ${theme.pricingCard}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                    {plan.label}
                  </p>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-white">
                    {formatPriceEur(plan.monthlyEur)} €
                    <span className="text-base font-normal text-white/50">/mois</span>
                  </p>
                  <p className="mt-2 text-sm text-white/55">{plan.tagline}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : universe === "supporter" ? (
        <section id="tarifs" className="scroll-mt-24 bg-[#030303] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">{config.pricingTitle}</h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Matchs live, suivis illimités, débats, réels et shop — sans abonnement, sans paywall.
              La tribune PRODAY est entièrement gratuite pour les supporters.
            </p>
            <div className={`mt-8 rounded-2xl border p-8 ${theme.pricingCard}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                0 € / mois
              </p>
              <p className="mt-3 text-3xl font-bold text-white">Tribune complète incluse</p>
              <ul className="mt-6 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
                <li>• Matchs PRODAY et monde (API)</li>
                <li>• Suivis clubs, joueurs et tournois illimités</li>
                <li>• Fil communautaire et débats</li>
                <li>• Moments / réels et shop merch</li>
              </ul>
            </div>
          </div>
        </section>
      ) : null}

      <section id="poles" className="border-t border-white/10 bg-[#030303] py-12 scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-lg font-bold text-white">Autres pôles ProDay</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherPoles.map((pole) => {
              const crossTheme =
                pole.id === "sante"
                  ? UNIVERSE_THEME.sante
                  : UNIVERSE_THEME[
                      themeIdForUniverse(
                        pole.id === "amateur"
                          ? "amateur"
                          : pole.id === "supporter"
                            ? "supporter"
                            : pole.id === "pro_joueur"
                              ? "pro_joueur"
                              : pole.id === "pro_club"
                                ? "pro_club"
                                : "pro_staff",
                      )
                    ];
              return (
                <Link
                  key={pole.id}
                  href={poleSectionHref(pole)}
                  className={`group relative min-h-[200px] overflow-hidden rounded-2xl bg-gradient-to-br sm:min-h-[220px] ${crossTheme.crossCard} text-white`}
                >
                  <div className="relative z-10 max-w-[58%] p-6 sm:max-w-[55%]">
                    <Image
                      src={pole.logo}
                      alt={pole.title}
                      width={48}
                      height={48}
                      className="rounded-xl bg-white/10 ring-1 ring-white/20"
                    />
                    <p className="mt-4 text-xs font-semibold tracking-widest text-white/70">
                      {pole.kicker}
                    </p>
                    <p className="mt-2 text-xl font-bold">{pole.title}</p>
                    <p className="mt-2 line-clamp-3 text-sm text-white/85">{pole.subtitle}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                      Explorer
                      <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  <div className="absolute inset-y-0 right-0 w-[48%] sm:w-[45%]">
                    <Image
                      src={POLE_IMAGES[pole.id]}
                      alt={pole.title}
                      fill
                      className="object-cover object-center transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 48vw, 320px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`bg-gradient-to-br ${theme.ctaGradient} py-16 text-center text-white`}>
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold sm:text-3xl">{config.cta.title}</h2>
          <p className={`mt-4 ${theme.ctaText}`}>{config.cta.description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href={ROUTES.betaWaitlist}
              className={`inline-block rounded-full px-8 py-3.5 text-sm font-semibold ${theme.ctaBtn}`}
            >
              {config.cta.beta}
            </Link>
            <Link
              href={demoUrlForUniverse(config.line)}
              className={`inline-block rounded-full border px-8 py-3.5 text-sm font-semibold ${theme.ctaBtnOutline}`}
            >
              Voir la démo
            </Link>
            <Link
              href={pricingHrefForUniverse(universe)}
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
      </div>
    </div>
  );
}
