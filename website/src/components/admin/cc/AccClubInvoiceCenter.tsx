"use client";

import { useCallback, useState } from "react";
import {
  AccBanner,
  AccButton,
  AccInput,
  AccSelect,
  AccStatus,
  AccTable,
} from "@/components/admin/cc/AccUi";
import { CLUB_BILLING_OFFER_OPTIONS } from "@/lib/adminClubBillingApi";

type InvoiceRow = {
  id: string;
  club_id: string;
  offer_id: string;
  label: string;
  amount_due_cents: number;
  currency: string;
  status: string;
  customer_email: string;
  hosted_invoice_url: string | null;
  lives_count: number | null;
  created_at: string | null;
};

function formatEurCents(cents: number, currency = "eur"): string {
  return `${(cents / 100).toFixed(2).replace(".", ",")} ${currency.toUpperCase()}`;
}

function statusTone(
  status: string,
): "success" | "warning" | "danger" | "info" | "neutral" {
  if (status === "paid") return "success";
  if (status === "open" || status === "draft") return "info";
  if (status === "uncollectible" || status === "void") return "danger";
  if (status === "past_due") return "warning";
  return "neutral";
}

/** Formulaire Control Center : prix custom + envoi Invoice Stripe réel. */
export function AccClubInvoiceCenter() {
  const [clubId, setClubId] = useState("");
  const [clubName, setClubName] = useState("");
  const [email, setEmail] = useState("");
  const [offerId, setOfferId] = useState("club_live_duo");
  const [amountEur, setAmountEur] = useState("");
  const [livesCount, setLivesCount] = useState("2");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState<"price" | "invoice" | "list" | null>(null);
  const [message, setMessage] = useState<{
    tone: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);

  const loadInvoices = useCallback(async () => {
    setBusy("list");
    setMessage(null);
    try {
      const q = clubId.trim()
        ? `?clubId=${encodeURIComponent(clubId.trim())}`
        : "";
      const res = await fetch(`/api/admin/billing/invoice${q}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      const data = (await res.json()) as {
        ok?: boolean;
        invoices?: InvoiceRow[];
        error?: string;
      };
      if (!res.ok || data.error) {
        setMessage({
          tone: "error",
          text: data.error ?? "Impossible de charger les factures",
        });
        return;
      }
      setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
    } catch {
      setMessage({ tone: "error", text: "Réseau indisponible" });
    } finally {
      setBusy(null);
    }
  }, [clubId]);

  async function savePrice() {
    setBusy("price");
    setMessage(null);
    const amount = Number(String(amountEur).replace(",", "."));
    if (!clubId.trim() || !offerId || !(amount > 0)) {
      setMessage({
        tone: "error",
        text: "clubId, offre et montant (€) > 0 requis",
      });
      setBusy(null);
      return;
    }
    try {
      const res = await fetch("/api/admin/billing/price", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: clubId.trim(),
          offerId,
          amountEur: amount,
          label: label.trim() || undefined,
          livesCount: livesCount.trim()
            ? Number(livesCount)
            : offerId === "club_live_duo"
              ? 2
              : null,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        setMessage({
          tone: "error",
          text: data.error ?? "Enregistrement prix impossible",
        });
        return;
      }
      setMessage({
        tone: "success",
        text: `Prix enregistré : ${amount.toFixed(2)} € (${offerId})`,
      });
    } catch {
      setMessage({ tone: "error", text: "Réseau indisponible" });
    } finally {
      setBusy(null);
    }
  }

  async function sendInvoice() {
    setBusy("invoice");
    setMessage(null);
    const amount = amountEur.trim()
      ? Number(String(amountEur).replace(",", "."))
      : undefined;
    if (!clubId.trim() || !email.trim() || !offerId) {
      setMessage({
        tone: "error",
        text: "clubId, email club et offre requis",
      });
      setBusy(null);
      return;
    }
    try {
      const res = await fetch("/api/admin/billing/invoice", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: clubId.trim(),
          offerId,
          customerEmail: email.trim(),
          clubName: clubName.trim() || undefined,
          amountEur: amount && amount > 0 ? amount : undefined,
          label: label.trim() || undefined,
          livesCount: livesCount.trim() ? Number(livesCount) : undefined,
          sendInvoice: true,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        invoice?: InvoiceRow & { hosted_invoice_url?: string | null };
      };
      if (!res.ok || data.error) {
        setMessage({
          tone: "error",
          text: data.error ?? "Envoi facture impossible",
        });
        return;
      }
      const url = data.invoice?.hosted_invoice_url;
      setMessage({
        tone: "success",
        text: url
          ? `Invoice Stripe envoyée. Lien : ${url}`
          : "Invoice Stripe créée et envoyée au club.",
      });
      await loadInvoices();
    } catch {
      setMessage({ tone: "error", text: "Réseau indisponible" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-white/45">
        Prix custom Firestore + facture Stripe réelle (
        <code className="text-[10px]">send_invoice</code>). Aucune clé secrète
        côté navigateur — proxy{" "}
        <code className="text-[10px]">/api/admin/billing/*</code>.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            Club ID
          </span>
          <AccInput
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            placeholder="uid / club_id"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            Nom club (Stripe)
          </span>
          <AccInput
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="FC Exemple"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            Email facturation
          </span>
          <AccInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tresorier@club.fr"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            Offre
          </span>
          <AccSelect
            value={offerId}
            onChange={(e) => {
              setOfferId(e.target.value);
              if (e.target.value === "club_live_duo") setLivesCount("2");
            }}
          >
            {CLUB_BILLING_OFFER_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </AccSelect>
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            Montant €
          </span>
          <AccInput
            value={amountEur}
            onChange={(e) => setAmountEur(e.target.value)}
            placeholder="ex. 890"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            Lives (Veo)
          </span>
          <AccInput
            value={livesCount}
            onChange={(e) => setLivesCount(e.target.value)}
            placeholder="2"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
            Libellé (optionnel)
          </span>
          <AccInput
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="2 lives Veo — saison 2026"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <AccButton
          onClick={() => void savePrice()}
          disabled={busy !== null}
          variant="ghost"
        >
          {busy === "price" ? "Enregistrement…" : "Enregistrer le prix"}
        </AccButton>
        <AccButton
          onClick={() => void sendInvoice()}
          disabled={busy !== null}
        >
          {busy === "invoice" ? "Envoi…" : "Créer & envoyer Invoice"}
        </AccButton>
        <AccButton
          onClick={() => void loadInvoices()}
          disabled={busy !== null}
          variant="ghost"
        >
          {busy === "list" ? "Chargement…" : "Lister factures"}
        </AccButton>
      </div>

      {message ? (
        <AccBanner
          tone={
            message.tone === "success"
              ? "success"
              : message.tone === "error"
                ? "error"
                : "info"
          }
        >
          {message.text}
        </AccBanner>
      ) : null}

      {invoices.length > 0 ? (
        <AccTable>
          <table>
            <thead>
              <tr>
                <th>Club</th>
                <th>Offre</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Lien</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <p className="font-mono text-[11px] text-white/70">
                      {inv.club_id}
                    </p>
                    <p className="text-[10px] text-white/35">
                      {inv.customer_email}
                    </p>
                  </td>
                  <td className="text-[12px] text-white/75">
                    {inv.label || inv.offer_id}
                    {inv.lives_count != null ? (
                      <span className="ml-1 text-white/40">
                        · {inv.lives_count} live
                        {inv.lives_count > 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </td>
                  <td className="font-mono text-[11px]">
                    {formatEurCents(inv.amount_due_cents, inv.currency)}
                  </td>
                  <td>
                    <AccStatus tone={statusTone(inv.status)}>
                      {inv.status}
                    </AccStatus>
                  </td>
                  <td>
                    {inv.hosted_invoice_url ? (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[var(--acc-steel)] hover:underline"
                      >
                        Ouvrir
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AccTable>
      ) : null}
    </div>
  );
}
