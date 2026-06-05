import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SHOP_HIGHLIGHTS } from "@/lib/content";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "ProDay Shop",
  description:
    "Trépieds, t-shirts et maillots officiels ProDay — par univers Man, Woman et Pro.",
};

export default function ShopPage() {
  return (
    <>
      <PageHeader
        kicker="SHOP"
        title="Équipement & textile officiel"
        description="Trépieds pour filmer vos matchs, t-shirts lifestyle et maillots match — logo ProDay brodé, par univers."
        image="/showcase/classic-exp-sponsors.jpg"
        accent="default"
      />
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="max-w-2xl text-proday-muted">
            Le catalogue complet est disponible dans l&apos;application — bouton Shop sur
            l&apos;accueil de chaque univers. Précommande par email en attendant le paiement
            in-app.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {SHOP_HIGHLIGHTS.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6"
              >
                <p className="text-xs font-medium text-proday-muted">À partir de</p>
                <p className="mt-1 text-2xl font-bold">
                  {item.priceEur.toFixed(2).replace(".", ",")} €
                </p>
                <h2 className="mt-4 text-lg font-bold">{item.name}</h2>
                <p className="mt-2 text-sm text-proday-muted">{item.description}</p>
              </article>
            ))}
          </div>
          <p className="mt-10 text-sm text-proday-muted">
            Livraison estimée 3 à 5 semaines · Contact :{" "}
            <a href="mailto:shop@proday.app" className="font-medium text-proday-ink underline">
              shop@proday.app
            </a>
          </p>
          <Link
            href={ROUTES.beta}
            className="mt-8 inline-block rounded-full bg-proday-ink px-8 py-3.5 text-sm font-semibold text-white"
          >
            Rejoindre la bêta pour accéder au Shop
          </Link>
        </div>
      </section>
    </>
  );
}
