import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
 title: "Tournoi public | ProDay",
 description:
 "Page publique tournoi ProDay : résultats, classements, horaires. Accessible sans compte.",
};

/**
 * Stub page publique tournoi (QR).
 * Les données réelles seront branchées sur un id Firestore : aucune donnée inventée ici.
 */
export default async function PublicTournamentPage({
 params,
}: {
 params: Promise<{ id: string }>;
}) {
 const { id } = await params;

 return (
 <main
 style={{
 minHeight: "100vh",
 background: "linear-gradient(180deg, #001F6B 0%, #0054F0 45%, #f5f8ff 45%)",
 color: "#0a1628",
 fontFamily: "system-ui, sans-serif",
 }}
 >
 <section style={{ padding: "4rem 1.5rem 2rem", color: "#fff", maxWidth: 720, margin: "0 auto" }}>
 <p style={{ opacity: 0.85, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12 }}>
 ProDay Tournament
 </p>
 <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", margin: "0.4rem 0" }}>
 Tournoi public
 </h1>
 <p style={{ opacity: 0.9, maxWidth: 520 }}>
 Résultats, classements, calendrier, terrains et infos pratiques : même sans compte ProDay.
 </p>
 <p style={{ fontSize: 13, opacity: 0.75 }}>Réf. {id}</p>
 </section>

 <section
 style={{
 maxWidth: 720,
 margin: "0 auto",
 padding: "0 1.5rem 4rem",
 display: "grid",
 gap: "1rem",
 }}
 >
 {[
 "Matchs en cours : donnée indisponible (connectez l’organisation)",
 "Classement : donnée indisponible",
 "Calendrier & terrains : donnée indisponible",
 "Partenaires / buvette : configurable par le club",
 ].map((line) => (
 <article
 key={line}
 style={{
 background: "#fff",
 borderRadius: 16,
 padding: "1.25rem 1.5rem",
 boxShadow: "0 8px 24px rgba(0,31,107,0.08)",
 }}
 >
 <p style={{ margin: 0, fontWeight: 600 }}>{line}</p>
 <p style={{ margin: "0.5rem 0 0", fontSize: 14, color: "#5a6a85" }}>
 Aucune statistique inventée. Importez ou saisissez les scores depuis l’app club.
 </p>
 </article>
 ))}

 <p style={{ fontSize: 14, color: "#5a6a85" }}>
 Retard de match : le staff reçoit une proposition de réorganisation : jamais un
 décalage silencieux.
 </p>

 <Link href="/" style={{ color: "#0054F0", fontWeight: 700 }}>
 Découvrir ProDay
 </Link>
 </section>
 </main>
 );
}
