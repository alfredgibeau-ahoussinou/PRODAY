import Link from "next/link";
import { Lock } from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ROUTES } from "@/lib/routes";

export function BetaAccessDenied() {
  return (
    <section className="flex min-h-[60vh] items-center bg-black py-20">
      <div className="mx-auto max-w-lg px-4 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Lock className="text-[var(--proday-accent)]" size={28} />
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
          Accès réservé
        </p>
        <h1 className="font-display mt-3 text-3xl font-bold text-white">
          Espace bêta privé
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Cette page est réservée aux beta-testeurs invités par email. Utilisez le lien personnel
          reçu après votre inscription (avec le paramètre{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/80">?token=</code>
          ).
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <PremiumButton href={ROUTES.betaWaitlist}>
            Rejoindre la liste d&apos;attente
          </PremiumButton>
          <Link
            href={ROUTES.home}
            className="text-sm font-medium text-white/50 underline hover:text-white/80"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </section>
  );
}
