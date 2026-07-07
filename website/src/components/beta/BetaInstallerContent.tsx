import type { ReactNode } from "react";
import {
  AlertTriangle,
  Apple,
  CheckCircle2,
  Clock,
  ExternalLink,
  Play,
  RefreshCw,
  Settings,
  Shield,
} from "lucide-react";
import { BetaPageFrame, SectionKicker } from "@/components/beta/BetaSiteShell";
import { BETA_APK_URL, BETA_TESTFLIGHT_URL } from "@/lib/betaContent";
import { ROUTES } from "@/lib/routes";

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
      className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--proday-accent)] px-6 py-3 text-sm font-bold text-black transition hover:bg-cyan-300 sm:w-auto"
    >
      {label}
      <ExternalLink size={14} />
    </a>
  );
}

function PendingLinkNotice() {
  return (
    <p className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/45">
      Le lien vous sera envoyé par email — surveillez votre boîte de réception (et les spams).
      Cette page affichera le bouton de téléchargement dès que le lien public sera activé.
    </p>
  );
}

function TroubleshootBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
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
  platform,
  icon,
  title,
  subtitle,
  available,
  children,
}: {
  platform: "ios" | "android";
  icon: ReactNode;
  title: string;
  subtitle: string;
  available: boolean;
  children: ReactNode;
}) {
  return (
    <section
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
            <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
              {title}
            </h2>
            {available ? (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Disponible
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
                <Clock size={10} />
                Lien par email
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

export function BetaInstallerContent() {
  const apkAvailable = Boolean(BETA_APK_URL);
  const testflightAvailable = Boolean(BETA_TESTFLIGHT_URL);

  return (
    <BetaPageFrame
      pathname={ROUTES.betaInstaller}
      kicker="Installation"
      title="Installer ProDay sur votre téléphone"
      description="Guides pas à pas pour Android (APK) et iOS (TestFlight), avec dépannage des problèmes courants."
    >
      <p className="mb-8 max-w-3xl text-sm leading-relaxed text-white/65">
        Les builds mobiles sont distribués en dehors des stores publics pendant la bêta. Suivez le
        guide correspondant à votre appareil — iPhone/iPad pour iOS, téléphone Android pour l&apos;APK.
      </p>

      <div className="space-y-8">
        <PlatformSection
          platform="android"
          icon={<Play size={22} className="text-white" />}
          title="Android — APK"
          subtitle="Installation directe, hors Google Play Store"
          available={apkAvailable}
        >
          <StepList
            steps={[
              "Sur votre téléphone Android, ouvrez Réglages → Sécurité (ou Applications) et activez « Installer des applications inconnues » pour votre navigateur ou gestionnaire de fichiers.",
              "Téléchargez le fichier APK via le bouton ci-dessous ou le lien reçu par email ProDay. Attendez la fin du téléchargement (fichier .apk).",
              "Ouvrez le fichier téléchargé depuis la barre de notifications ou l'application Fichiers, puis appuyez sur « Installer ».",
              "Une fois installée, ouvrez ProDay, connectez-vous avec le même email que votre inscription bêta et acceptez les permissions demandées (notifications, stockage si nécessaire).",
            ]}
          />

          {apkAvailable ? (
            <DownloadButton href={BETA_APK_URL} label="Télécharger l'APK Android" />
          ) : (
            <PendingLinkNotice />
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
                  "Appuyez sur « Plus de détails » puis « Installer quand même » — l'APK ProDay est signé par notre équipe.",
                  "Si le blocage persiste, désactivez temporairement Play Protect dans le Play Store → Profil → Play Protect.",
                ]}
              />
              <TroubleshootBlock
                title="Le fichier ne s'ouvre pas"
                items={[
                  "Vérifiez que le téléchargement est complet (pas interrompu).",
                  "Réessayez depuis Chrome ou Firefox avec les sources inconnues activées pour ce navigateur.",
                  "Assurez-vous d'avoir au moins 200 Mo d'espace libre.",
                ]}
              />
              <TroubleshootBlock
                title="L'app se ferme au lancement"
                items={[
                  "Mettez à jour Android si possible (version 10 minimum recommandée).",
                  "Désinstallez une éventuelle ancienne version bêta, puis réinstallez.",
                  "Contactez support@proday.app avec le modèle de téléphone et une capture d'écran.",
                ]}
              />
              <TroubleshootBlock
                title="Mise à jour de l'APK"
                items={[
                  "Téléchargez la nouvelle version depuis ce hub ou l'email de mise à jour.",
                  "Installez par-dessus l'ancienne version — vos données de connexion sont conservées.",
                ]}
              />
            </div>
          </div>
        </PlatformSection>

        <PlatformSection
          platform="ios"
          icon={<Apple size={22} className="text-white" />}
          title="iOS — TestFlight"
          subtitle="Distribution Apple officielle pour beta-testeurs"
          available={testflightAvailable}
        >
          <StepList
            steps={[
              "Recevez l'email d'invitation Apple « ProDay vous invite à tester… » sur l'adresse utilisée lors de l'inscription bêta.",
              "Sur votre iPhone ou iPad, installez l'application TestFlight depuis l'App Store (gratuit, éditeur Apple).",
              "Ouvrez l'email d'invitation sur votre appareil iOS et appuyez sur « View in TestFlight » ou « Commencer les tests ».",
              "Dans TestFlight, acceptez les conditions, puis appuyez sur « Installer » pour ProDay. L'icône apparaît sur votre écran d'accueil.",
              "Lancez ProDay, connectez-vous avec votre email bêta et explorez l'app. Les mises à jour bêta arrivent automatiquement via TestFlight.",
            ]}
          />

          {testflightAvailable ? (
            <DownloadButton href={BETA_TESTFLIGHT_URL} label="Ouvrir TestFlight" />
          ) : (
            <PendingLinkNotice />
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
                  "Attendez 24–48 h après confirmation, puis contactez support@proday.app.",
                ]}
              />
              <TroubleshootBlock
                title="Le lien d'invitation a expiré"
                items={[
                  "Les invitations TestFlight expirent après 90 jours.",
                  "Écrivez à support@proday.app pour recevoir une nouvelle invitation.",
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
                  "Nous publions régulièrement de nouvelles builds — mettez à jour via TestFlight.",
                ]}
              />
            </div>
          </div>
        </PlatformSection>
      </div>

      <div className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-950/20 p-6">
        <div className="flex items-start gap-3">
          <Shield size={22} className="shrink-0 text-[var(--proday-accent)]" />
          <div>
            <p className="text-sm font-semibold text-white">Sécurité & confiance</p>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Ne téléchargez ProDay que depuis ce hub officiel, l&apos;email ProDay ou TestFlight
              Apple. N&apos;installez jamais un APK provenant d&apos;une source tierce. En cas de
              doute, contactez{" "}
              <a href="mailto:support@proday.app" className="text-[var(--proday-accent)] underline">
                support@proday.app
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
