"use client";

// Métadonnées (noindex) portées par layout.tsx — interdites dans un client component.
import Link from "next/link";
import { useEffect, useState } from "react";

const INPUT_STYLE = {
  width: "100%",
  padding: "0.75rem 1rem",
  borderRadius: 12,
  border: "1px solid #d7dee9",
  fontSize: 15,
  fontFamily: "inherit",
} as const;

type InvitationView = {
  tournament: {
    name: string;
    category: string;
    club_name: string;
    starts_at: string | null;
    ends_at: string | null;
    venue_label: string | null;
    city: string | null;
    capacity: number | null;
    confirmed_teams: number;
    remaining_capacity: number | null;
    registration_deadline: string | null;
    participation_conditions: string | null;
    entry_fee_label: string | null;
    format: string;
    lifecycle: string;
    change_log: { at: string | null; label: string }[];
  };
  invitation: {
    club_name: string;
    status: string;
    requires_approval: boolean;
    expires_at: string | null;
    expired: boolean;
  } | null;
  can_respond: boolean;
  block_reason: string | null;
};

const LIFECYCLE_LABELS: Record<string, string> = {
  draft: "Brouillon",
  registration_open: "Inscriptions ouvertes",
  registration_closed: "Inscriptions fermées",
  confirmed: "Confirmé",
  ongoing: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
};

function formatDate(iso: string | null): string {
  if (!iso) return "à confirmer";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ExternalInvitationPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>;
}) {
  const { id, token } = useParamsCompat({ id: "", token: "" }, params);
  return <InvitationClient tournamentId={id} token={token} />;
}

/** Next 16 : params est une promesse — petit helper client-compatible. */
function useParamsCompat(
  _fallback: { id: string; token: string },
  params: Promise<{ id: string; token: string }>,
): { id: string; token: string } {
  const [resolved, setResolved] = useState<{ id: string; token: string }>({
    id: "",
    token: "",
  });
  useEffect(() => {
    let active = true;
    params.then((p) => {
      if (active) setResolved(p);
    });
    return () => {
      active = false;
    };
  }, [params]);
  return resolved;
}

function InvitationClient({
  tournamentId,
  token,
}: {
  tournamentId: string;
  token: string;
}) {
  const [view, setView] = useState<InvitationView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const [clubName, setClubName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (!tournamentId || !token) return;
    let active = true;
    setLoading(true);
    fetch(
      `${FUNCTION_URL}?tournament_id=${encodeURIComponent(tournamentId)}&token=${encodeURIComponent(token)}`,
    )
      .then(async (res) => {
        const data = (await res.json()) as InvitationView & { error?: string };
        if (!active) return;
        if (!res.ok) {
          setError(data.error ?? "Lien d’invitation invalide.");
        } else {
          setView(data);
          if (data.invitation?.club_name) setClubName(data.invitation.club_name);
        }
      })
      .catch(() => {
        if (active) setError("Impossible de charger l’invitation. Vérifiez votre connexion.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tournamentId, token]);

  const respond = async (response: "accepted" | "declined") => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournament_id: tournamentId,
          token,
          response,
          contact: { club_name: clubName, contact_name: contactName, contact_email: contactEmail, contact_phone: contactPhone },
        }),
      });
      const data = (await res.json()) as { ok?: boolean; status?: string; message?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Réponse impossible.");
        return;
      }
      setResult(data.message ?? "Réponse enregistrée.");
      // Recharge l'état pour afficher le nouveau statut.
      const refreshed = await fetch(
        `${FUNCTION_URL}?tournament_id=${encodeURIComponent(tournamentId)}&token=${encodeURIComponent(token)}`,
      );
      if (refreshed.ok) setView((await refreshed.json()) as InvitationView);
    } catch {
      setError("Réponse impossible. Vérifiez votre connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <p style={{ color: "#5a6a85" }}>Chargement de l’invitation…</p>
      </Shell>
    );
  }

  if (error && !view) {
    return (
      <Shell>
        <div style={cardStyle}>
          <h2 style={{ color: "#b91c1c", marginTop: 0 }}>Invitation indisponible</h2>
          <p style={{ color: "#5a6a85" }}>{error}</p>
          <p style={{ fontSize: 13, color: "#8a97ab" }}>
            Demandez à l’organisateur un nouveau lien si nécessaire.
          </p>
        </div>
      </Shell>
    );
  }

  if (!view) return null;

  const t = view.tournament;
  const invitation = view.invitation;
  const alreadyResponded = invitation?.status === "accepted" || invitation?.status === "declined";

  return (
    <Shell>
      <section style={cardStyle}>
        <p style={{ opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, margin: 0 }}>
          Invitation · Tournoi ProDay
        </p>
        <h1 style={{ margin: "0.3rem 0", fontSize: "clamp(1.6rem, 4vw, 2.2rem)" }}>{t.name}</h1>
        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            background:
              t.lifecycle === "cancelled" ? "#fee2e2" : t.lifecycle === "registration_open" ? "#d1fae5" : "#e0e7ff",
            color: t.lifecycle === "cancelled" ? "#b91c1c" : t.lifecycle === "registration_open" ? "#065f46" : "#3730a3",
          }}
        >
          {LIFECYCLE_LABELS[t.lifecycle] ?? t.lifecycle}
        </div>

        <dl style={{ display: "grid", gap: "0.5rem", margin: "1.2rem 0 0" }}>
          <Row label="Organisé par" value={t.club_name} />
          <Row label="Catégorie" value={t.category || "—"} />
          <Row label="Début" value={formatDate(t.starts_at)} />
          <Row label="Lieu" value={[t.venue_label, t.city].filter(Boolean).join(", ") || "à confirmer"} />
          <Row
            label="Équipes"
            value={`${t.confirmed_teams}${t.capacity ? ` / ${t.capacity}` : ""} inscrites${t.remaining_capacity !== null ? ` · ${t.remaining_capacity} place(s) restante(s)` : ""}`}
          />
          <Row label="Clôture des inscriptions" value={formatDate(t.registration_deadline)} />
          {t.entry_fee_label ? <Row label="Frais" value={t.entry_fee_label} /> : null}
          {t.participation_conditions ? (
            <Row label="Conditions de participation" value={t.participation_conditions} />
          ) : null}
        </dl>

        {t.change_log.length > 0 ? (
          <p style={{ fontSize: 13, color: "#8a97ab", marginTop: "1rem" }}>
            Dernières modifications : {t.change_log.map((c) => c.label).join(" · ")}
          </p>
        ) : null}
      </section>

      {result ? (
        <section style={{ ...cardStyle, borderLeft: "4px solid #059669" }}>
          <p style={{ margin: 0, fontWeight: 600, color: "#065f46" }}>{result}</p>
        </section>
      ) : null}

      {invitation ? (
        <section style={cardStyle}>
          <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>
            Invitation — {invitation.club_name}
          </h2>
          <p style={{ color: "#5a6a85", marginTop: 0 }}>
            Statut :{" "}
            <strong>
              {invitation.status === "accepted"
                ? invitation.requires_approval
                  ? "acceptée — en attente d’approbation de l’organisateur"
                  : "confirmée"
                : invitation.status === "declined"
                  ? "déclinée"
                  : invitation.status === "revoked"
                    ? "révoquée"
                    : "en attente de réponse"}
            </strong>
          </p>
          {invitation.expired ? (
            <p style={{ color: "#b91c1c" }}>Ce lien d’invitation a expiré.</p>
          ) : null}

          {view.can_respond && !alreadyResponded ? (
            <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.5rem" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Confirmer les informations de votre équipe :</p>
              <input style={INPUT_STYLE} placeholder="Nom du club / équipe" value={clubName} onChange={(e) => setClubName(e.target.value)} />
              <input style={INPUT_STYLE} placeholder="Personne de contact" value={contactName} onChange={(e) => setContactName(e.target.value)} />
              <input style={INPUT_STYLE} placeholder="Email de contact (optionnel)" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
              <input style={INPUT_STYLE} placeholder="Téléphone (optionnel)" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => void respond("accepted")}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    padding: "0.85rem 1.2rem",
                    borderRadius: 999,
                    border: "none",
                    background: "#059669",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: submitting ? "wait" : "pointer",
                  }}
                >
                  {submitting ? "Envoi…" : "Accepter l’invitation"}
                </button>
                <button
                  onClick={() => void respond("declined")}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    padding: "0.85rem 1.2rem",
                    borderRadius: 999,
                    border: "1px solid #d7dee9",
                    background: "#fff",
                    color: "#5a6a85",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: submitting ? "wait" : "pointer",
                  }}
                >
                  Décliner
                </button>
              </div>
              <p style={{ fontSize: 12.5, color: "#8a97ab", margin: 0 }}>
                Aucun compte ProDay n’est requis pour répondre. Une invitation acceptée reste
                soumise à l’approbation de l’organisateur — vous serez contacté(e) pour la confirmation finale.
              </p>
            </div>
          ) : view.block_reason ? (
            <p style={{ color: "#b91c1c" }}>{view.block_reason}</p>
          ) : null}
        </section>
      ) : null}

      <p style={{ fontSize: 14, color: "#5a6a85" }}>
        <Link href="/" style={{ color: "#B8941F", fontWeight: 700 }}>
          Découvrir ProDay
        </Link>{" "}
        — créer un compte reste optionnel et séparé de cette réponse.
      </p>
    </Shell>
  );
}

const FUNCTION_URL =
  process.env.NEXT_PUBLIC_TOURNAMENT_INVITE_FUNCTION_URL ??
  "https://europe-west1-proday-155b0.cloudfunctions.net/tournamentExternalInvite";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", flexWrap: "wrap" }}>
      <dt style={{ color: "#8a97ab", fontSize: 14 }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 600, fontSize: 14, textAlign: "right" }}>{value}</dd>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #B8941F 0%, #E8B923 45%, #f5f8ff 45%)",
        color: "#0a1628",
        fontFamily: "system-ui, sans-serif",
        padding: "3rem 1.25rem",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", display: "grid", gap: "1rem" }}>{children}</div>
    </main>
  );
}

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  padding: "1.4rem 1.5rem",
  boxShadow: "0 8px 24px rgba(0,31,107,0.08)",
} as const;
