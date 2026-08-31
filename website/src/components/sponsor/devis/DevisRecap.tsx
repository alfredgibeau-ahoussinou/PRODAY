"use client";

import { Check, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PACKAGE_LABELS } from "@/components/sponsor/devis/DevisSteps";
import { DevisWizardShell } from "@/components/sponsor/devis/DevisWizardShell";
import { useSponsorDevisForm } from "@/hooks/useSponsorDevisForm";
import { SPONSOR_PARTNER_CONTACT_EMAIL } from "@/lib/content";
import { ROUTES } from "@/lib/routes";
import {
  clearSponsorDevisState,
  isContactStepValid,
  isEntrepriseStepValid,
  isFormuleStepValid,
  isProjetStepValid,
} from "@/lib/sponsorDevisStorage";

type SubmitState = "idle" | "loading" | "error";

export function DevisRecapStep() {
  const router = useRouter();
  const { form, hydrated } = useSponsorDevisForm();
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!isEntrepriseStepValid(form) || !isContactStepValid(form)) {
      router.replace(ROUTES.sponsorDevisEntreprise);
      return;
    }
    if (!isFormuleStepValid(form) || !isProjetStepValid(form)) {
      router.replace(ROUTES.sponsorDevisProjet);
    }
  }, [form, hydrated, router]);

  async function handleSubmit() {
    if (
      !isEntrepriseStepValid(form) ||
      !isContactStepValid(form) ||
      !isFormuleStepValid(form) ||
      !isProjetStepValid(form)
    ) {
      return;
    }

    setSubmitState("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/sponsor/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          sector: form.sector,
          contactName: form.contactName.trim(),
          contactRole: form.contactRole || undefined,
          contactEmail: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          packageTier: form.packageTier,
          budget: form.budget,
          goals: form.goals,
          audience: form.audience,
          regions: form.regions,
          sports: form.sports,
          message: form.message.trim() || undefined,
          source: "website",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setErrorMessage(data.error ?? "Envoi impossible. Réessayez.");
        setSubmitState("error");
        return;
      }

      clearSponsorDevisState();
      const firstName = encodeURIComponent(form.contactName.trim().split(/\s+/)[0] ?? "");
      const company = encodeURIComponent(form.companyName.trim());
      router.push(
        `${ROUTES.sponsorDevisConfirmation}?name=${firstName}&company=${company}`,
      );
    } catch {
      setErrorMessage("Connexion impossible. Vérifiez votre réseau.");
      setSubmitState("error");
    }
  }

  if (!hydrated) {
    return (
      <DevisWizardShell stepId="recap" hideNav>
        <p className="text-white/50">Chargement…</p>
      </DevisWizardShell>
    );
  }

  return (
    <DevisWizardShell
      stepId="recap"
      onBackHref={ROUTES.sponsorDevisProjet}
      hideNav={false}
      footer={
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitState === "loading"}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-8 py-3 text-sm font-bold text-slate-950 transition hover:from-amber-400 hover:to-amber-300 disabled:opacity-60"
        >
          {submitState === "loading" ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              Envoyer ma demande
              <Check size={18} />
            </>
          )}
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
          <Sparkles size={20} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-100/80">
            Votre demande sera envoyée à{" "}
            <strong className="text-amber-200">{SPONSOR_PARTNER_CONTACT_EMAIL}</strong>. Réponse
            sous 48 h ouvrées.
          </p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["Formule", PACKAGE_LABELS[form.packageTier]],
              ["Marque", form.companyName],
              ["Secteur", form.sector],
              ["Contact", form.contactName],
              ["Fonction", form.contactRole || "…"],
              ["Email", form.email],
              ["Téléphone", form.phone || "…"],
              ["Budget", form.budget],
              ["Objectifs", form.goals.join(", ") || "…"],
              ["Public cible", form.audience.join(", ") || "…"],
              ["Régions", form.regions.join(", ") || "…"],
              ["Sports", form.sports.join(", ") || "…"],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-amber-400/60">
                {label}
              </dt>
              <dd className="mt-1 text-sm text-white/85">{value}</dd>
            </div>
          ))}
        </dl>

        {form.message ? (
          <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400/60">
              Message
            </p>
            <p className="mt-1 text-sm text-white/85">{form.message}</p>
          </div>
        ) : null}

        {submitState === "error" && errorMessage ? (
          <p className="text-sm text-red-300">{errorMessage}</p>
        ) : null}
      </div>
    </DevisWizardShell>
  );
}

export function DevisConfirmationPage() {
  return (
    <DevisWizardShell stepId="confirmation" hideNav>
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/15 ring-1 ring-amber-400/40">
          <Check size={32} className="text-amber-400" />
        </div>
        <h1 className="font-display mt-6 text-2xl font-bold text-white sm:text-3xl">
          Demande envoyée
        </h1>
        <Suspense fallback={<p className="mx-auto mt-3 max-w-md text-white/60">Merci. L&apos;équipe partenaires ProDay a bien reçu votre demande.</p>}>
          <ConfirmationCopy />
        </Suspense>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={ROUTES.sponsor}
            className="inline-flex rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:from-amber-400 hover:to-amber-300"
          >
            Retour au pôle Sponsor
          </Link>
          <a
            href={`mailto:${SPONSOR_PARTNER_CONTACT_EMAIL}`}
            className="inline-flex rounded-full border border-amber-400/30 px-6 py-3 text-sm font-medium text-amber-200 transition hover:bg-amber-400/10"
          >
            Écrire à l&apos;équipe
          </a>
        </div>
      </div>
    </DevisWizardShell>
  );
}

function ConfirmationCopy() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "";
  const company = searchParams.get("company") ?? "";

  return (
    <p className="mx-auto mt-3 max-w-md text-white/60">
      {name ? (
        <>
          Merci {name}.{" "}
        </>
      ) : (
        "Merci. "
      )}
      L&apos;équipe partenaires ProDay a bien reçu
      {company ? (
        <>
          {" "}
          votre dossier <strong className="text-amber-200/90">{company}</strong>
        </>
      ) : (
        " votre demande"
      )}
      . Un email a été transmis à {SPONSOR_PARTNER_CONTACT_EMAIL}. Réponse sous 48 h ouvrées.
    </p>
  );
}
