import type { Metadata } from "next";
import { BetaProtectedLayout } from "@/components/beta/BetaSiteShell";

export const metadata: Metadata = {
  title: "Bêta ProDay",
  description:
    "Espace beta-testeur ProDay. Programme, installation et support.",
  robots: { index: false, follow: false },
};

export default function BetaSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BetaProtectedLayout>{children}</BetaProtectedLayout>;
}
