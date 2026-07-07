import Link from "next/link";
import { ChevronDown, Mail, MessageSquare } from "lucide-react";
import {
  BetaPageFrame,
  SectionKicker,
  buildBetaFeedbackMailto,
} from "@/components/beta/BetaSiteShell";
import type { BetaAccessSession } from "@/lib/betaAccess";
import { BETA_FAQ } from "@/lib/betaContent";
import { ROUTES } from "@/lib/routes";

type BetaAideContentProps = {
  session: BetaAccessSession;
};

export function BetaAideContent({ session }: BetaAideContentProps) {
  const feedbackMailto = buildBetaFeedbackMailto(session);

  return (
    <BetaPageFrame
      pathname={ROUTES.betaAide}
      kicker="Aide bêta"
      title="FAQ, support et retours"
      description="Réponses aux questions fréquentes, contact support et envoi de feedback produit."
    >
      <div className="rounded-3xl border border-cyan-500/20 bg-cyan-950/20 p-8">
        <MessageSquare className="text-[var(--proday-accent)]" size={28} />
        <h2 className="font-display mt-4 text-xl font-bold uppercase tracking-wide text-white">
          Envoyer un retour
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
          Bug bloquant, idée de fonctionnalité ou retour UX : écrivez-nous avec votre profil (
          {session.roleLabel}), la version testée et une capture d&apos;écran si possible. Nous
          lisons chaque message avant le lancement public.
        </p>
        <a
          href={feedbackMailto}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--proday-accent)] px-6 py-3 text-sm font-bold text-black transition hover:bg-cyan-300"
        >
          <Mail size={16} />
          Envoyer un retour
        </a>
        <p className="mt-4 text-xs text-white/35">
          Ou répondez directement à l&apos;email de bienvenue bêta ·{" "}
          <a href="mailto:support@proday.app" className="underline hover:text-white/55">
            support@proday.app
          </a>
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <SectionKicker>Questions fréquentes</SectionKicker>
        <div className="mt-6 divide-y divide-white/10">
          {BETA_FAQ.map(({ question, answer }) => (
            <details key={question} className="group py-4 first:pt-0 last:pb-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-white marker:content-none">
                {question}
                <ChevronDown
                  size={18}
                  className="shrink-0 text-white/40 transition group-open:rotate-180"
                />
              </summary>
              <p className="mt-3 pr-8 text-sm leading-relaxed text-white/55">{answer}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <SectionKicker>Installation</SectionKicker>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            Problème avec l&apos;APK Android ou TestFlight iOS ? Consultez le guide détaillé avec
            dépannage pas à pas.
          </p>
          <Link
            href={ROUTES.betaInstaller}
            className="mt-4 inline-flex text-sm font-semibold text-[var(--proday-accent)] hover:text-cyan-300"
          >
            Guide d&apos;installation →
          </Link>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <SectionKicker>Programme</SectionKicker>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            Calendrier, six pôles et modules à tester selon votre profil beta-testeur.
          </p>
          <Link
            href={ROUTES.betaProgramme}
            className="mt-4 inline-flex text-sm font-semibold text-[var(--proday-accent)] hover:text-cyan-300"
          >
            Voir le programme →
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <SectionKicker>Contact support</SectionKicker>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Pour toute question non couverte par la FAQ, écrivez à{" "}
          <a href="mailto:support@proday.app" className="text-[var(--proday-accent)] underline">
            support@proday.app
          </a>{" "}
          depuis l&apos;adresse <span className="font-semibold text-white">{session.email}</span>{" "}
          afin que nous puissions retrouver votre inscription.
        </p>
        <p className="mt-3 text-xs text-white/35">
          Délai de réponse habituel : 24 à 48 h ouvrées pendant la phase bêta.
        </p>
      </div>
    </BetaPageFrame>
  );
}
