import type { Metadata } from "next";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatsBar } from "@/components/StatsBar";
import { BETA_PITCH } from "@/lib/content";
import type { BetaRoleId } from "@/lib/betaWelcomeEmail";

export const metadata: Metadata = {
  title: "Rejoindre la bêta",
  description:
    "Inscrivez-vous à la bêta ProDay — informations quotidiennes sur l'avancement et accès prioritaire.",
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
        kicker="BÊTA"
        title="Rejoignez ProDay en avant-première"
        description={BETA_PITCH.summary}
      />
      <StatsBar />
      <WaitlistForm fullPage initialRole={initialRole} />
    </>
  );
}
