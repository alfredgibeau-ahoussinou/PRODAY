import Image from "next/image";
import Link from "next/link";
import { HeroSection } from "@/components/HeroSection";
import { RoleQuiz } from "@/components/interactive/RoleQuiz";
import { WaitlistForm } from "@/components/WaitlistForm";
import { POLES, POLE_BRAND_HEX } from "@/lib/poles";

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

      <section className="border-y border-white/10 bg-[#070709] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10">
            <p className="font-signature text-2xl italic text-[var(--proday-accent)]">
              Les 7 pôles
            </p>
            <h2 className="font-display mt-1 text-3xl font-extrabold uppercase tracking-[-0.03em] text-white sm:text-4xl">
              Choisissez votre pôle
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {POLES.map((pole, index) => {
              const color = POLE_BRAND_HEX[pole.id];
              const num = String(index + 1).padStart(2, "0");
              return (
                <Link
                  key={pole.id}
                  href={pole.href}
                  className="group relative flex min-h-[120px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition duration-300 hover:-translate-y-0.5 hover:border-white/20"
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1.5"
                    style={{ background: color }}
                    aria-hidden
                  />
                  <div className="relative flex flex-1 items-center gap-4 p-5 sm:p-6">
                    <span
                      className="font-display text-3xl font-extrabold tabular-nums sm:text-4xl"
                      style={{ color }}
                    >
                      {num}
                    </span>
                    <Image
                      src={pole.logo}
                      alt=""
                      width={48}
                      height={48}
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
        className="scroll-mt-28 bg-black py-14 sm:py-16"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="font-display text-3xl font-extrabold uppercase tracking-[-0.03em] text-white">
              Quel pôle vous correspond ?
            </h2>
            <p className="mt-2 text-sm text-white/50">3 questions. Réponse directe.</p>
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
