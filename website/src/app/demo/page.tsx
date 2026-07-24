import type { Metadata } from "next";
import { DemoHero } from "@/components/demo/DemoHero";
import { DemoPageContent } from "@/components/demo/DemoPageContent";
import { parseDemoPoleParam } from "@/lib/demoPoles";

export const metadata: Metadata = {
  title: "Démo interactive",
  description:
    "Naviguez dans ProDay comme dans l’app : sept pôles, onglets réels, sans compte connecté.",
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string; u?: string }>;
}) {
  const { p, u } = await searchParams;
  const pole = parseDemoPoleParam(p, u);

  return (
    <>
      <DemoHero pole={pole} />
      <DemoPageContent pole={pole} />
    </>
  );
}
