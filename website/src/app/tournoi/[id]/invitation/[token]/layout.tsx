import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invitation tournoi | ProDay",
  description:
    "Invitation à un tournoi ProDay : consultez les informations et répondez sans créer de compte.",
  robots: { index: false, follow: false },
};

export default function InvitationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
