import {
  Apple,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MessageSquare,
  Play,
  Smartphone,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumButton } from "@/components/ui/PremiumButton";
import type { BetaAccessSession } from "@/lib/betaAccess";
import { CAROUSEL_POLES, SPONSOR_POLE } from "@/lib/poles";
import { ROUTES } from "@/lib/routes";

type BetaAccessContentProps = {
  session: BetaAccessSession;
};

const BETA_APK_URL = process.env.NEXT_PUBLIC_BETA_APK_URL?.trim() ?? "";
const BETA_TESTFLIGHT_URL = process.env.NEXT_PUBLIC_BETA_TESTFLIGHT_URL?.trim() ?? "";

const BETA_FEATURES = [
  "Mercato — annonces, candidatures et suivi des réponses",
  "Matchs & tournois — convocations, RSVP et calendrier unifié",
  "Pulse — score de visibilité et dynamique de profil",
  "Fil, Reels & Arena — communauté, contenus et événements",
  "CV joueur — profil alimenté par vos matchs et stats",
  "Parcours par rôle — expérience adaptée à votre profil",
] as const;

const BETA_TIMELINE = [
  {
    step: 1,
    title: "Inscription confirmée",
    description: "Votre inscription est confirmée. Retrouvez ici le programme, les pôles et les liens de téléchargement.",
    done: true,
  },
  {
    step: 2,
    title: "Liens de téléchargement",
    description: "Vous recevrez par email l'invitation TestFlight (iOS) et le lien APK (Android) dès ouverture des tests.",
    done: false,
  },
  {
    step: 3,
    title: "Tests & retours",
    description: "Explorez l'app, testez votre pôle et partagez bugs, idées ou retours UX — nous lisons chaque message.",
    done: false,
  },
  {
    step: 4,
    title: "Lancement public",
    description: "Les beta-testeurs conservent l'accès prioritaire ; vous serez informés de la date de sortie grand public.",
    done: false,
  },
] as const;

function SectionKicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--proday-accent)]">
      {children}
    </p>
  );
}

function DownloadCard({
  platform,
  icon,
  title,
  subtitle,
  href,
  available,
  instructions,
}: {
  platform: "ios" | "android";
  icon: ReactNode;
  title: string;
  subtitle: string;
  href: string;
  available: boolean;
  instructions: string[];
}) {
  return (
    <div
      className={`rounded-3xl border p-8 ${
        platform === "ios"
          ? "border-white/10 bg-gradient-to-br from-[#0c0c12] via-[#0a0a0f] to-[#030303]"
          : "border-cyan-500/20 bg-cyan-950/20"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
              {title}
            </h3>
            {available ? (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
                <Clock size={10} />
                Bientôt
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-white/55">{subtitle}</p>
        </div>
      </div>

      <ul className="mt-5 space-y-2">
        {instructions.map((line) => (
          <li key={line} className="flex gap-2 text-sm leading-relaxed text-white/60">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--proday-accent)]" />
            {line}
          </li>
        ))}
      </ul>

      {available && href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--proday-accent)] px-6 py-3 text-sm font-bold text-black transition hover:bg-cyan-300 sm:w-auto"
        >
          Télécharger
          <ExternalLink size={14} />
        </a>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/45">
          Le lien vous sera envoyé par email — surveillez votre boîte de réception (et les spams).
        </p>
      )}
    </div>
  );
}

export function BetaAccessContent({ session }: BetaAccessContentProps) {
  const feedbackMailto = `mailto:support@proday.app?subject=${encodeURIComponent("Retour bêta ProDay")}&body=${encodeURIComponent(
    `Email bêta : ${session.email}\nProfil : ${session.roleLabel}\n\nDécrivez votre retour (bug, idée, UX…) :\n\n`,
  )}`;

  return (
    <>
      <PageHeader
        pathname={ROUTES.beta}
        kicker="Programme bêta"
        title="Bienvenue dans la bêta ProDay"
        description={`Vous êtes inscrit en tant que ${session.roleLabel}. Accès anticipé à l'app, aux six pôles et aux modules clés — votre regard façonne le produit avant le lancement public.`}
        dark
      />

      <section className="bg-black py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Qu'est-ce que la bêta ? */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <SectionKicker>Qu&apos;est-ce que la bêta ?</SectionKicker>
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
                { icon: MessageSquare, label: "Votre voix compte", detail: "Retours lus par l'équipe produit" },
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

          {/* Ce que vous pouvez tester — pôles */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <SectionKicker>Ce que vous pouvez tester</SectionKicker>
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

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">
                Modules transverses
              </p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {BETA_FEATURES.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-white/60">
                    <span className="text-[var(--proday-accent)]">·</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Téléchargement */}
          <div className="mt-8">
            <SectionKicker>Téléchargement</SectionKicker>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/65">
              Les builds mobiles arrivent par étapes. Dès qu&apos;ils sont prêts, vous recevrez le lien
              personnel par email — cette page affichera aussi les boutons de téléchargement.
            </p>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <DownloadCard
                platform="ios"
                icon={<Apple size={22} className="text-white" />}
                title="iOS — TestFlight"
                subtitle="Distribution Apple pour beta-testeurs"
                href={BETA_TESTFLIGHT_URL}
                available={Boolean(BETA_TESTFLIGHT_URL)}
                instructions={[
                  "Installez l'app TestFlight depuis l'App Store (gratuit).",
                  "Ouvrez l'invitation reçue par email depuis votre iPhone ou iPad.",
                  "Acceptez l'invitation, puis lancez ProDay depuis TestFlight.",
                ]}
              />
              <DownloadCard
                platform="android"
                icon={<Play size={22} className="text-white" />}
                title="Android — APK"
                subtitle="Installation directe (hors Google Play)"
                href={BETA_APK_URL}
                available={Boolean(BETA_APK_URL)}
                instructions={[
                  "Autorisez l'installation depuis des sources inconnues si demandé.",
                  "Téléchargez l'APK via le lien reçu par email ou le bouton ci-dessous.",
                  "Ouvrez le fichier téléchargé et suivez les instructions d'installation.",
                ]}
              />
            </div>
          </div>

          {/* Comment donner votre avis */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-cyan-500/20 bg-cyan-950/20 p-8">
              <MessageSquare className="text-[var(--proday-accent)]" size={28} />
              <h2 className="font-display mt-4 text-xl font-bold uppercase tracking-wide text-white">
                Comment donner votre avis
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
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
                Ou répondez directement à l&apos;email de bienvenue bêta.
              </p>
            </div>

            {/* Prochaines étapes */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <SectionKicker>Prochaines étapes</SectionKicker>
              <ol className="mt-6 space-y-5">
                {BETA_TIMELINE.map(({ step, title, description, done }) => (
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
          </div>

          {/* En attendant l'app */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <SectionKicker>En attendant l&apos;app</SectionKicker>
              <p className="mt-2 max-w-xl text-sm text-white/65">
                Démo interactive, Mercato, Pulse, feuille de route et les six pôles sur proday75.fr.
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

          <p className="mt-8 text-center text-xs text-white/35">
            Connecté en tant que {session.email}. Ce lien personnel ne doit pas être partagé.
          </p>
        </div>
      </section>
    </>
  );
}
