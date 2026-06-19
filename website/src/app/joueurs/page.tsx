import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DemoDisclaimer } from "@/components/demo/DemoDisclaimer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { HOMME_BRAND, WOMAN_BRAND } from "@/lib/content";
import { POLE_STYLES } from "@/lib/poles";
import { demoUrlForUniverse, ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Joueur — Man & Woman",
  description:
    "Foot amateur et semi-pro — Mercato, Reels, Arena, Pulse et CV joueur. Deux univers : Pro Day Man et ProDay Woman.",
};

const VARIANTS = [
  {
    id: "homme" as const,
    href: ROUTES.homme,
    brand: HOMME_BRAND,
    image: "/showcase/classic-discover-hero.jpg",
    tag: "Man",
    accent: "emerald" as const,
  },
  {
    id: "woman" as const,
    href: ROUTES.woman,
    brand: WOMAN_BRAND,
    image: "/showcase/woman/woman-discover-hero.jpg",
    tag: "Woman",
    accent: "pink" as const,
  },
];

const PLAYER_TOOLS = [
  {
    href: ROUTES.pulse,
    title: "Pulse ProDay",
    description: "Simulez votre score de visibilité — profil, activité et complétion.",
    image: "/showcase/classic-exp-pulse.jpg",
    tag: "Simulateur",
  },
  {
    href: ROUTES.liveStats,
    title: "Live Stats",
    description: "Saisissez buts et passes en direct — voyez votre profil se mettre à jour.",
    image: "/showcase/classic-match.jpg",
    tag: "Match",
  },
  {
    href: ROUTES.cv,
    title: "CV joueur",
    description: "Aperçu du CV foot en ligne alimenté par vos matchs et statistiques.",
    image: "/showcase/classic-profile.jpg",
    tag: "Export",
  },
] as const;

export default function JoueursPage() {
  const styles = POLE_STYLES.joueur;

  return (
    <>
      <PageHeader
        pathname={ROUTES.joueurs}
        kicker="PÔLE JOUEUR"
        title="Man et Woman — une saison, une application"
        description="Mercato, Reels, Fil, Arena, Pulse et CV en ligne. Formule découverte gratuite, Joueur Plus pour les candidatures illimitées."
        image="/showcase/classic-discover-hero.jpg"
        accent="joueur"
        dark
      />

      <PremiumSection
        kicker="UNIVERS"
        title="Deux parcours, un même pôle"
        description="Le pôle Joueur regroupe Pro Day Man (foot masculin) et ProDay Woman (foot féminin) — modules partagés, identité visuelle distincte."
        pole="joueur"
        bordered={false}
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {VARIANTS.map((v) => (
            <Link
              key={v.id}
              href={v.href}
              className={`group relative overflow-hidden rounded-3xl ${styles.card} p-8 transition hover:ring-2 hover:ring-emerald-400/30`}
            >
              <div className="absolute inset-0 opacity-30">
                <Image
                  src={v.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div
                  className={`absolute inset-0 ${
                    v.accent === "pink"
                      ? "bg-gradient-to-t from-pink-950 via-pink-950/80 to-transparent"
                      : "bg-gradient-to-t from-emerald-950 via-emerald-950/80 to-transparent"
                  }`}
                />
              </div>
              <div className="relative">
                <Image
                  src={v.brand.logo}
                  alt={v.brand.fullName}
                  width={56}
                  height={56}
                  className="rounded-xl bg-white/10 ring-1 ring-white/20"
                />
                <p className={`mt-4 text-xs font-semibold tracking-widest ${styles.textMuted}`}>
                  {v.brand.tagline}
                </p>
                <h3 className="font-display mt-2 text-2xl font-bold text-white">
                  {v.brand.fullName}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{v.brand.mission}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
                  Explorer {v.tag}
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </PremiumSection>

      <PremiumSection
        kicker="OUTILS"
        title="Essayez avant l'app"
        description="Simulateurs et aperçus interactifs — données illustratives, sans compte connecté."
        pole="joueur"
      >
        <div className="mb-8">
          <DemoDisclaimer />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          {PLAYER_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className={`group overflow-hidden rounded-2xl ${styles.card} transition hover:ring-2 hover:ring-emerald-400/25`}
            >
              <div className="relative h-32 overflow-hidden">
                <Image
                  src={tool.image}
                  alt=""
                  fill
                  className="object-cover opacity-70 transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                <span className={`absolute left-4 top-4 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                  {tool.tag}
                </span>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-white">{tool.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{tool.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
                  Ouvrir
                  <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </PremiumSection>

      <section className="border-t border-white/8 bg-[#030303] py-16">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4 sm:px-6">
          <PremiumButton href={`${ROUTES.pricing}#joueur`} variant="outline">
            Voir les tarifs Joueur
          </PremiumButton>
          <PremiumButton href={demoUrlForUniverse("homme")} variant="outline">
            Démo interactive
          </PremiumButton>
          <PremiumButton href={ROUTES.beta} className="!bg-emerald-500 !text-white hover:!bg-emerald-400">
            Accès anticipé
          </PremiumButton>
        </div>
      </section>
    </>
  );
}
