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

const SECTION_COPY: Record<
  UniversePageId,
  {
    journeyTitle: string;
    journeySubtitle: string;
    pulseTitle: string;
    pulseSubtitle: string;
    verificationTitle: string;
    verificationSubtitle: string;
    pricingSubtitle: string;
  }
> = {
  homme: {
    journeyTitle: "Premières étapes",
    journeySubtitle: "De l'inscription aux premières actions.",
    pulseTitle: "Visibilité ProDay",
    pulseSubtitle: "Profil, stats, activité et confiance.",
    verificationTitle: "Profils vérifiés",
    verificationSubtitle: "Diplômes et licences validés.",
    pricingSubtitle: "Gratuit pour démarrer.",
  },
  woman: {
    journeyTitle: "Premières étapes",
    journeySubtitle: "De l'inscription aux premières actions.",
    pulseTitle: "Visibilité ProDay",
    pulseSubtitle: "Profil, stats, activité et confiance.",
    verificationTitle: "Profils vérifiés",
    verificationSubtitle: "Diplômes et licences validés.",
    pricingSubtitle: "Gratuit pour démarrer.",
  },
  amateur: {
    journeyTitle: "Deux entrées, une coque",
    journeySubtitle: "Joueur ou coach. Choisissez votre entrée. Le reste suit le week-end.",
    pulseTitle: "Votre visibilité de saison",
    pulseSubtitle: "Un score sur l'Accueil Équipe. Pas un onglet de plus.",
    verificationTitle: "Coachs vérifiés",
    verificationSubtitle: "Diplômes et licences. Badge puis validation admin.",
    pricingSubtitle: "Joueur Plus et Coach Pro. Démarrage gratuit.",
  },
  supporter: {
    journeyTitle: "Entrer dans la tribune",
    journeySubtitle: "Quatre gestes. Le live s'ouvre le jour du match.",
    pulseTitle: "Visibilité",
    pulseSubtitle: "",
    verificationTitle: "Vérification",
    verificationSubtitle: "",
    pricingSubtitle: "Aucun abonnement. Aucun paywall.",
  },
  pro: {
    journeyTitle: "Selon votre métier",
    journeySubtitle: "Choisissez le profil staff qui correspond.",
    pulseTitle: "Visibilité",
    pulseSubtitle: "",
    verificationTitle: "Profils vérifiés",
    verificationSubtitle: "Validation métier avant le réseau.",
    pricingSubtitle: "Formules selon le rôle.",
  },
  pro_joueur: {
    journeyTitle: "Étapes joueur pro",
    journeySubtitle: "De l'Accueil Carrière aux shortlists recruteurs.",
    pulseTitle: "Visibilité scouting",
    pulseSubtitle: "Ce que voient les clubs quand ils ouvrent votre profil.",
    verificationTitle: "Confiance club & agent",
    verificationSubtitle: "Justificatifs et badge. Pour rassurer le staff en face.",
    pricingSubtitle: "Formule Pro Joueur. Démarrage gratuit.",
  },
  pro_club: {
    journeyTitle: "Installer la structure",
    journeySubtitle: "Du mandat à la vitrine publique, étape par étape.",
    pulseTitle: "Visibilité",
    pulseSubtitle: "",
    verificationTitle: "Structure vérifiée",
    verificationSubtitle: "Mandat et identité club. Avant le recrutement ouvert.",
    pricingSubtitle: "Une formule structure. Multi-équipes inclus.",
  },
  pro_staff: {
    journeyTitle: "Choisir votre métier",
    journeySubtitle: "Quatre métiers staff. Réseau vérifié. Messagerie tracée.",
    pulseTitle: "Visibilité",
    pulseSubtitle: "",
    verificationTitle: "Métiers vérifiés",
    verificationSubtitle: "Diplôme, licence ou mandat. Le badge avant le pipeline.",
    pricingSubtitle: "Tarifs selon le métier. Démarrage gratuit.",
  },
};

type UniversePageProps = {
  universe: UniversePageId;
};

export function UniversePage({ universe }: UniversePageProps) {
  const config = UNIVERSE_PAGE_CONFIG[universe];
  const themeId = themeIdForUniverse(universe);
  const theme = UNIVERSE_THEME[themeId];
  const copy = SECTION_COPY[universe];
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
  const pulseUniverse =
    universe === "pro_joueur" || universe === "pro_club" || universe === "pro_staff"
      ? "pro"
      : config.line;

  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[130vh]"
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

        {/* Highlights. bandeau éditorial */}
        <section
          className="border-b border-white/10"
          style={{
            background: `linear-gradient(180deg, ${theme.brandDeep}44 0%, #050507 100%)`,
          }}
        >
          <div className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
            {config.highlights.map((h, i) => (
              <div
                key={h.label}
                className="group relative border-white/10 px-5 py-8 sm:px-7 sm:py-10 [&:nth-child(odd)]:border-r lg:border-r lg:[&:nth-child(4n)]:border-r-0"
                style={{ borderBottomWidth: i < 2 ? 1 : undefined }}
              >
                <span
                  className="font-display text-4xl font-extrabold tabular-nums opacity-25 transition group-hover:opacity-45 sm:text-5xl"
                  style={{ color: theme.brandAccent }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p
                  className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: theme.brandAccent }}
                >
                  {h.label}
                </p>
                <p className="font-display mt-2 text-lg font-bold leading-snug text-white sm:text-xl">
                  {h.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Modules */}
        <section id="modules" className="scroll-mt-28 bg-[#050507] py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-12 flex flex-col gap-4 border-b border-white/10 pb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={`font-signature text-2xl italic ${theme.highlightLabel}`}>
                  Dans l&apos;app
                </p>
                <h2 className="font-display mt-1 max-w-xl text-3xl font-extrabold uppercase tracking-[-0.03em] text-white sm:text-4xl">
                  {config.modulesTitle}
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-white/45">
                {config.modulesSubtitle}
              </p>
            </div>
            <UniverseModuleExplorer universe={themeId} modules={config.modules} />
          </div>
        </section>

        {/* Women's Football Section - Pro Joueur only */}
        {universe === "pro_joueur" && (
          <section
            className="scroll-mt-28 border-y border-white/10 py-20"
            style={{
              background: `linear-gradient(135deg, ${theme.brandDeep}22 0%, #050505 40%, #030303 100%)`,
            }}
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="mb-8 flex items-center gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: `${theme.brandAccent}22` }}
                >
                  <span className="text-3xl">⚽</span>
                </div>
                <div>
                  <p className={`font-signature text-2xl italic ${theme.highlightLabel}`}>
                    Foot féminin
                  </p>
                  <h2 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white sm:text-4xl">
                    Opportunités et clubs dédiés
                  </h2>
                </div>
              </div>
              <p className="max-w-2xl text-base text-white/60">
                ProDay s'engage à promouvoir le football féminin avec des opportunités spécifiques
                pour les joueuses professionnelles et les clubs dédiés au football féminin.
              </p>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  className="rounded-2xl border border-white/10 bg-black/30 p-6"
                  style={{ borderColor: `${theme.brandAccent}33` }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: theme.brandAccent }}
                  >
                    Profil
                  </p>
                  <p className="mt-3 font-display text-xl font-bold text-white">
                    Portfolio joueuse
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    CV complet avec stats, vidéos et parcours carrière
                  </p>
                </div>
                <div
                  className="rounded-2xl border border-white/10 bg-black/30 p-6"
                  style={{ borderColor: `${theme.brandAccent}33` }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: theme.brandAccent }}
                  >
                    Recrutement
                  </p>
                  <p className="mt-3 font-display text-xl font-bold text-white">
                    Clubs féminins
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    Accès direct aux clubs et opportunités D1, D2 et D3
                  </p>
                </div>
                <div
                  className="rounded-2xl border border-white/10 bg-black/30 p-6"
                  style={{ borderColor: `${theme.brandAccent}33` }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.2em]"
                    style={{ color: theme.brandAccent }}
                  >
                    Réseau
                  </p>
                  <p className="mt-3 font-display text-xl font-bold text-white">
                    Communauté
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    Connexion avec joueuses, staff et agents du foot féminin
                  </p>
                </div>
              </div>
              <div className="mt-10">
                <Link
                  href={ROUTES.proJoueur}
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
                  style={{ borderColor: theme.brandAccent }}
                >
                  Voir les opportunités
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* FFF Agents Section - Pro Staff only */}
        {universe === "pro_staff" && (
          <section
            className="scroll-mt-28 border-y border-white/10 py-20"
            style={{
              background: `linear-gradient(135deg, ${theme.brandDeep}22 0%, #050505 40%, #030303 100%)`,
            }}
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
            </div>
          </section>
        )}

        {/* Parcours */}
        {journey && (
          <section
            id="parcours"
            className="scroll-mt-28 border-y border-white/10 py-20"
            style={{
              background: `linear-gradient(135deg, ${theme.brandDeep}22 0%, #050505 40%, #030303 100%)`,
            }}
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className={`font-signature text-2xl italic ${theme.highlightLabel}`}>
                Étapes
              </p>
              <h2 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white sm:text-4xl">
                {copy.journeyTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-white/50 sm:text-base">
                {copy.journeySubtitle}
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
                className="mt-12 grid gap-0 sm:grid-cols-2 lg:grid-cols-4"
              >
                {journey.steps.map((step, i) => (
                  <li
                    key={step}
                    className="relative border border-white/10 bg-black/30 p-6 backdrop-blur-sm sm:min-h-[180px]"
                    style={{
                      borderColor: `${theme.brandAccent}22`,
                    }}
                  >
                    <span
                      className="font-display text-sm font-bold tabular-nums"
                      style={{ color: theme.brandAccent }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="mt-4 font-medium leading-snug text-white/90">{step}</p>
                    {i < journey.steps.length - 1 && (
                      <span
                        className="absolute -right-px top-1/2 hidden h-px w-4 -translate-y-1/2 lg:block"
                        style={{ background: theme.brandAccent, opacity: 0.35 }}
                        aria-hidden
                      />
                    )}
                  </li>
                ))}
              </motion.ol>
              <p className="mt-10 max-w-2xl text-sm text-white/40">{config.audienceNote}</p>
            </div>
          </section>
        )}

        {config.showPulse && (
          <section id="pulse" className={`scroll-mt-28 py-20 ${theme.softSectionBg || "bg-[#030303]"}`}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className={`font-signature text-2xl italic ${theme.highlightLabel}`}>
                Score
              </p>
              <h2 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white">
                {copy.pulseTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-white/50">{copy.pulseSubtitle}</p>
            </div>
            <PulseSimulator fullPage universe={pulseUniverse} />
          </section>
        )}

        {config.showVerification && (
          <section
            id="verification"
            className={`scroll-mt-28 py-20 ${theme.verificationSectionBg || "bg-[#050505]"}`}
          >
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className={`font-signature text-2xl italic ${theme.highlightLabel}`}>
                Confiance
              </p>
              <h2
                className={`font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.03em] ${theme.verificationTitle || "text-white"}`}
              >
                {copy.verificationTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-white/50">
                {copy.verificationSubtitle}
              </p>
            </div>
            <VerificationTimeline embedded />
          </section>
        )}

        {pricingPlans.length > 0 ? (
          <section id="tarifs" className="scroll-mt-28 border-t border-white/10 bg-[#030303] py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className={`font-signature text-2xl italic ${theme.highlightLabel}`}>
                    Tarifs
                  </p>
                  <h2 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white">
                    {config.pricingTitle}
                  </h2>
                  <p className="mt-2 text-sm text-white/45">{copy.pricingSubtitle}</p>
                </div>
                <Link
                  href={pricingHrefForUniverse(universe)}
                  className="text-sm font-semibold underline underline-offset-4"
                  style={{ color: theme.brandAccent }}
                >
                  Tous les tarifs
                </Link>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pricingPlans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={pricingHrefForUniverse(universe)}
                    className={`block rounded-3xl border p-7 transition hover:-translate-y-0.5 hover:shadow-lg ${theme.pricingCard}`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                      {plan.label}
                    </p>
                    <p className="mt-4 font-display text-3xl font-extrabold tabular-nums text-white">
                      {formatPriceEur(plan.monthlyEur)} €
                      <span className="text-base font-normal text-white/40">/mois</span>
                    </p>
                    <p className="mt-3 text-sm text-white/55">{plan.tagline}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : universe === "supporter" ? (
          <section id="tarifs" className="scroll-mt-28 border-t border-white/10 bg-[#030303] py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <p className={`font-signature text-2xl italic ${theme.highlightLabel}`}>
                Tarif
              </p>
              <h2 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white">
                {config.pricingTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-white/50">{copy.pricingSubtitle}</p>
              <div
                className={`mt-10 overflow-hidden rounded-3xl border p-8 sm:p-10 ${theme.pricingCard}`}
              >
                <p
                  className="font-display text-5xl font-extrabold tabular-nums sm:text-6xl"
                  style={{ color: theme.brandAccent }}
                >
                  0 €
                </p>
                <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/40">
                  par mois · pour toujours
                </p>
                <p className="mt-6 text-2xl font-bold text-white">Tribune complète incluse</p>
                <ul className="mt-8 grid gap-3 text-sm text-white/70 sm:grid-cols-2">
                  <li className="flex gap-2">
                    <span style={{ color: theme.brandAccent }}>→</span>
                    Matchs PRODAY et monde (API)
                  </li>
                  <li className="flex gap-2">
                    <span style={{ color: theme.brandAccent }}>→</span>
                    Suivis clubs, joueurs, tournois
                  </li>
                  <li className="flex gap-2">
                    <span style={{ color: theme.brandAccent }}>→</span>
                    Fil communautaire et débats
                  </li>
                  <li className="flex gap-2">
                    <span style={{ color: theme.brandAccent }}>→</span>
                    Moments / réels et shop merch
                  </li>
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {/* Autres pôles */}
        <section id="poles" className="scroll-mt-28 border-t border-white/10 bg-[#050507] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="font-signature text-xl italic text-white/50">Autres pôles</p>
                <h2 className="font-display mt-1 text-2xl font-extrabold uppercase tracking-[-0.03em] text-white">
                  Les autres pôles
                </h2>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    className={`group relative min-h-[200px] overflow-hidden rounded-3xl bg-gradient-to-br sm:min-h-[220px] ${crossTheme.crossCard} text-white`}
                  >
                    <div className="relative z-10 max-w-[58%] p-6 sm:max-w-[55%]">
                      <Image
                        src={pole.logo}
                        alt={pole.title}
                        width={48}
                        height={48}
                        className="rounded-xl bg-white p-0.5"
                      />
                      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">
                        {pole.kicker}
                      </p>
                      <p className="font-display mt-2 text-xl font-bold">{pole.title}</p>
                      <p className="mt-2 line-clamp-3 text-sm text-white/75">{pole.subtitle}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                        Explorer
                        <ArrowRight
                          size={16}
                          className="transition group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>
                    <div className="absolute inset-y-0 right-0 w-[48%] sm:w-[45%]">
                      <Image
                        src={POLE_IMAGES[pole.id]}
                        alt=""
                        fill
                        className="object-cover object-center transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 48vw, 320px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="relative overflow-hidden py-20 text-center text-white"
          style={{
            background: `linear-gradient(135deg, ${theme.brandDeep} 0%, #050507 55%, #000 100%)`,
          }}
        >
          <div
            className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: theme.brandAccent }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-[-0.03em] sm:text-4xl">
              {config.cta.title}
            </h2>
            <p className="mt-4 text-base text-white/60">{config.cta.description}</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href={ROUTES.betaWaitlist}
                className="inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-black transition hover:opacity-90"
              >
                {config.cta.beta}
              </Link>
              <Link
                href={demoUrlForUniverse(config.line)}
                className="inline-flex rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
              >
                Voir la démo
              </Link>
              <Link
                href={pricingHrefForUniverse(universe)}
                className="inline-flex rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
