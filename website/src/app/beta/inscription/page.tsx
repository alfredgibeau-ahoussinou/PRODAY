import type { Metadata } from "next";
import { WaitlistForm } from "@/components/WaitlistForm";
import { BetaIosLaunchBanner } from "@/components/beta/BetaIosLaunchBanner";
import { BetaWaitlistHero } from "@/components/beta/BetaWaitlistHero";
import { TerminalCta, TerminalPage } from "@/components/terminal";
import { isBetaRoleId, type BetaRoleId } from "@/lib/betaWelcomeEmail";
import { getRoleVisuals } from "@/lib/roleVisuals";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Rejoindre la bêta",
  description:
    "Inscrivez-vous sur la liste d'attente ProDay. Accès prioritaire à la bêta iOS TestFlight et à l'APK Android.",
};

export default async function BetaWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleParam } = await searchParams;
  const initialRole: BetaRoleId | undefined =
    roleParam && isBetaRoleId(roleParam) ? roleParam : undefined;
  const visuals = getRoleVisuals("beta");

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
        <div className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-10 lg:max-w-xl lg:py-12">
          <div className="border border-white/10 bg-[#111114] p-4 sm:p-6">
            <BetaIosLaunchBanner compact />
            <WaitlistForm fullPage initialRole={initialRole} />
          </div>
        </div>
      </section>

      <TerminalCta
        title="Pas encore prêt ?"
        description="Explore la démo ou le pôle Supporter avant de t'inscrire."
        primaryHref={ROUTES.demo}
        primaryLabel="Ouvrir la démo"
        secondaryHref={ROUTES.supporter}
        secondaryLabel="Pôle Supporter"
      />
    </TerminalPage>
  );
}
