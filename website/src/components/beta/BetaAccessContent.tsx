import { Apple, ExternalLink, Mail, MessageSquare, Play, Smartphone } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import type { BetaAccessSession } from "@/lib/betaAccess";
import { ROUTES } from "@/lib/routes";

type BetaAccessContentProps = {
  session: BetaAccessSession;
};

export function BetaAccessContent({ session }: BetaAccessContentProps) {
  return (
    <>
      <PageHeader
        pathname={ROUTES.beta}
        kicker="Espace bêta"
        title="Bienvenue, beta-testeur"
        description={`Vous êtes inscrit en tant que ${session.roleLabel}. Cette page est réservée aux personnes invitées par email.`}
        dark
      />

      <section className="bg-black py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c0c12] via-[#0a0a0f] to-[#030303] p-8">
              <Smartphone className="text-[var(--proday-accent)]" size={28} />
              <h2 className="font-display mt-4 text-xl font-bold uppercase tracking-wide text-white">
                Télécharger l&apos;app
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Les liens store arrivent par email (TestFlight iOS, APK ou piste interne Android).
                En attendant, explorez le site et les démos interactives.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-60">
                  <Apple size={20} className="text-white" />
                  <span className="text-sm text-white">
                    <span className="block text-xs text-white/40">Invitation à venir</span>
                    App Store / TestFlight
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 opacity-60">
                  <Play size={20} className="text-white" />
                  <span className="text-sm text-white">
                    <span className="block text-xs text-white/40">Invitation à venir</span>
                    Google Play / APK interne
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-cyan-500/20 bg-cyan-950/20 p-8">
              <MessageSquare className="text-[var(--proday-accent)]" size={28} />
              <h2 className="font-display mt-4 text-xl font-bold uppercase tracking-wide text-white">
                Vos retours comptent
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Bug, idée ou retour UX : écrivez-nous avec votre profil ({session.roleLabel}) et une
                capture si possible. Nous lisons chaque message avant le lancement public.
              </p>
              <a
                href={`mailto:support@proday.app?subject=${encodeURIComponent("Retour bêta ProDay")}&body=${encodeURIComponent(`Email bêta : ${session.email}\nProfil : ${session.roleLabel}\n\n`)}`}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--proday-accent)] px-6 py-3 text-sm font-bold text-black transition hover:bg-cyan-300"
              >
                <Mail size={16} />
                Envoyer un retour
              </a>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
                En attendant l&apos;app
              </p>
              <p className="mt-2 max-w-xl text-sm text-white/65">
                Démo interactive, Mercato, Pulse, feuille de route et les quatre pôles sur proday75.fr.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-0">
              <PremiumButton href={ROUTES.demo}>Démo interactive</PremiumButton>
              <Link
                href={ROUTES.home}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
              >
                proday75.fr
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-white/35">
            Connecté en tant que {session.email}. Ce lien personnel ne doit pas être partagé.
          </p>
        </div>
      </section>
    </>
  );
}
