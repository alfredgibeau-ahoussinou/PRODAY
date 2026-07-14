import Link from "next/link";
import { Sparkles, Smartphone } from "lucide-react";
import { BetaPageFrame, SectionKicker } from "@/components/beta/BetaSiteShell";
import type { BetaAccessSession } from "@/lib/betaAccess";
import {
  BETA_APK_AVAILABLE,
  BETA_FEATURES,
  getBetaCurrentStep,
  getBetaTimeline,
} from "@/lib/betaContent";
import { CAROUSEL_POLES, SPONSOR_POLE } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";

type BetaProgrammeContentProps = {
  session: BetaAccessSession;
};

export function BetaProgrammeContent({ session }: BetaProgrammeContentProps) {
  const timeline = getBetaTimeline();
  const currentStep = getBetaCurrentStep();

  return (
    <BetaPageFrame
      pathname={ROUTES.betaProgramme}
      kicker="Programme bêta"
      title="Programme et périmètre de test"
      description="Comprenez le déroulement de la bêta, le calendrier et les six pôles que vous pouvez explorer."
    >
      {BETA_APK_AVAILABLE ? (
        <div className="mb-8 rounded-3xl border border-cyan-500/30 bg-cyan-950/25 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="text-sm font-semibold text-white">APK Android disponible</p>
            <p className="mt-1 text-sm text-white/55">
              Téléchargez ProDay sur votre téléphone Android — guide pas à pas sur la page Installer.
            </p>
          </div>
          <Link
            href={ROUTES.betaInstaller}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--proday-accent)] px-6 py-3 text-sm font-bold text-black transition hover:bg-cyan-300 sm:mt-0"
          >
            Installer l&apos;app
          </Link>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <SectionKicker>Qu&apos;est-ce que la bêta ProDay ?</SectionKicker>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/65">
          ProDay réunit Mercato, matchs, tournois, Pulse et CV joueur dans une seule app — pour le
          foot amateur et semi-pro. En tant que beta-testeur, vous accédez en avant-première aux
          builds iOS (TestFlight) et Android (APK), explorez les six pôles et nous aidez à
          prioriser les fonctionnalités avant l&apos;ouverture au grand public.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Sparkles, label: "Accès anticipé", detail: "App mobile avant le lancement public" },
            { icon: Smartphone, label: "Six pôles", detail: "Amateur, Supporter, Santé et Pro" },
            { icon: Sparkles, label: "Impact direct", detail: "Vos retours orientent la roadmap" },
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

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <SectionKicker>Calendrier de la bêta</SectionKicker>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/65">
          La bêta se déroule en plusieurs étapes. Vous êtes actuellement à l&apos;étape {currentStep}
          {currentStep === 2 && BETA_APK_AVAILABLE
            ? " — l'APK Android est prêt, rendez-vous sur Installer."
            : ` — les builds mobiles arrivent par vagues selon votre profil (${session.roleLabel}).`}
        </p>
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

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <SectionKicker>Les six pôles à explorer</SectionKicker>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/65">
          Chaque pôle propose une expérience dédiée. Votre profil ({session.roleLabel}) oriente
          nos priorités — explorez aussi les autres univers pour un regard transversal.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAROUSEL_POLES.map((pole) => (
            <Link
              key={pole.id}
              href={pole.href}
              className="group rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-[var(--proday-accent)]/40 hover:bg-white/[0.04]"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--proday-accent)]">
                {pole.kicker}
              </p>
              <p className="mt-2 font-display text-base font-bold text-white group-hover:text-cyan-200">
                {pole.title}
              </p>
              <p className="mt-1 text-xs text-white/45">{pole.subtitle}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{pole.description}</p>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-xs text-white/40">
          Également :{" "}
          <Link href={SPONSOR_POLE.href} className="text-[var(--proday-accent)] underline hover:text-cyan-300">
            {SPONSOR_POLE.title}
          </Link>{" "}
          — {SPONSOR_POLE.subtitle.toLowerCase()}.
        </p>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <SectionKicker>Modules transverses à tester</SectionKicker>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/65">
          Au-delà de votre pôle principal, ces modules sont disponibles dans toute l&apos;app bêta.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {BETA_FEATURES.map((feature) => (
            <li key={feature} className="flex gap-2 text-sm text-white/60">
              <span className="text-[var(--proday-accent)]">·</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </BetaPageFrame>
  );
}
