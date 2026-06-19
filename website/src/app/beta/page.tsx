import type { Metadata } from "next";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsBar } from "@/components/StatsBar";
import { BETA_PITCH } from "@/lib/content";
import type { BetaRoleId } from "@/lib/betaWelcomeEmail";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Liste d'attente",
  description:
    "Inscrivez-vous sur la liste d'attente ProDay — suivi du produit et accès prioritaire au lancement.",
};

function parseRoleParam(value: string | undefined): BetaRoleId | undefined {
  const allowed: BetaRoleId[] = [
    "player",
    "recruiter",
    "coach",
    "club",
    "agent",
    "organizer",
    "physio",
    "sponsor",
  ];
  if (value && allowed.includes(value as BetaRoleId)) {
    return value as BetaRoleId;
  }
  return undefined;
}

export default async function BetaPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleParam } = await searchParams;
  const initialRole = parseRoleParam(roleParam);

  return (
    <>
      <PageHeader
        pathname={ROUTES.beta}
        kicker="BÊTA"
        title="Accédez à ProDay en priorité"
        description={BETA_PITCH.summary}
        dark
      />
      <StatsBar />
      <WaitlistForm fullPage initialRole={initialRole} />
    </>
  );
}
