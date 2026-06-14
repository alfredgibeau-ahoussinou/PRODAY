import Link from "next/link";
import { DownloadSection } from "@/components/home/DownloadSection";
import { ExploreGrid } from "@/components/home/ExploreGrid";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { UniversePromoGrid } from "@/components/home/UniversePromoGrid";
import { HeroSection } from "@/components/HeroSection";
import { PhoneDemo } from "@/components/PhoneDemo";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { FaqAccordion } from "@/components/interactive/FaqAccordion";
import { StatsBar } from "@/components/StatsBar";
import { Reveal } from "@/components/Reveal";
import { WaitlistForm } from "@/components/WaitlistForm";
import { ROUTES } from "@/lib/routes";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <PhoneDemo />
      <StatsBar />
      <ExploreGrid />
      <TestimonialsCarousel />
      <section className="border-t border-neutral-200 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <h2 className="text-2xl font-bold sm:text-3xl">Quiz : votre profil ProDay</h2>
            <p className="mt-4 text-proday-muted">
              3 questions pour être orienté vers le bon univers — Man, Woman ou
              Pro.
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
      <UniversePromoGrid />
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
      <WaitlistForm />
    </>
  );
}
