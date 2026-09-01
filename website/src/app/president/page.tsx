import type { Metadata } from "next";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { PresidentAppHub } from "@/components/poles/PresidentAppHub";
import { ClubRoiCalculator } from "@/components/poles/ClubRoiCalculator";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { poleAccentCssVars } from "@/lib/brandColors";
import { POLE_REFERRAL_LINE } from "@/lib/commercialCopy";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { CLUB_APP_HREF, ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Pôle Président · Cockpit dirigeants",
  description:
    "Le président ouvre ProDay et comprend le club en quelques secondes. Cockpit, finances, assistant IA · décisions claires. Parrainage possible.",
};

export default function PresidentPolePage() {
  // No Club hero video on /president — restore via /videos/pole-president.mp4 when ready.
  const visuals = getRoleVisuals("pro_club");
  const accentStyle = poleAccentCssVars("president");

  return (
    <TerminalPage accentStyle={accentStyle}>
      <ImmersivePoleHero
        brand="Pro Day Président"
        headline="Le club en un coup d’œil."
        support="Cockpit, finances et assistant IA. Dirigeants, DS et bureau décident depuis ProDay."
        poster={visuals.hero}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta"
        secondaryHref="#app"
        secondaryLabel="Voir l’app Président"
        perk={POLE_REFERRAL_LINE}
      />

      <PresidentAppHub />

      {/* Section Rentabilité & Économies Dirigeants */}
      <section className="relative border-t border-white/10 bg-[#080704] px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center sm:text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#E8B923]">
              Finances & Gestion club
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.8rem,4.2vw,2.8rem)] font-medium tracking-[-0.03em] text-white">
              Rentabilisez chaque euro investi dans votre club.
            </h2>
            <p className="mt-2 text-sm text-white/55 max-w-xl">
              Estimez les gains de temps pour vos bénévoles, la récupération des cotisations et les économies de covoiturage pour vos familles.
            </p>
          </div>

          <ClubRoiCalculator ctaHref={ROUTES.clubDevis} />
        </div>
      </section>

      <TerminalCta
        title="Décider sans perdre le fil."
        description={`Cockpit dirigeants, alertes et priorités · dans la même app que le club et les coachs. ${POLE_REFERRAL_LINE}`}
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Liste d’attente"
        secondaryHref={CLUB_APP_HREF}
        secondaryLabel="Découvrir le Pôle Club"
      />
    </TerminalPage>
  );
}
