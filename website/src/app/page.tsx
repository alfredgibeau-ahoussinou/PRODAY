import Image from "next/image";
import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";
import { HeroVideoBackground } from "@/components/HeroVideoBackground";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { POLES, POLE_BRAND_HEX } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";

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
        aria-label="Atmosphère produit"
        className="relative isolate min-h-[70vh] overflow-hidden"
      >
        <HeroVideoBackground
          sources={["/videos/hero-match.mp4"]}
          poster="/images/football-action-01.jpg"
          opacity={0.65}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/40" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-6 py-24 lg:px-8">
          <p className="font-signature text-3xl italic text-[var(--proday-accent)]">
            Une app. Sept univers.
          </p>
          <h2 className="font-display mt-3 max-w-2xl text-[clamp(2rem,5vw,3.75rem)] font-extrabold uppercase leading-[1.02] tracking-[-0.04em] text-white">
            Le football connecté,
            <br />
            sans le bruit.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">
            Calendrier, équipe, santé, mercato et partenaires — dans un même geste,
            pensé pour le terrain.
          </p>
          <div className="mt-8">
            <PremiumButton
              href={ROUTES.betaWaitlist}
              className="!bg-white !text-black hover:!bg-[var(--proday-accent)] hover:!text-white"
            >
              Rejoindre la bêta
            </PremiumButton>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#070709] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-signature text-2xl italic text-[var(--proday-accent)]">
                Les 7 pôles
              </p>
              <h2 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white sm:text-4xl">
                Choisis ton terrain
              </h2>
            </div>
            <p className="max-w-sm text-sm text-white/40">
              Chaque univers reprend la couleur exacte de son logo officiel.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {POLES.map((pole, index) => {
              const color = POLE_BRAND_HEX[pole.id];
              const num = String(index + 1).padStart(2, "0");
              return (
                <Link
                  key={pole.id}
                  href={pole.href}
                  className="group relative flex min-h-[140px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-1 hover:border-white/20"
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ background: color }}
                    aria-hidden
                  />
                  <div
                    className="absolute -right-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full opacity-20 blur-3xl transition group-hover:opacity-40"
                    style={{ background: color }}
                    aria-hidden
                  />
                  <div className="relative flex flex-1 items-center gap-5 p-5 sm:p-6">
                    <span
                      className="font-display text-3xl font-extrabold tabular-nums sm:text-4xl"
                      style={{ color }}
                    >
                      {num}
                    </span>
                    <Image
                      src={pole.logo}
                      alt=""
                      width={52}
                      height={52}
                      className="rounded-xl bg-white p-1 shadow-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{ color }}
                      >
                        {pole.kicker}
                      </p>
                      <p className="font-display mt-1 text-xl font-bold text-white">
                        {POLE_SHORT[pole.id] ?? pole.title}
                      </p>
                      <p className="mt-1 text-sm text-white/45">{pole.subtitle}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="decouvrir"
        className="scroll-mt-28 bg-black py-16 sm:py-20"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="font-signature text-2xl italic text-[var(--proday-accent)]">
              Interactif
            </p>
            <h2 className="font-display mt-2 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white">
              Quel pôle vous correspond ?
            </h2>
            <p className="mt-2 text-sm text-white/50">3 questions — réponse immédiate.</p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c10] p-2 sm:p-4">
            <RoleQuiz inline />
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#050507]">
        <WaitlistForm minimal />
      </section>
    </>
  );
}
