import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PRO_BRAND } from "@/lib/content";
import { SHOWCASE_POLES, POLE_IMAGES, POLE_STYLES, poleSectionHref } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "ProDay · Écosystème",
  description:
    "Cinq pôles : Joueur, Club, Coach, Supporter et Sponsor. Santé, agent, recruteur et organisateur en rôles intégrés.",
};

const HUB_POLES = SHOWCASE_POLES.filter((p) =>
  ["joueur", "pro_club", "coach", "supporter", "sponsor"].includes(p.id),
);

const PRO_BLURBS: Record<string, { hook: string; forWho: string }> = {
  joueur: {
    hook: "Profil, stats, Pass Premium et covoiturage.",
    forWho: "Amateur · Centre · Pro",
  },
  pro_club: {
    hook: "Cœur de ProDay : équipes, compétitions, permissions.",
    forWho: "Présidents · DS · secrétariat",
  },
  coach: {
    hook: "Tactique IA, IA, effectif et préparation match.",
    forWho: "Coachs rattachés au club",
  },
  supporter: {
    hook: "Tribune gratuite : live, suivis et débats.",
    forWho: "Fans & communauté",
  },
  sponsor: {
    hook: "Campagnes locales et ROI mesurable.",
    forWho: "Marques & partenaires",
  },
};

export default function ProHubPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.pro}
        kicker="Cinq pôles"
        title="L’écosystème, clair et simple."
        description="Joueur, Club, Coach, Supporter, Sponsor. Même app : parcours dédiés. Agent, recruteur, organisateur et santé en rôles intégrés."
        image="/images/football-pro-01.jpg"
        logo={PRO_BRAND.logo}
        logoAlt={PRO_BRAND.fullName}
        accent="pro"
        dark
      />

      <PremiumSection
        title="Cinq pôles"
        className="bg-black py-16 sm:py-20"
      >
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
          {HUB_POLES.map((pole) => {
            const styles = POLE_STYLES[pole.id];
            const blurb = PRO_BLURBS[pole.id];
            return (
              <Link
                key={pole.id}
                href={poleSectionHref(pole)}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/25"
              >
                <div className="relative h-40">
                  <Image
                    src={POLE_IMAGES[pole.id]}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-xs font-bold uppercase tracking-widest text-white/70">
                    {pole.kicker}
                  </p>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-xl font-bold uppercase text-white">
                    {pole.navLabel}
                  </h2>
                  <p className={`mt-1 text-sm ${styles.textMuted}`}>{blurb?.hook}</p>
                  <p className="mt-3 text-xs text-white/45">{blurb?.forWho}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                    Découvrir
                    <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl justify-center px-4">
          <PremiumButton href={ROUTES.betaWaitlist}>Rejoindre la bêta</PremiumButton>
        </div>
      </PremiumSection>
    </>
  );
}
