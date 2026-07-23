import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { PlanDetailCard } from "@/components/poles/PlanDetailCard";
import { PoleFullBleed } from "@/components/poles/PoleFullBleed";
import { SanteTeleconsultSection } from "@/components/sante/SanteTeleconsultSection";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { SANTE_BRAND, getWebPlanById } from "@/lib/content";
import { POLE_STYLES, pricingHrefForPole } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pro Day Santé",
  description:
    "Kinés, coach mental et nutrition — annuaire près des clubs, agenda, téléconsultation HDS et vidéos éducatives.",
};

const SANTE_PILLARS = [
  {
    num: "01",
    title: "Annuaire vérifié",
    body: "Kinés, coachs mental, nutritionnistes — visibles des joueurs et clubs de votre zone.",
  },
  {
    num: "02",
    title: "Agenda dans l'app",
    body: "Prise de rendez-vous native, rappels et suivi — sans multiplier les outils.",
  },
  {
    num: "03",
    title: "Téléconsultation HDS",
    body: "Visio via partenaire conforme (Cal.com / Whereby) — distinct des vidéos éducatives.",
  },
  {
    num: "04",
    title: "Contenus éducatifs",
    body: "Prévention, étirements, récupération — l'onglet Vidéos pour le public, pas la consultation.",
  },
] as const;

export default function SantePage() {
  const physioPlan = getWebPlanById("physio_pro");
  const styles = POLE_STYLES.sante;

  return (
    <>
      <PageHeader
        pathname={ROUTES.sante}
        kicker={SANTE_BRAND.tagline}
        title="Soigner le foot. Près du terrain."
        description={SANTE_BRAND.mission}
        image="/images/football-health-01.jpg"
        logo={SANTE_BRAND.logo}
        logoAlt={SANTE_BRAND.fullName}
        accent="sante"
        dark
      />

      <section className="border-b border-white/10 bg-gradient-to-b from-[#006C60]/30 to-[#050507]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
          {SANTE_PILLARS.map((p, i) => (
            <div
              key={p.num}
              className="border-white/10 px-5 py-8 sm:px-7 sm:py-10 [&:nth-child(odd)]:border-r lg:border-r lg:[&:nth-child(4n)]:border-r-0"
              style={{ borderBottomWidth: i < 2 ? 1 : undefined }}
            >
              <span className="font-display text-3xl font-extrabold tabular-nums text-[#00CCB4]/40 sm:text-4xl">
                {p.num}
              </span>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00CCB4]">
                {p.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <PremiumSection
        kicker="PÔLE SANTÉ"
        title="Praticiens vérifiés, visibles près des clubs"
        description="Un pôle dédié — pas un onglet du Pro Staff. Agenda, téléconsultation sécurisée et vidéos éducatives pour accompagner joueurs et structures."
        pole="sante"
        bordered={false}
      >
        <div className="flex flex-wrap gap-4">
          <PremiumButton
            href={`${ROUTES.betaWaitlist}?role=physio`}
            className="!bg-[#00CCB4] !text-black hover:!bg-[#00e0c4]"
          >
            Accès anticipé Santé
          </PremiumButton>
          <PremiumButton href="#teleconsultation" variant="outline">
            Téléconsultation
          </PremiumButton>
          <PremiumButton href={pricingHrefForPole("sante")} variant="outline">
            Voir les tarifs
          </PremiumButton>
        </div>
      </PremiumSection>

      <SanteTeleconsultSection />

      <PremiumSection
        kicker="VIDÉOS ÉDUCATIVES"
        title="Conseils santé en images"
        description="L'onglet Vidéos sert aux contenus publics (prévention, étirements, récupération) — distinct de la téléconsultation médicale."
        pole="sante"
      >
        <ul className="mx-auto max-w-xl space-y-3 text-sm text-white/70">
          <li className="flex gap-2">
            <span className="text-[#00CCB4]">→</span>
            Contenu éducatif visible dans l&apos;app (onglet Vidéos)
          </li>
          <li className="flex gap-2">
            <span className="text-[#00CCB4]">→</span>
            Visibilité auprès des joueurs et clubs à proximité
          </li>
          <li className="flex gap-2">
            <span className="text-[#00CCB4]">→</span>
            Complète l&apos;agenda RDV — sans remplacer une visio HDS
          </li>
        </ul>
      </PremiumSection>

      {physioPlan && (
        <PoleFullBleed className={`${styles.section} py-20`}>
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <p className="font-signature text-2xl italic text-[#00CCB4]">Tarif praticien</p>
            <h2 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white">
              Pôle santé Pro
            </h2>
            <p className={`mt-2 text-sm ${styles.textMuted}`}>
              Formule découverte gratuite, formule Pro pour la visibilité prioritaire.
            </p>
            <div className="mt-10">
              <PlanDetailCard plan={physioPlan} yearly={false} styles={styles} />
            </div>
          </div>
        </PoleFullBleed>
      )}

      <PremiumSection
        kicker="REJOINDRE"
        title="Prêt à rejoindre l'annuaire ?"
        description="Liste d'attente praticiens — priorité sur le déploiement agenda et téléconsultation."
        pole="sante"
      >
        <div className="text-center">
          <PremiumButton
            href={`${ROUTES.betaWaitlist}?role=physio`}
            className="!bg-[#00CCB4] !text-black hover:!bg-[#00e0c4]"
          >
            Accès anticipé
          </PremiumButton>
        </div>
      </PremiumSection>
    </>
  );
}
