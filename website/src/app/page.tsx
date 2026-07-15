import { HeroSection } from "@/components/HeroSection";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { WaitlistForm } from "@/components/WaitlistForm";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <section
        id="decouvrir"
        className="scroll-mt-24 border-t border-white/8 bg-black py-8 sm:py-10"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto mb-6 max-w-lg text-center">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--proday-accent)]">
              Interactif
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
              Quel pôle vous correspond ?
            </h2>
            <p className="mt-2 text-sm text-white/55">3 questions — réponse immédiate.</p>
          </div>
          <RoleQuiz inline />
        </div>
      </section>
      <WaitlistForm minimal />
    </>
  );
}
