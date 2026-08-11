import type { Metadata } from "next";
import { FaqAccordion } from "@/components/interactive/FaqAccordion";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import {
  TerminalCta,
  TerminalPage,
  TerminalValue,
} from "@/components/terminal";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Questions fréquentes ProDay : cinq pôles (Joueur, Club, Coach, Supporter, Sponsor), tarifs et bêta.",
};

export default function FaqPage() {
  const visuals = getRoleVisuals("faq");

  return (
    <TerminalPage>
      <ImmersivePoleHero
        brand="Pro Day FAQ"
        headline="Avant d’entrer."
        support="Tarifs, pôles, Tactique IA, rôles intégrés. Les réponses les plus demandées : filtrées par thème."
        video={visuals.heroVideo}
        poster={visuals.hero}
        primaryHref="#reponses"
        primaryLabel="Voir les réponses"
        secondaryHref={ROUTES.demo}
        secondaryLabel="Essayer la démo"
      />

      <section
        id="reponses"
        className="scroll-mt-24 border-t border-white/10 bg-black px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#4C8BFF]">
            Réponses
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-medium tracking-[-0.03em] text-white">
            Ce que les équipes demandent
          </h2>
          <p className="mt-3 text-sm text-white/55">
            Filtrez par pôle ou par sujet. Une autre question ? Passez par la liste d’attente.
          </p>
          <div className="mt-10">
            <FaqAccordion />
          </div>
        </div>
      </section>

      <TerminalValue
        title="Ensuite, choisis ta porte."
        pillars={[
          {
            metric: "Démo",
            title: "Sans compte",
            body: "Navigue dans l’app interactive.",
          },
          {
            metric: "Tarifs",
            title: "Par pôle",
            body: "Joueur, Club, Coach, Supporter, Sponsor.",
          },
          {
            metric: "Bêta",
            title: "Liste d’attente",
            body: "On te rappelle pour ton rôle.",
          },
        ]}
      />

      <TerminalCta
        title="Une autre question ?"
        description="Écris-nous via la liste d’attente."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Nous contacter"
        secondaryHref={ROUTES.demo}
        secondaryLabel="Voir la démo"
      />
    </TerminalPage>
  );
}
