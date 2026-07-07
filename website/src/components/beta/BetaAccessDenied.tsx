import Link from "next/link";
import { Mail } from "lucide-react";
import { ROUTES } from "@/lib/routes";

export function BetaAccessDenied() {
  return (
    <section className="flex min-h-[60vh] items-center bg-black py-20">
      <div className="mx-auto max-w-lg px-4 text-center sm:px-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          <Mail className="text-[var(--proday-accent)]" size={28} />
        </div>
        <h1 className="font-display mt-6 text-3xl font-bold text-white">
          Accéder à la bêta
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Ouvrez l&apos;email de bienvenue ProDay et cliquez sur{" "}
          <span className="font-semibold text-white/80">Accéder à la bêta</span> pour ouvrir votre
          espace.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href={ROUTES.home}
            className="text-sm font-medium text-white/50 underline hover:text-white/80"
          >
            Retour à l&apos;accueil
          </Link>
          <a
            href="mailto:support@proday.app"
            className="text-xs text-white/35 underline hover:text-white/55"
          >
            support@proday.app
          </a>
        </div>
      </div>
    </section>
  );
}
