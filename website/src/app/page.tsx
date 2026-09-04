import Link from "next/link";
import { ProDayEliteHero } from "@/components/home/ProDayEliteHero";
import { ProDayVersusMatrix } from "@/components/home/ProDayVersusMatrix";
import { EliteInteractiveShowcase } from "@/components/home/EliteInteractiveShowcase";
import { ClubSavingsSimulator } from "@/components/home/ClubSavingsSimulator";
import { EliteTestimonials } from "@/components/home/EliteTestimonials";
import { CommercialBadges } from "@/components/pricing/CommercialBadges";
import { Zap, Shield, ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#06090E] text-white selection:bg-[#00E676] selection:text-black">
      {/* 1. New High-Impact Hero with Multi-Role Interactive App Mockup */}
      <ProDayEliteHero />

      {/* 2. Direct Head-to-Head Comparison vs SportEasy & MyCoach FFF */}
      <ProDayVersusMatrix />

      {/* 3. Interactive Live Demos (Tactical Board & FUT 3D Card Generator) */}
      <EliteInteractiveShowcase />

      {/* 4. Club Savings & Time Simulator */}
      <ClubSavingsSimulator />

      {/* 5. Real Club & Coach Testimonials */}
      <EliteTestimonials />

      {/* 6. High-Conversion Final CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#090D16] to-[#04060A] py-24 sm:py-32 border-t border-slate-800">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00E676]/10 via-transparent to-transparent blur-2xl" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00E676]/30 bg-[#00E676]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#00E676]">
            <Zap className="h-3.5 w-3.5 fill-[#00E676]" />
            PRÊT POUR LE COUP D&apos;ENVOI ?
          </div>

          <h2 className="mt-6 font-display text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Offrez à votre club l&apos;infrastructure qu&apos;il mérite.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-300 sm:text-lg">
            Rejoignez plus de 500 clubs et 25 000 licenciés qui ont simplifié leur saison. 
            Démarrez votre essai gratuit de 30 jours, sans engagement et sans carte bancaire.
          </p>

          <div className="mt-8 flex justify-center">
            <CommercialBadges size="md" align="center" />
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={ROUTES.proClub}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E676] to-[#00C853] px-9 py-4 text-base font-bold text-black shadow-xl shadow-[#00E676]/25 transition hover:scale-[1.02] active:scale-[0.99]"
            >
              <Zap className="h-5 w-5 fill-black" />
              Créer mon Club Gratuitement
            </Link>

            <Link
              href={ROUTES.pricing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-8 py-4 text-base font-semibold text-white transition hover:bg-slate-800"
            >
              Voir les Formules & Tarifs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Installation instantanée · Import de vos données Excel ou SportEasy assisté par nos équipes en 48h.
          </p>
        </div>
      </section>
    </main>
  );
}
