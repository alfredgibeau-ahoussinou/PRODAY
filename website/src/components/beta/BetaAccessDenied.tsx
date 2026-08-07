import Link from "next/link";
import { Mail } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export function BetaAccessDenied() {
  return (
    <section className="flex min-h-[60vh] items-center bg-black py-20">
      <div className="mx-auto max-w-lg px-4 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-transparent">
          <Mail className="text-[var(--proday-accent-bright)]" size={28} />
        </div>
        <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--proday-accent-bright)]">
          Accès bêta
        </p>
        <h1 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-medium tracking-[-0.03em] text-white">
          Accéder à la bêta
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/55">
          L&apos;espace bêta (programme, installateur, aide) s&apos;ouvre avec le
          lien de ton email d&apos;approbation. Clique sur{" "}
          <span className="font-medium text-white/80">Accéder à la bêta</span>{" "}
          dans ce mail.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={ROUTES.betaWaitlist}
            className="bg-accent-gradient inline-flex min-h-11 items-center justify-center rounded-full px-7 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:brightness-110"
          >
            Liste d&apos;attente
          </Link>
          <Link
            href={ROUTES.home}
            className="text-sm font-medium text-white/50 underline hover:text-white/80"
          >
            Retour à l&apos;accueil
          </Link>
          <a
            href="mailto:proday.admin@gmail.com"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35 underline hover:text-white/55"
          >
            proday.admin@gmail.com
          </a>
        </div>
      </div>
    </section>
  );
}
