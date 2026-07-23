import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PRO_BRAND } from "@/lib/content";
import { CAROUSEL_POLES, POLE_IMAGES, POLE_STYLES, poleSectionHref } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pro Day Pro — Hub",
  description:
    "Trois pôles pro : Pro Joueur (carrière), Pro Club (structure) et Pro Staff (métiers).",
};

const PRO_POLES = CAROUSEL_POLES.filter((p) =>
  ["pro_joueur", "pro_club", "pro_staff"].includes(p.id),
);

const PRO_BLURBS: Record<string, { hook: string; forWho: string }> = {
  pro_joueur: {
    hook: "Ta carrière, pas un CV Word.",
    forWho: "Joueurs sous contrat · essais · scouting",
  },
  pro_club: {
    hook: "Toute la structure. Un regard.",
    forWho: "Présidents · DS · secrétariat",
  },
  pro_staff: {
    hook: "Ton métier. Ta coque.",
    forWho: "Agent · recruteur · coach · Arena",
  },
};

export default function ProHubPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.pro}
        kicker="Trois coques · un écosystème"
        title="Le pro, découpé pour de vrai."
        description="Fini l'univers Pro fourre-tout. Joueur, club et staff ont chacun leur navigation, leurs modules et leurs tarifs."
        image="/images/football-pro-01.jpg"
        logo={PRO_BRAND.logo}
        logoAlt={PRO_BRAND.fullName}
        accent="pro"
        dark
      />

      <PremiumSection
        id="poles"
        kicker="CHOISIR SON PÔLE"
        title="Où est ta place ?"
        description="Trois portes d'entrée — même écosystème ProDay, trois métiers distincts."
        pole="pro_staff"
        bordered={false}
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {PRO_POLES.map((pole, index) => {
            const styles = POLE_STYLES[pole.id];
            const blurb = PRO_BLURBS[pole.id];
            return (
              <Link
                key={pole.id}
                href={poleSectionHref(pole)}
                className={`group overflow-hidden rounded-3xl border border-white/10 bg-black/40 transition hover:-translate-y-1 hover:border-white/20 ${styles.card}`}
              >
                <div className="relative h-48">
                  <Image
                    src={POLE_IMAGES[pole.id]}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/55 to-transparent" />
                  <span className="absolute left-4 top-4 font-display text-2xl font-extrabold tabular-nums text-white/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="p-6">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${styles.textMuted}`}>
                    {pole.kicker}
                  </p>
                  <h3 className="font-display mt-2 text-xl font-bold text-white">{pole.title}</h3>
                  <p className="mt-2 text-base font-medium text-white/90">{blurb?.hook}</p>
                  <p className="mt-2 text-sm text-white/50">{blurb?.forWho}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/80">
                    Explorer
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </PremiumSection>

      <PremiumSection
        kicker="MARQUES"
        title="Et les partenaires ?"
        description="Les marques ont leur propre espace — campagnes, ROI et vitrine sponsor, hors des trois coques sportives."
        pole="pro_staff"
      >
        <PremiumButton href={`${ROUTES.sponsor}#formules`} variant="outline">
          Pôle Sponsor
        </PremiumButton>
      </PremiumSection>
    </>
  );
}
