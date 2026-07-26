import Image from "next/image";
import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { WaitlistForm } from "@/components/WaitlistForm";
import { OnboardingPriorityQuestion } from "@/components/home/OnboardingPriorityQuestion";
import { POLES, POLE_BRAND_HEX } from "@/lib/poles";
import { Testimonials } from "@/components/Testimonials";

const POLE_SHORT: Record<string, string> = {
  amateur: "Amateur",
  supporter: "Supporter",
  sante: "Santé",
  pro_joueur: "Pro Joueur",
  pro_club: "Pro Club",
  pro_staff: "Pro Staff",
  sponsor: "Partenaires",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <section
        id="decouvrir"
        className="scroll-mt-28 bg-black py-14 sm:py-16"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-[-0.03em] text-white">
              Quel pôle vous correspond ?
            </h2>
            <p className="mt-2 text-sm text-white/50">5 questions. Réponse directe.</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c10] p-2 sm:p-4">
            <RoleQuiz inline />
          </div>
        </div>
      </section>

      <Testimonials />

      <section className="border-t border-white/10 bg-[#050507]">
        <WaitlistForm minimal />
      </section>
    </>
  );
}
