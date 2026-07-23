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
        className="relative isolate min-h-[78vh] overflow-hidden border-t border-white/8"
      >
        <HeroVideoBackground
          sources={["/videos/hero-match.mp4"]}
          poster="/images/football-action-01.jpg"
          opacity={0.7}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/45" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_40%,rgba(0,84,240,0.18),transparent)]" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-4xl flex-col items-center justify-center px-6 py-24 text-center">
          <p className="font-signature text-2xl italic text-[var(--proday-accent)]">
            Une app. Sept pôles.
          </p>
          <h2 className="font-display mt-4 text-[clamp(1.85rem,5.5vw,3.5rem)] font-extrabold uppercase leading-[1.02] tracking-[-0.04em] text-white">
            Le football connecté,
            <br />
            <span className="text-shimmer">sans le bruit.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
            Calendrier, équipe, santé, mercato et partenaires — dans un même geste,
            pensé pour le terrain.
          </p>
          <div className="mt-8">
            <PremiumButton href={ROUTES.betaWaitlist} className="!bg-white !text-black hover:!bg-[var(--proday-accent)] hover:!text-white">
              Rejoindre la bêta
            </PremiumButton>
          </div>
        </div>
      </section>

      <section className="border-t border-white/8 bg-black py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="section-rail mx-auto mb-10 max-w-2xl pl-5 text-left sm:text-center sm:pl-0">
            <p className="font-signature text-2xl italic text-[var(--proday-accent)]">
              Les 7 pôles
            </p>
            <h2 className="font-display mt-2 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white sm:text-4xl">
              Chaque univers, sa signature
            </h2>
            <p className="mt-3 text-sm text-white/45">
              Alignés sur les logos officiels — du terrain amateur au staff pro.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {POLES.map((pole) => {
              const color = POLE_BRAND_HEX[pole.id];
              return (
                <Link
                  key={pole.id}
                  href={pole.href}
                  className="card-premium group relative overflow-hidden rounded-2xl p-5 transition duration-300 hover:-translate-y-1"
                  style={{
                    borderColor: `${color}40`,
                    boxShadow: `0 0 0 1px ${color}18 inset`,
                  }}
                >
                  <div
                    className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-30 blur-2xl transition group-hover:opacity-55"
                    style={{ background: color }}
                    aria-hidden
                  />
                  <div className="relative flex items-start gap-3">
                    <Image
                      src={pole.logo}
                      alt=""
                      width={44}
                      height={44}
                      className="rounded-xl bg-white/95 p-0.5 ring-1 ring-white/20"
                    />
                    <div>
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.2em]"
                        style={{ color }}
                      >
                        {pole.kicker}
                      </p>
                      <p className="font-display mt-1 text-lg font-bold text-white">
                        {POLE_SHORT[pole.id] ?? pole.title}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-white/45">
                        {pole.subtitle}
                      </p>
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
        className="scroll-mt-24 border-t border-white/8 bg-[#030303] py-12 sm:py-16"
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
