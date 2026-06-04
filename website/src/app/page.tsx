import Link from "next/link";
import { DownloadSection } from "@/components/home/DownloadSection";
import { ExploreGrid } from "@/components/home/ExploreGrid";
import { HomeTeaser } from "@/components/home/HomeTeaser";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { WomanPromoBanner } from "@/components/home/WomanPromoBanner";
import { HeroSection } from "@/components/HeroSection";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { ModuleExplorer } from "@/components/ModuleExplorer";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { FaqAccordion } from "@/components/interactive/FaqAccordion";
import { StatsBar } from "@/components/StatsBar";
import { Reveal } from "@/components/Reveal";
import { BETA_PITCH } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <StatsBar />
      <ExploreGrid />
      <TestimonialsCarousel />
      <HomeTeaser
        title="Les quatre modules de votre saison"
        description="Mercato, Matchs, Arena et Pulse — explorez chaque pilier avec des visuels et des descriptions détaillées."
        href={ROUTES.features}
        cta="Voir toutes les fonctionnalités"
      >
        <ModuleExplorer compact />
      </HomeTeaser>
      <section className="border-t border-neutral-200 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-2xl font-bold sm:text-3xl">Quiz : votre profil ProDay</h2>
            <p className="mt-4 text-proday-muted">
              3 questions pour être orienté vers le bon parcours — joueur, coach,
              Woman, club…
            </p>
            <Link
              href={ROUTES.quiz}
              className="mt-4 inline-block text-sm font-semibold underline"
            >
              Quiz complet →
            </Link>
          </Reveal>
          <RoleQuiz compact />
        </div>
      </section>
      <WomanPromoBanner />
      <section className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <Reveal>
            <h2 className="text-center text-2xl font-bold">Questions fréquentes</h2>
            <Link
              href={ROUTES.faq}
              className="mt-2 block text-center text-sm text-proday-muted hover:text-proday-ink"
            >
              Voir toute la FAQ →
            </Link>
          </Reveal>
          <div className="mt-10">
            <FaqAccordion limit={4} />
          </div>
        </div>
      </section>
      <DownloadSection />
      <section className="bg-neutral-900 py-16 text-center text-white">
        <p className="text-sm tracking-widest text-neutral-400">PRÊT À COMMENCER ?</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          Rejoignez la bêta ProDay
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-neutral-400">
          {BETA_PITCH.dailyUpdates}
        </p>
        <Link
          href={ROUTES.beta}
          className="mt-8 inline-block rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-100"
        >
          S&apos;inscrire à la beta
        </Link>
      </section>
    </>
  );
}
