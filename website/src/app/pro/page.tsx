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
    "Trois pôles pro distincts : Pro Joueur, Pro Club et Pro Staff.",
};

const PRO_POLES = CAROUSEL_POLES.filter((p) =>
  ["pro_joueur", "pro_club", "pro_staff"].includes(p.id),
);

export default function ProHubPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.pro}
        kicker={PRO_BRAND.tagline}
        title="Trois pôles pro, trois métiers"
        description="PRODAY scinde l'ancien univers « Pro » en Pro Joueur, Pro Club et Pro Staff — chacun avec sa coque, sa navigation et ses tarifs."
        image="/images/football-pro-01.jpg"
        logo={PRO_BRAND.logo}
        logoAlt={PRO_BRAND.fullName}
        accent="pro"
        dark
      />

      <PremiumSection
        id="poles"
        kicker="CHOISIR SON PÔLE"
        title="Où allez-vous ?"
        description="Joueur sous contrat, structure club ou staff métier — sélectionnez le pôle qui correspond à votre rôle."
        pole="pro_staff"
        bordered={false}
      >
        <div className="grid gap-6 lg:grid-cols-3">
          {PRO_POLES.map((pole) => {
            const styles = POLE_STYLES[pole.id];
            return (
              <Link
                key={pole.id}
                href={poleSectionHref(pole)}
                className={`group overflow-hidden rounded-3xl ${styles.card} transition hover:ring-2 hover:ring-white/20`}
              >
                <div className="relative h-44">
                  <Image
                    src={POLE_IMAGES[pole.id]}
                    alt=""
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
                </div>
                <div className="p-6">
                  <p className={`text-xs font-bold uppercase tracking-widest ${styles.textMuted}`}>
                    {pole.kicker}
                  </p>
                  <h3 className="font-display mt-2 text-xl font-bold text-white">{pole.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{pole.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80">
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
        kicker="PARTENAIRES"
        title="Hors carousel des 6 pôles"
        description="Les marques et sponsors accèdent à l'espace Partenaires — distinct des pôles joueur, club et staff."
        pole="pro_staff"
      >
        <PremiumButton href={`${ROUTES.sponsor}#formules`} variant="outline">
          Pôle Sponsor
        </PremiumButton>
      </PremiumSection>
    </>
  );
}
