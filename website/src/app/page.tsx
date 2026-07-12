import { HeroSection } from "@/components/HeroSection";
import { MarqueeStrip } from "@/components/MarqueeStrip";
import { PhoneDemo } from "@/components/PhoneDemo";
import { DemoDisclaimer } from "@/components/demo/DemoDisclaimer";
import { StatsBar } from "@/components/StatsBar";
import { FeaturesBento } from "@/components/FeaturesBento";
import { SpotlightGrid } from "@/components/home/SpotlightGrid";
import { ExploreGrid } from "@/components/home/ExploreGrid";
import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { PolesHubGrid } from "@/components/home/PolesHubGrid";
import { DownloadSection } from "@/components/home/DownloadSection";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FaqAccordion } from "@/components/interactive/FaqAccordion";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { Section } from "@/components/ui/Section";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <MarqueeStrip />
      <SpotlightGrid />
      <div className="bg-black">
        <div className="mx-auto max-w-6xl px-4 pb-4 pt-8 sm:px-6">
          <DemoDisclaimer />
        </div>
        <PhoneDemo />
      </div>
      <StatsBar />
      <FeaturesBento />
      <PolesHubGrid />
      <ExploreGrid />
      <TestimonialsCarousel />
      <Section
        id="quiz"
        kicker="QUIZ"
        title="Quel pôle ProDay vous correspond ?"
        description="3 questions — découvrez votre pôle : Joueur, Pro, Santé ou Partenaires."
        className="border-t border-[var(--proday-accent)]/10"
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <PremiumButton href={ROUTES.quiz} variant="outline">
              Parcours guidé
            </PremiumButton>
          </div>
          <div className="card-flash rounded-2xl p-6">
            <RoleQuiz compact />
          </div>
        </div>
      </Section>
      <Section
        id="faq"
        kicker="FAQ"
        title="Questions fréquentes"
        description="Tarifs, partenaires, Reels et lancement — les réponses essentielles."
        className="bg-neutral-950"
      >
        <FaqAccordion limit={5} variant="dark" />
        <Link
          href={ROUTES.faq}
          className="mt-8 inline-block text-sm font-semibold text-[var(--proday-accent)] transition hover:text-cyan-300"
        >
          Voir toute la FAQ
        </Link>
      </Section>
      <DownloadSection />
      <WaitlistForm />
    </>
  );
}
