import Link from "next/link";
import { ScrollVideoStage, UniverseScroll } from "@/components/immersive";
import { ProductPositioning } from "@/components/home/ProductPositioning";
import { HomeHeroPreload } from "@/components/home/HomeHeroPreload";
import { FormAnalysisFeature } from "@/components/poles/FormAnalysisFeature";
import { CommercialBadges } from "@/components/pricing/CommercialBadges";
import { ROUTES } from "@/lib/routes";

export default function HomePage() {
  return (
    <>
      <HomeHeroPreload />
      <ScrollVideoStage />
      <UniverseScroll />

      <ProductPositioning />

      <FormAnalysisFeature audience="all" />

      <section className="bg-accent-gradient py-20 text-white sm:py-24">
        <div className="mx-auto flex max-w-4xl flex-col gap-10 px-5 sm:px-8">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/50">
              ProDay
            </p>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
              Tout votre club. Un seul endroit.
            </h2>
            <p className="mt-2 font-display text-xl font-medium text-amber-300 sm:text-2xl">
              Moins d&apos;administration. Plus de football.
            </p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              Une plateforme unifiée par rôle · Club, Coach, Joueur, Parent,
              Supporter, Sponsor · reliée en temps réel.
            </p>
            <p className="mt-3 text-sm font-semibold text-white/90">
              Club : à partir de 3 € / adhérent · sur devis selon la taille.
            </p>
            <div className="mt-5">
              <CommercialBadges size="md" align="left" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Résiliation libre à tout moment sur les stores.{" "}
              <Link
                href={ROUTES.sponsor}
                className="font-semibold text-amber-300 underline-offset-2 hover:underline"
              >
                Sponsoring possible
              </Link>{" "}
              pour les marques et commerces locaux.
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
            <Link
              href={ROUTES.sponsor}
              className="inline-flex items-center rounded-full border border-white/40 px-7 py-3.5 text-[12px] font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-white/10"
            >
              Je suis sponsor
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
