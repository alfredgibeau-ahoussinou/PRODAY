import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { PremiumSection } from "@/components/layout/PremiumSection";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { SHOP_HIGHLIGHTS } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "ProDay Shop",
  description:
    "Trépieds, t-shirts et maillots officiels ProDay. Man, Woman et Pro.",
};

export default function ShopPage() {
  return (
    <>
      <PageHeader
        pathname={ROUTES.shop}
        kicker="SHOP"
        title="Équipement & textile officiel"
        description="Trépieds pour filmer vos matchs, t-shirts et maillots. Logo ProDay brodé, par univers."
        image="/images/football-training-01.jpg"
        dark
      />
      <PremiumSection
        kicker="CATALOGUE"
        title="Textile & équipement ProDay"
        description="Le catalogue complet est dans l'app. Bouton Shop sur l'accueil de chaque univers."
        bordered={false}
      >
        <div className="grid gap-6 sm:grid-cols-3">
          {SHOP_HIGHLIGHTS.map((item) => (
            <article key={item.name} className="card-premium rounded-2xl p-6">
              <p className="text-xs font-medium text-white/40">À partir de</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {item.priceEur.toFixed(2).replace(".", ",")} €
              </p>
              <h2 className="font-display mt-4 text-lg font-bold text-white">{item.name}</h2>
              <p className="mt-2 text-sm text-white/55">{item.description}</p>
            </article>
          ))}
        </div>
        <p className="mt-10 text-sm text-white/45">
          Livraison estimée 3 à 5 semaines · Contact :{" "}
          <a href="mailto:shop@proday.app" className="font-medium text-white underline">
            shop@proday.app
          </a>
        </p>
        <div className="mt-8">
          <PremiumButton href={ROUTES.betaWaitlist}>Voir la liste d'attente</PremiumButton>
        </div>
      </PremiumSection>
    </>
  );
}
