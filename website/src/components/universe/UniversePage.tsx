"use client";

import { TerminalProductPage } from "@/components/terminal";
import { themeIdForUniverse, UNIVERSE_THEME } from "@/components/universe/universeTheme";
import {
  JOURNEYS,
  UNIVERSE_PAGE_CONFIG,
  getWebPlanById,
  type UniversePageId,
} from "@/lib/content";
import { formatPriceEur } from "@/lib/pricing";
import { visualIdForUniverse } from "@/lib/roleVisuals";
import { demoUrlForUniverse, ROUTES } from "@/lib/routes";
import { useMemo } from "react";

const PATH_BY_UNIVERSE: Record<UniversePageId, string> = {
  homme: ROUTES.joueur,
  woman: ROUTES.joueur,
  amateur: ROUTES.joueur,
  supporter: ROUTES.supporter,
  pro: ROUTES.pro,
  pro_joueur: ROUTES.joueur,
  pro_club: ROUTES.proClub,
  pro_staff: ROUTES.coach,
};

type UniversePageProps = {
  universe: UniversePageId;
};

export function UniversePage({ universe }: UniversePageProps) {
  const config = UNIVERSE_PAGE_CONFIG[universe];
  const themeId = themeIdForUniverse(universe);
  const theme = UNIVERSE_THEME[themeId];

  const journey = useMemo(
    () =>
      JOURNEYS.find((j) =>
        (config.journeyIds as readonly string[]).includes(j.id),
      ),
    [config.journeyIds],
  );

  const pricingPlans = config.pricingPlanIds
    .map((id) => getWebPlanById(id))
    .filter((p): p is NonNullable<typeof p> => p != null);

  const features = config.highlights.map((h) => ({
    eyebrow: h.label,
    title: h.value,
    body: config.modulesSubtitle,
  }));

  const modules =
    config.modules.length > 0
      ? config.modules.slice(0, 4).map((m) => ({
          id: m.id,
          label: m.title,
          title: m.subtitle,
          body: m.description,
        }))
      : (journey?.steps.slice(0, 4).map((step, i) => ({
          id: `step-${i}`,
          label: `0${i + 1}`,
          title: step,
          body: config.audienceNote,
        })) ?? []);

  const pillars =
    pricingPlans.length > 0
      ? pricingPlans.slice(0, 3).map((plan) => ({
          metric: `${formatPriceEur(plan.monthlyEur)} €`,
          metricLabel: "/mois",
          title: plan.label,
          body: plan.tagline,
        }))
      : universe === "supporter"
        ? [
            {
              metric: "0 €",
              metricLabel: "toujours",
              title: "Sans paywall",
              body: "Tribune complète. Pas d'abonnement store.",
            },
            {
              metric: "Live",
              metricLabel: "jour J",
              title: "Matchs",
              body: "PRODAY et monde via API.",
            },
            {
              metric: "∞",
              metricLabel: "suivis",
              title: "Favoris",
              body: "Clubs, joueurs, tournois sans limite.",
            },
          ]
        : config.highlights.slice(0, 3).map((h) => ({
            metric: h.value.split(" ")[0] ?? "—",
            metricLabel: h.label,
            title: h.label,
            body: h.value,
          }));

  const visualId = visualIdForUniverse(universe);

  return (
    <TerminalProductPage
      pathname={PATH_BY_UNIVERSE[universe]}
      visualId={visualId}
      kicker={config.brand.tagline}
      title={config.hero.title}
      description={config.brand.mission}
      logo={config.brand.logo}
      logoAlt={config.brand.fullName}
      accent={theme.pageHeaderAccent}
      story={{
        title: config.modulesTitle,
        body: `${config.modulesSubtitle} ${config.audienceNote}`,
      }}
      breakdownTitle={`Décomposer ${config.brand.name}`}
      features={features}
      platformTitle="Une plateforme. Des modules utiles."
      platformDescription={config.modulesSubtitle}
      modules={modules}
      value={{
        title: config.cta.title,
        description: config.cta.description,
        pillars,
      }}
      cta={{
        title: config.cta.title,
        description: config.cta.description,
        primaryHref: ROUTES.betaWaitlist,
        primaryLabel: config.cta.beta,
        secondaryHref: demoUrlForUniverse(config.line),
        secondaryLabel: "Voir la démo",
      }}
    />
  );
}
