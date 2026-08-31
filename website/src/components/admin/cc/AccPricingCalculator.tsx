"use client";

import { useMemo, useState } from "react";
import { AccShell } from "@/components/admin/cc/AccShell";
import {
  AccBanner,
  AccButton,
  AccInput,
  AccMetric,
  AccPanel,
  AccSelect,
  AccStatus,
} from "@/components/admin/cc/AccUi";
import {
  CLUB_QUOTE_OPTIONS,
  computeClubQuote,
  formatEur,
  type ClubQuoteOptionId,
  volumeRateEurPerMember,
} from "@/lib/adminCc/clubPricing";

type Props = {
  badges?: { pendingBeta?: number; pastDue?: number };
  healthScore?: number | null;
  healthLabel?: string | null;
};

export function AccPricingCalculator({
  badges,
  healthScore = null,
  healthLabel = null,
}: Props) {
  const [members, setMembers] = useState(120);
  const [discount, setDiscount] = useState(0);
  const [customRate, setCustomRate] = useState("");
  const [selected, setSelected] = useState<ClubQuoteOptionId[]>(["video_byo"]);
  const [clubName, setClubName] = useState("");
  const [clubId, setClubId] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [invoiceMsg, setInvoiceMsg] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const quote = useMemo(() => {
    const custom = customRate.trim() ? Number(customRate.replace(",", ".")) : null;
    return computeClubQuote({
      members,
      optionIds: selected,
      customRateEur: custom && !Number.isNaN(custom) ? custom : null,
      discountPercent: discount,
      billing: "monthly",
    });
  }, [members, selected, customRate, discount]);

  function toggle(id: ClubQuoteOptionId) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function copySummary() {
    const lines = [
      `Devis ProDay Club — ${clubName || "Club"}`,
      `Adhérents : ${quote.members}`,
      `Taux : ${formatEur(quote.ratePerMember)} / adhérent`,
      ...quote.lineItems.map((l) => `· ${l.label} : ${formatEur(l.amountEur)}`),
      `Mensuel net : ${formatEur(quote.netMonthly)}`,
      `Annuel (−20 %) : ${formatEur(quote.annualNet)} (économie ${formatEur(quote.annualSavings)})`,
    ];
    void navigator.clipboard.writeText(lines.join("\n"));
  }

  async function sendStripeInvoiceFromQuote() {
    setInvoiceBusy(true);
    setInvoiceMsg(null);
    const amountEur = quote.netMonthly;
    if (!clubId.trim() || !billingEmail.trim() || !(amountEur > 0)) {
      setInvoiceMsg({
        tone: "error",
        text: "Club ID, email facturation et montant devis > 0 requis",
      });
      setInvoiceBusy(false);
      return;
    }
    const offerId = selected.includes("video_veo_pack")
      ? "club_video_pro"
      : "club_premium";
    try {
      await fetch("/api/admin/billing/price", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: clubId.trim(),
          offerId,
          amountEur,
          label: `Devis ${clubName || clubId} — ${offerId}`,
          notes: `Calculateur : ${quote.members} adh · net mensuel`,
        }),
      });
      const res = await fetch("/api/admin/billing/invoice", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: clubId.trim(),
          offerId,
          customerEmail: billingEmail.trim(),
          clubName: clubName.trim() || undefined,
          amountEur,
          label: `ProDay Club — ${clubName || clubId}`,
          sendInvoice: true,
          description: `Mensuel net calculateur (${quote.members} adhérents)`,
        }),
      });
      const data = (await res.json()) as { error?: string; invoice?: { hosted_invoice_url?: string } };
      if (!res.ok || data.error) {
        setInvoiceMsg({
          tone: "error",
          text: data.error ?? "Envoi Invoice impossible",
        });
        return;
      }
      setInvoiceMsg({
        tone: "success",
        text: data.invoice?.hosted_invoice_url
          ? `Invoice envoyée — ${data.invoice.hosted_invoice_url}`
          : "Invoice Stripe envoyée au club",
      });
    } catch {
      setInvoiceMsg({ tone: "error", text: "Réseau indisponible" });
    } finally {
      setInvoiceBusy(false);
    }
  }

  return (
    <AccShell
      title="Calculateur de prix Club"
      subtitle="Tout inclus à partir de 3 € / adhérent — volume, options et remise commerciale."
      badges={badges}
      healthScore={healthScore}
      healthLabel={healthLabel}
      actions={
        <AccButton variant="ghost" onClick={copySummary}>
          Copier le récap
        </AccButton>
      }
    >
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-7">
          <AccPanel title="Paramètres devis" description="Tarification admin — pas de faux paiement.">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
                  Nom du club
                </span>
                <AccInput
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  placeholder="FC Exemple"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
                  Club ID (facturation)
                </span>
                <AccInput
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  placeholder="uid / club_id"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
                  Email facturation Stripe
                </span>
                <AccInput
                  type="email"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="tresorier@club.fr"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
                  Adhérents
                </span>                <AccInput
                  type="number"
                  min={0}
                  value={members}
                  onChange={(e) => setMembers(Number(e.target.value) || 0)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
                  Taux manuel € / adhérent (optionnel)
                </span>
                <AccInput
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  placeholder={`Auto ${volumeRateEurPerMember(members).toFixed(2)}`}
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
                  Remise commerciale %
                </span>
                <AccSelect
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                >
                  {[0, 5, 10, 15, 20].map((d) => (
                    <option key={d} value={d}>
                      {d} %
                    </option>
                  ))}
                </AccSelect>
              </label>
            </div>

            <div className="mt-4 space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
                Options
              </p>
              {CLUB_QUOTE_OPTIONS.map((opt) => {
                const on = selected.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle(opt.id)}
                    className={`flex w-full items-start gap-3 border px-3 py-2.5 text-left transition ${
                      on
                        ? "border-[var(--proday-accent)]/50 bg-[var(--acc-accent-soft)]"
                        : "border-[var(--acc-line)] hover:bg-white/[0.02]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border text-[10px] ${
                        on ? "border-[var(--proday-accent)] bg-[var(--proday-accent)] text-white" : "border-white/25"
                      }`}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm text-white">{opt.label}</span>
                        <AccStatus tone={opt.amountEur === 0 ? "neutral" : "info"}>
                          {opt.kind === "per_member"
                            ? `+${opt.amountEur.toFixed(2)} €/adh`
                            : opt.amountEur === 0
                              ? "inclus"
                              : `+${opt.amountEur} €/mois`}
                        </AccStatus>
                      </span>
                      <span className="mt-0.5 block text-[11px] text-white/40">{opt.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </AccPanel>
        </div>

        <div className="space-y-3 lg:col-span-5">
          <div className="grid grid-cols-2 gap-2">
            <AccMetric label="Mensuel net" value={formatEur(quote.netMonthly)} tone="teal" />
            <AccMetric
              label="Annuel (−20 %)"
              value={formatEur(quote.annualNet)}
              hint={`Économie ${formatEur(quote.annualSavings)}`}
              tone="amber"
            />
          </div>
          <AccPanel title="Lignes" description="Préparation devis — validation admin requise avant envoi client.">
            <ul className="divide-y divide-[var(--acc-line)] text-sm">
              {quote.lineItems.map((l) => (
                <li key={l.label} className="flex justify-between gap-3 py-2">
                  <span className="text-white/65">{l.label}</span>
                  <span className="font-mono tabular-nums text-white">{formatEur(l.amountEur)}</span>
                </li>
              ))}
              {quote.discountPercent > 0 ? (
                <li className="flex justify-between gap-3 py-2 text-amber-200/80">
                  <span>Remise {quote.discountPercent} %</span>
                  <span className="font-mono tabular-nums">
                    −{formatEur(quote.grossMonthly - quote.netMonthly)}
                  </span>
                </li>
              ) : null}
              <li className="flex justify-between gap-3 py-2.5 font-medium">
                <span className="text-white">Total mensuel</span>
                <span className="font-mono tabular-nums text-teal-300">
                  {formatEur(quote.netMonthly)}
                </span>
              </li>
            </ul>
            <div className="mt-3 space-y-2 border-t border-[var(--acc-line)] pt-3">
              <AccButton
                className="w-full"
                disabled={invoiceBusy}
                onClick={() => void sendStripeInvoiceFromQuote()}
              >
                {invoiceBusy
                  ? "Envoi Stripe…"
                  : "Enregistrer prix + envoyer Invoice"}
              </AccButton>
              <p className="text-[10px] text-white/35">
                Stripe Invoice réelle (mensuel net). Détail aussi sur{" "}
                <a href="/admin/finances" className="text-[var(--acc-steel)] hover:underline">
                  Finances
                </a>
                .
              </p>
              {invoiceMsg ? (
                <AccBanner tone={invoiceMsg.tone === "success" ? "success" : "error"}>
                  {invoiceMsg.text}
                </AccBanner>
              ) : null}
            </div>
          </AccPanel>
        </div>
      </div>
    </AccShell>
  );
}
