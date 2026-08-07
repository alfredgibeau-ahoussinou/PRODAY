import Link from "next/link";
import { ScrollVideoStage, UniverseScroll } from "@/components/immersive";
import { ROUTES } from "@/lib/routes";

export default function HomePage() {
  return (
    <>
      <ScrollVideoStage />
      <UniverseScroll />

      <section className="bg-accent-gradient py-20 text-white sm:py-24">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-10 px-5 sm:flex-row sm:items-end sm:px-8">
          <h2 className="max-w-md font-display text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
            Commencer prend 30 secondes.
          </h2>
          <Link
            href={ROUTES.betaWaitlist}
            className="inline-flex items-center rounded-full bg-black px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#050A30]"
          >
            Commencer
          </Link>
        </div>
      </section>
    </>
  );
}
