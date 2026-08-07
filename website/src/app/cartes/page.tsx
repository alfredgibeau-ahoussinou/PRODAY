import type { Metadata } from "next";
import { ProDayCardsGallery } from "@/components/cards/ProDayCardsGallery";
import { ImmersivePoleHero } from "@/components/poles/immersivePoleExperience";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Cartes ProDay · Passeports numériques",
  description:
    "Identité officielle ProDay — cartes interactives Joueur, Coach, Club, Supporter et Sponsor. Collection, skins FUT et passeports évolutifs.",
};

export default function CartesPage() {
  return (
    <TerminalPage>
      <ImmersivePoleHero
        brand="Pro Day Cartes"
        headline="Ton identité. En carte."
        support="Cinq rôles, une collection vivante — flip, skins et passeports inspirés du football, 100 % ProDay."
        video="/videos/hero-match.mp4"
        poster="/images/football-pro-01.jpg"
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Rejoindre la bêta"
        secondaryHref="#cartes"
        secondaryLabel="Voir la collection"
      />

      <ProDayCardsGallery showSkinPicker passportMode />

      <section className="border-t border-white/10 bg-[#050505] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#FF6A00]">
            Évolution
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.6rem,3.5vw,2.4rem)] font-medium tracking-[-0.03em] text-white">
            Elles évoluent avec toi.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            Matchs, badges, certifications et activité font monter le tier, débloquent des
            éditions (Gold, Elite, Légende…) et mettent à jour stats et recommandations. La
            carte devient le reflet de ton parcours sur ProDay.
          </p>
        </div>
      </section>

      <TerminalCta
        title="Fiers de partager ta carte."
        description="Rejoins la bêta pour porter ton passeport numérique dans l’app — et faire évoluer ta collection saison après saison."
        primaryHref={ROUTES.betaWaitlist}
        primaryLabel="Liste d’attente"
        secondaryHref={ROUTES.demo}
        secondaryLabel="Essayer la démo"
      />
    </TerminalPage>
  );
}
