import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Download,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { BetaPageFrame, SectionKicker } from "@/components/beta/BetaSiteShell";
import type { BetaAccessSession } from "@/lib/betaAccess";
import { getBetaTimeline } from "@/lib/betaContent";
import { ROUTES } from "@/lib/routes";

const HUB_CARDS = [
  {
    href: ROUTES.betaProgramme,
    icon: BookOpen,
    title: "Programme",
    description: "Calendrier, sept pôles et modules à tester selon votre profil.",
  },
  {
    href: ROUTES.betaInstaller,
    icon: Download,
    title: "Installer l'app",
    description: "Guides pas à pas Android (APK) et iOS (TestFlight), avec dépannage.",
  },
  {
    href: ROUTES.betaAide,
    icon: HelpCircle,
    title: "Aide & retours",
    description: "FAQ bêta, contact support et envoi de feedback produit.",
  },
] as const;

type BetaHubContentProps = {
  session: BetaAccessSession;
};

export function BetaHubContent({ session }: BetaHubContentProps) {
  const timeline = getBetaTimeline();

  return (
    <BetaPageFrame
      pathname={ROUTES.beta}
      kicker="Programme bêta"
      title="Bienvenue dans la bêta ProDay"
      description={`Vous êtes inscrit en tant que ${session.roleLabel}. Ce hub regroupe tout ce dont vous avez besoin : programme, installation et support.`}
    >
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <SectionKicker>Votre espace beta-testeur</SectionKicker>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/65">
          Merci de faire partie des premiers à tester ProDay. Ouvrez les sept pôles, téléchargez
          l&apos;APK Android depuis l&apos;onglet Installer et envoyez vos retours. Chaque message
          est lu par l&apos;équipe produit avant le lancement public.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Sparkles, label: "Avant le public", detail: "Builds iOS et Android avant le lancement" },
            { icon: BookOpen, label: "Guides d'installation", detail: "Programme, APK et FAQ au même endroit" },
            { icon: MessageSquare, label: "Envoyez un retour", detail: "Bugs et idées lus avant le lancement" },
          ].map(({ icon: Icon, label, detail }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4"
            >
              <Icon className="text-[var(--proday-accent)]" size={20} />
              <p className="mt-2 text-sm font-semibold text-white">{label}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">{detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {HUB_CARDS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-[var(--proday-accent)]/40 hover:bg-white/[0.05]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <Icon className="text-[var(--proday-accent)]" size={22} />
            </div>
            <h2 className="font-display mt-4 text-lg font-bold uppercase tracking-wide text-white group-hover:text-[#93c5fd]">
              {title}
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">{description}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--proday-accent)]">
              Accéder
              <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <SectionKicker>Où en est la bêta ?</SectionKicker>
        <ol className="mt-6 space-y-5">
          {timeline.map(({ step, title, description, done }) => (
            <li key={step} className="flex gap-4">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  done
                    ? "bg-[var(--proday-accent)] text-black"
                    : "border border-white/15 bg-white/5 text-white/50"
                }`}
              >
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/55">{description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:flex sm:items-center sm:justify-between sm:gap-6">
        <div>
          <SectionKicker>En attendant l&apos;app</SectionKicker>
          <p className="mt-2 max-w-xl text-sm text-white/65">
            Démo interactive, Mercato, Visibilité, feuille de route et les sept pôles sur proday75.fr.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3 sm:mt-0">
          <PremiumButton href={ROUTES.demo}>Démo interactive</PremiumButton>
          <Link
            href={ROUTES.roadmap}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Feuille de route
          </Link>
          <Link
            href={ROUTES.home}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            proday75.fr
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>
    </BetaPageFrame>
  );
}
