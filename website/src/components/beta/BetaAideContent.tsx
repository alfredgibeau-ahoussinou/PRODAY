import Link from "next/link";
import { ChevronDown } from "lucide-react";
import {
  BetaPageFrame,
  SectionKicker,
} from "@/components/beta/BetaSiteShell";
import { BetaFeedbackForm } from "@/components/beta/BetaFeedbackForm";
import type { BetaAccessSession } from "@/lib/betaAccess";
import { BETA_FAQ } from "@/lib/betaContent";
import { ROUTES } from "@/lib/routes";

type BetaAideContentProps = {
  session: BetaAccessSession;
};

export function BetaAideContent({ session }: BetaAideContentProps) {
  return (
    <BetaPageFrame
      pathname={ROUTES.betaAide}
      kicker="Aide bêta"
      title="FAQ, support et retours"
      description="Réponses aux questions fréquentes, contact support et envoi de feedback produit."
    >
      <BetaFeedbackForm session={session} />

      <div className="mt-8 border border-white/10 bg-transparent p-8">
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
        <div className="border border-white/10 bg-transparent p-6">
          <SectionKicker>Installation</SectionKicker>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            Problème avec l&apos;APK Android ou TestFlight iOS ? Consultez le guide détaillé avec
            dépannage pas à pas.
          </p>
          <Link
            href={ROUTES.betaInstaller}
            className="mt-4 inline-flex text-sm font-semibold text-[var(--proday-accent)] hover:text-[#F5D04A]"
          >
            Guide d&apos;installation →
          </Link>
        </div>
        <div className="border border-white/10 bg-transparent p-6">
          <SectionKicker>Programme</SectionKicker>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            Calendrier, cinq pôles et modules à tester selon votre profil beta testeur.
          </p>
          <Link
            href={ROUTES.betaProgramme}
            className="mt-4 inline-flex text-sm font-semibold text-[var(--proday-accent)] hover:text-[#F5D04A]"
          >
            Voir le programme →
          </Link>
        </div>
      </div>

      <div className="mt-8 border border-white/10 bg-transparent p-8">
        <SectionKicker>Contact support</SectionKicker>
        <p className="mt-4 text-sm leading-relaxed text-white/60">
          Pour toute question non couverte par la FAQ, écrivez à{" "}
          <a href="mailto:proday.admin@gmail.com" className="text-[var(--proday-accent)] underline">
            proday.admin@gmail.com
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
