import Link from "next/link";
import { ScrollVideoStage, UniverseScroll } from "@/components/immersive";
import { FormAnalysisFeature } from "@/components/poles/FormAnalysisFeature";
import { ROUTES } from "@/lib/routes";

export default function HomePage() {
  return (
    <>
      <ScrollVideoStage />
      <UniverseScroll />

      <FormAnalysisFeature audience="all" />

      <section className="bg-accent-gradient py-20 text-white sm:py-24">
        <div className="mx-auto flex max-w-4xl flex-col gap-10 px-5 sm:px-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">
              ProDay
            </p>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
              Le quotidien digital du football amateur.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              Club → gère. Coach → entraîne et analyse la forme de l’effectif.
              Joueur → suit sa forme et sa progression. Président → pilote depuis
              le Pôle Club.
            </p>
            <p className="mt-3 text-sm font-semibold text-white/90">
              Club : à partir de 3 € / adhérent — sur devis selon la taille.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.proClub}
              className="inline-flex items-center rounded-full bg-black px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#050A30]"
            >
              Créer mon club
            </Link>
            <Link
              href={ROUTES.joueur}
              className="inline-flex items-center rounded-full border border-white/40 px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
            >
              Je suis joueur
            </Link>
            <Link
              href={`${ROUTES.coach}#analyse-de-forme`}
              className="inline-flex items-center rounded-full border border-white/40 px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
            >
              Je suis coach
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
