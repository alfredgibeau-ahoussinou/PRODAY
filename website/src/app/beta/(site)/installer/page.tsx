import type { Metadata } from "next";
import { BetaInstallerContent } from "@/components/beta/BetaInstallerContent";

export const metadata: Metadata = {
  title: "Installer l'app bêta",
  description:
    "Guides d'installation ProDay bêta — APK Android et TestFlight iOS, avec dépannage.",
  robots: { index: false, follow: false },
};

export default function BetaInstallerPage() {
  return <BetaInstallerContent />;
}
