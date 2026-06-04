import type { Metadata } from "next";
import { CvPreview } from "@/components/interactive/CvPreview";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "CV joueur",
  description: "CV foot vivant exportable en PDF — alimenté par Live Stats.",
};

export default function CvPage() {
  return (
    <>
      <PageHeader
        kicker="CV VIVANT"
        title="Votre CV foot professionnel"
        description="Chaque match enrichit votre fiche. Export PDF en un geste depuis l'app."
        image="/showcase/classic-profile.jpg"
      />
      <section className="py-16 px-4 sm:px-6">
        <CvPreview />
      </section>
    </>
  );
}
