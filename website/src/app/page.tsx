import Image from "next/image";
import { HeroSection } from "@/components/HeroSection";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { WaitlistForm } from "@/components/WaitlistForm";

export default function HomePage() {
  return (
    <>
      <HeroSection />

      <section
        aria-label="Atmosphère produit"
        className="relative isolate min-h-[70vh] overflow-hidden border-t border-white/8"
      >
        <Image
          src="/images/football-stadium-night-01.jpg"
          alt=""
          fill
          className="object-cover object-[center_35%] opacity-55"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(34,211,238,0.08),transparent)]" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--proday-accent)]">
            Une app. Sept pôles.
          </p>
          <h2 className="font-display mt-5 text-[clamp(1.75rem,5vw,3.25rem)] font-bold uppercase leading-[1.05] tracking-[-0.02em] text-white">
            Le football connecté,
            <br />
            <span className="text-[var(--proday-accent)]">sans le bruit.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
            Calendrier, équipe, santé, mercato et partenaires — dans un même geste,
            pensé pour le terrain.
          </p>
        </div>
      </section>

      <section
        id="decouvrir"
        className="scroll-mt-24 border-t border-white/8 bg-black py-12 sm:py-16"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="section-header-centered mx-auto mb-8 max-w-lg">
            <p className="kicker-flash text-xs font-bold uppercase tracking-[0.28em]">
              Interactif
            </p>
            <h2 className="font-display mt-2 text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Quel pôle vous correspond ?
            </h2>
            <p className="mt-2 text-sm text-white/55">3 questions — réponse immédiate.</p>
          </div>
          <div className="card-premium rounded-2xl p-1 sm:p-2">
            <RoleQuiz inline />
          </div>
        </div>
      </section>

      <section className="gradient-mesh border-t border-white/8">
        <WaitlistForm minimal />
      </section>
    </>
  );
}
