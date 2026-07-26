import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Star, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageBody } from "@/components/layout/PageBody";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ROUTES } from "@/lib/routes";
import { PRO_BRAND } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pro Day Joueur - Gérez votre carrière foot",
  description: "Portfolio scouting, stats automatiques, CV ProDay et opportunités de recrutement. L'outil ultime pour les joueurs professionnels et amateurs.",
};

const benefits = [
  {
    icon: TrendingUp,
    title: "Stats automatiques",
    description: "Vos performances mises à jour après chaque match. Buts, passes, temps de jeu - tout est tracé automatiquement.",
  },
  {
    icon: Star,
    title: "Score de visibilité",
    description: "Algorithme unique combinant profil, stats et activité. Plus votre score monte, plus vous êtes visible des recruteurs.",
  },
  {
    icon: Check,
    title: "CV ProDay exportable",
    description: "Générez votre CV foot professionnel en PDF. Inclut stats, photo et parcours. Idéal pour les essais.",
  },
];

const features = [
  "Mercato Pro avec filtres avancés",
  "Alertes personnalisées par poste et niveau",
  "Portfolio visuel avec photos et vidéos",
  "Messagerie directe avec les recruteurs",
  "Calendrier unifié matchs et entraînements",
  "Covoiturage pour les déplacements",
];

export default function ProJoueurPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.proJoueur}
        kicker="PRO JOUEUR"
        title="Votre carrière, sous contrôle"
        description="Portfolio scouting, stats automatiques et CV ProDay. L'outil qui connecte les talents aux opportunités."
        image="/images/football-player-01.jpg"
        logo={PRO_BRAND.logo}
        logoAlt={PRO_BRAND.fullName}
        accent="joueur"
        dark
      />

      <PageBody>
        <PremiumSection
          kicker="AVANTAGES"
          title="Pourquoi ProDay Joueur ?"
          description="Tout ce dont vous avez besoin pour gérer votre carrière et vous faire repérer."
          bordered={false}
        >
          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-4 inline-flex rounded-full bg-[#4C8BFF]/20 p-3">
                  <benefit.icon className="h-6 w-6 text-[#4C8BFF]" />
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-white/70">{benefit.description}</p>
              </div>
            ))}
          </div>
        </PremiumSection>

        <PremiumSection
          kicker="FONCTIONNALITÉS"
          title="Tout pour votre progression"
          description="Des outils complets pour gérer votre parcours foot."
          bordered={false}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-[#4C8BFF] shrink-0 mt-0.5" />
                <span className="text-white/90">{feature}</span>
              </div>
            ))}
          </div>
        </PremiumSection>

        <PremiumSection
          kicker="ACTION"
          title="Prêt à booster votre carrière ?"
          description="Rejoignez la liste d'attente et soyez parmi les premiers à accéder à ProDay Joueur."
          bordered={false}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <PremiumButton href={ROUTES.betaWaitlist} variant="primary">
              Rejoindre la bêta
            </PremiumButton>
            <Link
              href={ROUTES.compare}
              className="inline-flex items-center gap-2 text-white/70 hover:text-white transition"
            >
              Comparer les pôles
              <ArrowRight size={16} />
            </Link>
          </div>
        </PremiumSection>
      </PageBody>
    </>
  );
}
