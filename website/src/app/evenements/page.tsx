import type { Metadata } from "next";
import { ArrowRight, CalendarDays, CreditCard, ListChecks, Share2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ROUTES } from "@/lib/routes";
import { EVENEMENTS_BRAND, EVENEMENTS_MODULES } from "@/lib/content";
import { pricingHrefForPole } from "@/lib/poles";

export const metadata: Metadata = {
  title: "Pôle Événements — Organisateurs",
  description:
    "Tournois, académies, camps, détections et showcases. Créez, inscrivez, encaissez et partagez.",
};

const ICONS = [CalendarDays, ListChecks, CreditCard, Share2];

export default function EvenementsPolePage() {
  return (
    <>
      <PageHeader
        accent="pro"
        kicker={EVENEMENTS_BRAND.tagline}
        title={EVENEMENTS_BRAND.name}
        description={EVENEMENTS_BRAND.mission}
      />
      <PageBody>
        <PremiumSection
          id="modules"
          pole="evenements"
          title="Espace organisateurs"
          description="Scaffolding produit : modèles et parcours prêts. Paiements en ligne à brancher."
        >
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {EVENEMENTS_MODULES.map((mod, i) => {
              const Icon = ICONS[i % ICONS.length]!;
              return (
                <div key={mod.id} className="border-t border-cyan-700/40 pt-4">
                  <Icon className="h-5 w-5 text-cyan-400" />
                  <h3 className="mt-3 text-lg font-semibold text-white">{mod.title}</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-cyan-400/80">
                    {mod.subtitle}
                  </p>
                  <p className="mt-2 text-sm text-white/70">{mod.description}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-8 text-xs text-white/45">
            TODO : encaissement Stripe / IAP, sync listes live, résultats et partage média natif.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <PremiumButton href={ROUTES.betaWaitlist} variant="primary">
              Rejoindre la bêta
              <ArrowRight className="ml-2 h-4 w-4" />
            </PremiumButton>
            <PremiumButton href={pricingHrefForPole("evenements")} variant="ghost">
              Formule Organisateur
            </PremiumButton>
          </div>
        </PremiumSection>
      </PageBody>
    </>
  );
}
