import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ROUTES } from "@/lib/routes";
import { JOUEUR_BRAND } from "@/lib/content";
import { pricingHrefForPole } from "@/lib/poles";

export const metadata: Metadata = {
  title: "Pôle Joueur — Amateur → Pro",
  description:
    "Un seul espace joueur ProDay. Badges Amateur, Centre de formation / Aspirant ou Professionnel. Signature pro sans changer d'environnement.",
};

const BADGES = [
  {
    label: "Amateur",
    color: "#2563EB",
    description: "District, régional, passion. Mercato local et CV.",
  },
  {
    label: "Centre / Aspirant",
    color: "#16A34A",
    description: "Centre de formation ou aspirant. Visibilité scouting.",
  },
  {
    label: "Professionnel",
    color: "#EAB308",
    description: "Sous contrat. Même profil — seul le badge change.",
  },
];

const FEATURES = [
  "Mercato avec filtres recruteur : tous / amateurs / pros / centres",
  "Badge Joueur vérifié (licence ou certification club)",
  "Confidentialité contacts : choisissez qui voit téléphone et email",
  "Demandes de message agent (accept / refuse avant conversation)",
  "Portfolio, stats coach et opportunités dans le même espace",
];

export default function JoueurPolePage() {
  return (
    <>
      <PageHeader
        accent="joueur"
        kicker={JOUEUR_BRAND.tagline}
        title={JOUEUR_BRAND.name}
        description={JOUEUR_BRAND.mission}
      />
      <PageBody>
        <PremiumSection
          id="badges"
          pole="joueur"
          title="Trois badges, un profil"
          description="Du terrain du dimanche au contrat pro — sans changer d'application."
        >
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {BADGES.map((b) => (
              <div key={b.label} className="border-t-2 pt-4" style={{ borderColor: b.color }}>
                <p className="text-sm font-semibold tracking-wide" style={{ color: b.color }}>
                  {b.label}
                </p>
                <p className="mt-2 text-sm text-white/70">{b.description}</p>
              </div>
            ))}
          </div>
        </PremiumSection>

        <PremiumSection
          id="modules"
          pole="joueur"
          title="Ce que vous gagnez"
          description="Carrière continue. Les recruteurs filtrent par niveau ; vous gardez votre historique."
        >
          <ul className="mt-6 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-3 text-sm text-white/85">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#60a5fa]" />
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <PremiumButton href={ROUTES.betaWaitlist} variant="primary">
              Rejoindre la bêta
              <ArrowRight className="ml-2 h-4 w-4" />
            </PremiumButton>
            <PremiumButton href={pricingHrefForPole("joueur")} variant="ghost">
              Voir les tarifs
            </PremiumButton>
            <Link
              href={`${ROUTES.demo}?p=joueur`}
              className="inline-flex items-center text-sm text-[#93c5fd] hover:underline"
            >
              Essayer la démo
            </Link>
          </div>
        </PremiumSection>

        <PremiumSection
          id="verification"
          pole="joueur"
          title="Joueur vérifié"
          description="Licence vérifiée ou certification validée par le club."
        >
          <p className="mt-4 flex items-start gap-3 text-sm text-white/75">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#0EA5E9]" />
            Le badge renforce la confiance des recruteurs et agents sans exposer vos documents.
          </p>
        </PremiumSection>
      </PageBody>
    </>
  );
}
