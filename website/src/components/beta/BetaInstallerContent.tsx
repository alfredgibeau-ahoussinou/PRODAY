import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Apple,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  RefreshCw,
  Settings,
  Shield,
  Smartphone,
} from "lucide-react";
import { BetaPageFrame, SectionKicker } from "@/components/beta/BetaSiteShell";
import { BetaIosLaunchBanner } from "@/components/beta/BetaIosLaunchBanner";
import { BETA_APK_URL, BETA_APP_VERSION } from "@/lib/betaContent";
import { BETA_ROLE_LABELS } from "@/lib/betaWelcomeEmail";
import {
  IOS_BETA_LAUNCH_LABEL,
  getTestFlightUrl,
  isTestFlightAvailable,
} from "@/lib/betaIosLaunch";
import { ROUTES } from "@/lib/routes";

const BETA_POLE_LABELS = Object.values(BETA_ROLE_LABELS);

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-5 space-y-4">
      {steps.map((step, index) => (
        <li key={step} className="flex gap-3 text-sm leading-relaxed text-white/65">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--proday-accent)]/15 text-xs font-bold text-[var(--proday-accent)]">
            {index + 1}
          </span>
          {step}
        </li>
      ))}
    </ol>
  );
}

function DownloadButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-accent-gradient px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:brightness-110 sm:w-auto"
    >
      {label}
      <ExternalLink size={14} />
    </a>
  );
}

function TestFlightPendingNotice() {
  return (
    <p className="mt-6 border border-dashed border-white/15 bg-transparent px-4 py-3 text-sm text-white/45">
      La bêta iOS via TestFlight a été décalée au{" "}
      <strong className="text-white/70">{IOS_BETA_LAUNCH_LABEL}</strong>{" "}
      (améliorations nécessaires au bon développement). Vous recevrez le lien
      TestFlight par email dès l&apos;ouverture.
    </p>
  );
}

function TroubleshootBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="border border-white/10 bg-black/40 p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-white/55">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--proday-accent)]" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlatformSection({
  id,
  platform,
  icon,
  title,
  subtitle,
  available,
  children,
}: {
  id: string;
  platform: "ios" | "android";
  icon: ReactNode;
  title: string;
  subtitle: string;
  available: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 border p-8 ${
        platform === "ios"
          ? "border-white/10 bg-transparent"
          : "border-[var(--proday-accent)]/25 bg-[var(--proday-accent-muted)]"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-white">
              {title}
            </h2>
            {available ? (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
                Disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                <Clock size={10} />
                {platform === "android" ? "Bientôt ici" : "Invitation email"}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-white/55">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function PlatformQuickPick({
  apkUrl,
  testflightUrl,
  testflightAvailable,
}: {
  apkUrl: string;
  testflightUrl: string;
  testflightAvailable: boolean;
}) {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2">
      <div className="border border-[var(--proday-accent)]/30 bg-[var(--proday-accent-muted)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40">
            <Play size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Android · APK</p>
            <p className="mt-0.5 text-xs text-white/50">
              {apkUrl ? `v${BETA_APP_VERSION} · téléchargement direct` : "Lien bientôt publié"}
            </p>
          </div>
        </div>
        {apkUrl ? (
          <a
            href={apkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-accent-gradient px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:brightness-110"
          >
            Télécharger l&apos;APK
            <ExternalLink size={12} />
          </a>
        ) : (
          <p className="mt-4 text-sm text-white/45">Voir les étapes ci dessous.</p>
        )}
        <a
          href="#android"
          className="mt-3 inline-flex items-center gap-1 text-xs text-white/40 transition hover:text-white/60"
        >
          Guide pas à pas
          <ArrowRight size={12} />
        </a>
      </div>

      <div className="border border-white/10 bg-transparent p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/40">
            <Apple size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">iOS · TestFlight</p>
            <p className="mt-0.5 text-xs text-white/50">
              {testflightAvailable
                ? "Lien prêt · ouvrir sur iPhone"
                : `Ouverture ${IOS_BETA_LAUNCH_LABEL}`}
            </p>
          </div>
        </div>
        {testflightAvailable && testflightUrl ? (
          <a
            href={testflightUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-accent-gradient px-4 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition hover:brightness-110"
          >
            Ouvrir TestFlight
            <ExternalLink size={12} />
          </a>
        ) : (
          <p className="mt-4 text-sm text-white/45">
            Lien envoyé par email à l&apos;ouverture. Étapes ci dessous.
          </p>
        )}
        <a
          href="#ios"
          className="mt-3 inline-flex items-center gap-1 text-xs text-white/40 transition hover:text-white/60"
        >
          Guide pas à pas
          <ArrowRight size={12} />
        </a>
      </div>
    </div>
  );
}

export function BetaInstallerContent() {
  const apkUrl = BETA_APK_URL;
  const testflightUrl = getTestFlightUrl();
  const testflightAvailable = isTestFlightAvailable();

  return (
    <BetaPageFrame
      pathname={ROUTES.betaInstaller}
      kicker="Installation"
      title="Installer ProDay sur votre téléphone"
      description="Choisissez Android (APK) ou iOS (TestFlight), suivez les étapes, puis explorez les cinq pôles · dont Supporter."
    >
      <BetaIosLaunchBanner />

      <PlatformQuickPick
        apkUrl={apkUrl}
        testflightUrl={testflightUrl}
        testflightAvailable={testflightAvailable}
      />

      <p className="mb-8 max-w-3xl text-sm leading-relaxed text-white/65">
        Les builds mobiles sont distribués en dehors des stores publics pendant la bêta. Sur Android,
        téléchargez l&apos;APK directement depuis cette page. Sur iOS,{" "}
        {testflightAvailable
          ? "ouvrez le lien TestFlight ci dessous sur votre iPhone (bouton ou URL complète)."
          : `la bêta TestFlight a été décalée au ${IOS_BETA_LAUNCH_LABEL} (améliorations nécessaires). Lien envoyé par email à tous les inscrits.`}{" "}
        Une fois connecté, testez votre pôle (Joueur, Club, Coach, Supporter ou Sponsor) et les modules
        transverses.
      </p>

      {apkUrl ? (
        <div className="mb-8 border border-[var(--proday-accent)]/30 bg-[var(--proday-accent-muted)] p-6">
          <p className="text-sm font-semibold text-white">APK Android prêt à télécharger</p>
          <p className="mt-1 text-sm text-white/55">
            Téléchargez directement depuis cette page. Aucun email requis. Build bêta · v
            {BETA_APP_VERSION}.
          </p>
          <DownloadButton href={apkUrl} label="Télécharger l'APK Android" />
        </div>
      ) : (
        <div className="mb-8 border border-dashed border-white/15 bg-transparent p-6">
          <p className="text-sm font-semibold text-white">APK Android bientôt disponible</p>
          <p className="mt-1 text-sm text-white/45">
            Le lien de téléchargement n&apos;est pas encore publié sur cette page. Dès qu&apos;il
            l&apos;est, le bouton apparaîtra ici. En attendant, consultez les étapes ci dessous ou
            l&apos;onglet Aide.
          </p>
        </div>
      )}

      <div className="space-y-8">
        <PlatformSection
          id="android"
          platform="android"
          icon={<Play size={22} className="text-white" />}
          title="Android. APK"
          subtitle="Téléchargement direct depuis cette page"
          available={Boolean(apkUrl)}
        >
          <StepList
            steps={[
              "Sur votre téléphone Android, ouvrez Réglages → Sécurité (ou Applications) et activez « Installer des applications inconnues » pour votre navigateur ou gestionnaire de fichiers.",
              "Depuis votre téléphone Android, ouvrez cette page Installer dans votre espace bêta et appuyez sur « Télécharger l'APK Android ». Attendez la fin du téléchargement (fichier .apk).",
              "Ouvrez le fichier téléchargé depuis la barre de notifications ou l'application Fichiers, puis appuyez sur « Installer ».",
              "Une fois installée, ouvrez ProDay, connectez vous avec le même email que votre inscription bêta et acceptez les permissions demandées (notifications, stockage si nécessaire).",
              "Choisissez votre pôle (Joueur, Club, Coach, Supporter ou Sponsor) et explorez les écrans proposés · signalez bugs et idées depuis l'onglet Aide.",
            ]}
          />

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--proday-accent-bright)]">
            Build bêta · v{BETA_APP_VERSION}
          </p>
          {apkUrl ? (
            <DownloadButton href={apkUrl} label="Télécharger l'APK Android" />
          ) : (
            <p className="mt-6 border border-dashed border-white/15 px-4 py-3 text-sm text-white/45">
              Le bouton de téléchargement apparaîtra ici dès que l&apos;APK sera publié.
            </p>
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-400" />
              <p className="text-sm font-semibold text-white">Dépannage Android</p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TroubleshootBlock
                title="Play Protect bloque l'installation"
                items={[
                  "Appuyez sur « Plus de détails » puis « Installer quand même ». L'APK ProDay est signé par notre équipe.",
                  "Si le blocage persiste, désactivez temporairement Play Protect dans le Play Store → Profil → Play Protect.",
                ]}
              />
              <TroubleshootBlock
                title="Le fichier ne s'ouvre pas"
                items={[
                  "Vérifiez que le téléchargement est complet (pas interrompu).",
                  "Réessayez depuis Chrome ou Firefox avec les sources inconnues activées pour ce navigateur.",
                  "Assurez vous d'avoir au moins 200 Mo d'espace libre.",
                ]}
              />
              <TroubleshootBlock
                title="L'app se ferme au lancement"
                items={[
                  "Mettez à jour Android si possible (version 10 minimum recommandée).",
                  "Désinstallez une éventuelle ancienne version bêta, puis réinstallez.",
                  "Contactez proday.admin@gmail.com avec le modèle de téléphone et une capture d'écran.",
                ]}
              />
              <TroubleshootBlock
                title="Mise à jour de l'APK"
                items={[
                  "Téléchargez la nouvelle version depuis cet onglet Installer.",
                  "Installez par dessus l'ancienne version. Vos données de connexion sont conservées.",
                ]}
              />
            </div>
          </div>
        </PlatformSection>

        <PlatformSection
          id="ios"
          platform="ios"
          icon={<Apple size={22} className="text-white" />}
          title="iOS. TestFlight"
          subtitle="Distribution Apple officielle pour beta testeurs"
          available={testflightAvailable}
        >
          <StepList
            steps={[
              testflightAvailable
                ? "Sur votre iPhone, ouvrez le bouton « Ouvrir TestFlight » ci dessous (ou le lien complet), ou utilisez l'email d'invitation Apple reçu sur l'adresse de votre inscription bêta."
                : "Recevez l'email d'invitation Apple « ProDay vous invite à tester… » sur l'adresse utilisée lors de l'inscription bêta.",
              "Sur votre iPhone ou iPad, installez l'application TestFlight depuis l'App Store (gratuit, éditeur Apple) si ce n'est pas déjà fait.",
              testflightAvailable
                ? "Ouvrez le lien sur l'appareil iOS (Safari ou Messages) · pas dans « Redeem » / « Utiliser un code » de TestFlight. Acceptez l'invitation ProDay."
                : "Ouvrez l'email d'invitation sur votre appareil iOS et appuyez sur « View in TestFlight » ou « Commencer les tests ».",
              "Dans TestFlight, acceptez les conditions, puis appuyez sur « Installer » pour ProDay. L'icône apparaît sur votre écran d'accueil.",
              "Lancez ProDay, connectez vous avec votre email bêta, choisissez votre pôle (dont Supporter) et testez. Les mises à jour bêta arrivent automatiquement via TestFlight.",
            ]}
          />

          {testflightAvailable && testflightUrl ? (
            <>
              <DownloadButton href={testflightUrl} label="Ouvrir TestFlight" />
              <p className="mt-3 text-sm leading-relaxed text-white/45">
                À ouvrir sur l&apos;iPhone (Safari ou Messages), pas à coller dans
                « Redeem » / « Utiliser un code » de TestFlight. Lien :{" "}
                <a
                  href={testflightUrl}
                  className="break-all text-white/80 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {testflightUrl}
                </a>
              </p>
            </>
          ) : (
            <TestFlightPendingNotice />
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-[var(--proday-accent)]" />
              <p className="text-sm font-semibold text-white">Dépannage iOS</p>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TroubleshootBlock
                title="Je n'ai pas reçu l'invitation"
                items={[
                  "Vérifiez les spams et l'onglet Promotions de Mail.",
                  "L'invitation est envoyée à l'adresse exacte de votre inscription bêta.",
                  "Attendez 24 à 48 h après confirmation, puis contactez proday.admin@gmail.com.",
                ]}
              />
              <TroubleshootBlock
                title="Le lien d'invitation a expiré"
                items={[
                  "Les invitations TestFlight expirent après 90 jours.",
                  "Écrivez à proday.admin@gmail.com pour recevoir une nouvelle invitation.",
                ]}
              />
              <TroubleshootBlock
                title="Mises à jour bêta"
                items={[
                  "TestFlight notifie automatiquement quand une nouvelle build est disponible.",
                  "Ouvrez TestFlight → ProDay → « Mettre à jour » si la notification n'apparaît pas.",
                  "Activez les notifications pour TestFlight dans Réglages iOS.",
                ]}
              />
              <TroubleshootBlock
                title="Build expirée (90 jours)"
                items={[
                  "Apple limite chaque build bêta à 90 jours d'utilisation.",
                  "Nous publions régulièrement de nouvelles builds. Mettez à jour via TestFlight.",
                ]}
              />
            </div>
          </div>
        </PlatformSection>
      </div>

      <div className="mt-8 border border-white/10 bg-transparent p-8">
        <div className="flex items-start gap-3">
          <Smartphone size={22} className="mt-0.5 shrink-0 text-[var(--proday-accent)]" />
          <div>
            <SectionKicker>Après l&apos;installation</SectionKicker>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">
              ProDay regroupe cinq pôles dans la même app. Connectez-vous avec votre email bêta, puis
              explorez celui qui correspond à votre profil · le pôle Supporter (matchs, tribune, live)
              comme les autres.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {BETA_POLE_LABELS.map((label) => (
                <li
                  key={label}
                  className="border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70"
                >
                  {label}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={ROUTES.betaProgramme}
                className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[var(--proday-accent)] transition hover:text-[var(--proday-accent-bright)]"
              >
                Voir le programme &amp; les pôles
                <ArrowRight size={14} />
              </Link>
              <Link
                href={ROUTES.betaAide}
                className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-white/55 transition hover:text-white/80"
              >
                Aide &amp; retours
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border border-[var(--proday-accent)]/30 bg-[var(--proday-accent-muted)] p-6">
        <div className="flex items-start gap-3">
          <Shield size={22} className="shrink-0 text-[var(--proday-accent)]" />
          <div>
            <p className="text-sm font-semibold text-white">Sécurité & confiance</p>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Ne téléchargez l&apos;APK ProDay que depuis cet onglet Installer officiel. Sur iOS,
              utilisez uniquement TestFlight Apple. N&apos;installez jamais un APK provenant
              d&apos;une source tierce. En cas de
              doute, contactez{" "}
              <a href="mailto:proday.admin@gmail.com" className="text-[var(--proday-accent)] underline">
                proday.admin@gmail.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-white/35">
        <RefreshCw size={14} />
        Les liens de téléchargement peuvent être mis à jour sans préavis pendant la bêta.
      </div>
    </BetaPageFrame>
  );
}
