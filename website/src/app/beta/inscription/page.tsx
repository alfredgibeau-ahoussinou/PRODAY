import type { Metadata } from "next";
import { BetaWaitlistHero } from "@/components/beta/BetaWaitlistHero";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";
import { BETA_APK_URL, BETA_TESTFLIGHT_URL } from "@/lib/betaContent";
import { Apple, Play } from "lucide-react";
import { getTestFlightUrl } from "@/lib/betaIosLaunch";

export const metadata: Metadata = {
  title: "Rejoindre la bêta",
  description:
    "Installez l'application ProDay. Accès direct à la bêta iOS TestFlight et à l'APK Android.",
};

export default async function BetaWaitlistPage() {
  const visuals = getRoleVisuals("beta");
  const testFlightUrl = getTestFlightUrl() || BETA_TESTFLIGHT_URL || "https://testflight.apple.com/join/zgch5bQd";
  const apkUrl = BETA_APK_URL || "https://storage.googleapis.com/proday-155b0.firebasestorage.app/beta/proday-beta.apk";

  return (
    <TerminalPage>
      <BetaWaitlistHero
        video={visuals.heroVideo ?? "/videos/pole-beta.mp4"}
        poster={visuals.hero}
      />

      <section
        id="inscription"
        className="scroll-mt-20 border-b border-white/10 bg-[#0a0a0c]"
      >
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 sm:py-16 lg:max-w-xl lg:py-20">
          <div className="border border-white/10 bg-[#111114] p-6 sm:p-8 rounded-2xl text-center">
            <h2 className="text-2xl font-display font-bold text-white mb-4">La Bêta est ouverte</h2>
            <p className="text-white/70 text-sm mb-8">
              Vous n'avez plus besoin de vous inscrire sur liste d'attente. Téléchargez directement l'application pour votre appareil ci-dessous.
            </p>
            
            <div className="flex flex-col gap-4">
              <a
                href={testFlightUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 rounded-xl bg-white text-black px-6 py-4 font-semibold hover:bg-white/90 transition-colors"
              >
                <Apple size={20} />
                <span>Installer via TestFlight (iOS)</span>
              </a>
              
              <a
                href={apkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 text-white px-6 py-4 font-semibold hover:bg-white/10 transition-colors"
              >
                <Play size={20} className="text-[#00E676]" />
                <span>Télécharger l'APK (Android)</span>
              </a>
            </div>
            
            <div className="mt-8 space-y-4 text-left">
              <div className="rounded-xl border border-white/10 bg-black/60 p-4 text-xs text-white/70">
                <p className="font-semibold text-white flex items-center gap-1.5 mb-1">
                  <span>📱</span> Information installation Android (Play Protect)
                </p>
                <p className="leading-relaxed text-white/60 mb-2">
                  Comme l'application est en phase de test bêta privée et téléchargée directement sous forme d'APK, <strong>Google Play Protect</strong> peut afficher un avertissement standard (<em>« Application non reconnue »</em> ou <em>« Bloqué par Play Protect »</em>).
                </p>
                <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2.5 text-emerald-200">
                  👉 <strong>Pour installer :</strong> Cliquez sur <strong>« Plus de détails »</strong> puis sur <strong>« Installer quand même »</strong>. L'APK ProDay est 100% sécurisé et certifié par notre équipe.
                </div>
              </div>

              <div className="rounded-xl border border-white/5 bg-black/40 p-3.5 text-xs text-white/50 space-y-1.5">
                <p><strong>iOS :</strong> Nécessite l'application gratuite TestFlight d'Apple pour installer la bêta.</p>
                <p><strong>Android :</strong> Pensez également à autoriser l'installation depuis votre navigateur si demandé (<em>« Sources inconnues »</em>).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TerminalCta
        title="Besoin d'aide ?"
        description="Si vous rencontrez des problèmes pour télécharger ou installer l'application, contactez l'équipe."
        primaryHref="#support"
        primaryLabel="Contacter le support"
        secondaryHref={ROUTES.demo}
        secondaryLabel="Ouvrir la démo web"
      />
    </TerminalPage>
  );
}
