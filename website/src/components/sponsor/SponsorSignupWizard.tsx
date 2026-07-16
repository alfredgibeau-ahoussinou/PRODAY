"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Building2, Check, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  SPONSOR_BUDGET_RANGES,
  SPONSOR_CAMPAIGN_GOALS,
  SPONSOR_REGIONS,
  SPONSOR_SECTORS,
  SPONSOR_SIGNUP_STEPS,
  SPONSOR_SPORTS,
  SPONSOR_TARGET_AUDIENCES,
  type SponsorSignupPayload,
} from "@/lib/sponsorContent";

type StepId = (typeof SPONSOR_SIGNUP_STEPS)[number]["id"];

type FormState = {
  companyName: string;
  sector: string;
  contactName: string;
  budget: string;
  goals: string[];
  audience: string[];
  regions: string[];
  sports: string[];
  email: string;
  phone: string;
  message: string;
  logoFile: File | null;
};

const INITIAL: FormState = {
  companyName: "",
  sector: "",
  contactName: "",
  budget: "",
  goals: [],
  audience: [],
  regions: [],
  sports: [],
  email: "",
  phone: "",
  message: "",
  logoFile: null,
};

type SubmitState = "idle" | "loading" | "success" | "error";

function toggleInList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function ChipSelect({
  options,
  selected,
  onChange,
  max,
}: {
  options: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);
        const disabled = !active && max !== undefined && selected.length >= max;
        return (
          <button
            key={option}
            type="button"
            disabled={disabled}
            onClick={() => onChange(toggleInList(selected, option))}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/50"
                : disabled
                  ? "cursor-not-allowed bg-white/5 text-white/25"
                  : "bg-white/5 text-white/65 ring-1 ring-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-amber-100/80">
      {children}
      {required ? <span className="text-amber-400"> *</span> : null}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-xl border border-amber-500/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder: string;
  required?: boolean;
}) {
  return (
    <select
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full rounded-xl border border-amber-500/15 bg-black/40 px-4 py-3 text-white focus:border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
    >
      <option value="" className="bg-neutral-900">
        {placeholder}
      </option>
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-neutral-900">
          {opt}
        </option>
      ))}
    </select>
  );
}

function stepValid(step: StepId, form: FormState): boolean {
  switch (step) {
    case "company":
      return form.companyName.trim().length >= 2 && form.sector !== "" && form.contactName.trim().length >= 2;
    case "campaign":
      return form.budget !== "" && form.goals.length > 0 && form.audience.length > 0;
    case "targeting":
      return form.regions.length > 0 && form.sports.length > 0;
    case "contact":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    case "review":
      return true;
    default:
      return false;
  }
}

export function SponsorSignupWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const step = SPONSOR_SIGNUP_STEPS[stepIndex];
  const progress = ((stepIndex + 1) / SPONSOR_SIGNUP_STEPS.length) * 100;

  const patch = useCallback((partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const canProceed = useMemo(() => stepValid(step.id, form), [step.id, form]);

  function goNext() {
    if (!canProceed) return;
    setStepIndex((i) => Math.min(i + 1, SPONSOR_SIGNUP_STEPS.length - 1));
  }

  function goPrev() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSubmit() {
    if (!stepValid("contact", form)) return;

    setSubmitState("loading");
    setErrorMessage(null);

    const payload: SponsorSignupPayload = {
      companyName: form.companyName.trim(),
      sector: form.sector,
      contactName: form.contactName.trim(),
      budget: form.budget,
      goals: form.goals,
      audience: form.audience,
      regions: form.regions,
      sports: form.sports,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      logoFileName: form.logoFile?.name,
      message: form.message.trim() || undefined,
    };

    try {
      const res = await fetch("/api/sponsor/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };

      if (!res.ok) {
        setErrorMessage(data.error ?? "Inscription impossible. Réessayez.");
        setSubmitState("error");
        return;
      }

      setSubmitState("success");
    } catch {
      setErrorMessage("Connexion impossible. Vérifiez votre réseau.");
      setSubmitState("error");
    }
  }

  if (submitState === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-[#0c0a06] via-[#0a0a0f] to-black p-10 text-center shadow-[0_0_60px_rgba(212,175,55,0.08)]"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/15 ring-1 ring-amber-400/40">
          <Check size={32} className="text-amber-400" />
        </div>
        <h3 className="font-display mt-6 text-2xl font-bold text-white">Demande enregistrée</h3>
        <p className="mx-auto mt-3 max-w-md text-white/60">
          Merci {form.contactName.split(" ")[0]} — l&apos;équipe partenaires ProDay analyse votre dossier{" "}
          <strong className="text-amber-200/90">{form.companyName}</strong> sous 48 h ouvrées. Un email de
          confirmation a été envoyé à {form.email}.
        </p>
        <p className="mt-4 text-sm text-white/40">
          En parallèle, vous êtes inscrit sur la liste d&apos;attente avec le rôle Partenaire pour accéder à
          l&apos;app dès validation.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-[#0c0a06] via-[#0a0a0f] to-black shadow-[0_0_80px_rgba(212,175,55,0.06)]">
      {/* Progress bar */}
      <div className="border-b border-amber-500/10 px-6 py-5 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 ring-1 ring-amber-400/30">
              <Building2 size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/70">
                Inscription sponsor
              </p>
              <p className="font-display text-lg font-bold text-white">{step.title}</p>
            </div>
          </div>
          <span className="text-sm tabular-nums text-white/40">
            {stepIndex + 1} / {SPONSOR_SIGNUP_STEPS.length}
          </span>
        </div>
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="mt-4 hidden gap-2 sm:flex">
          {SPONSOR_SIGNUP_STEPS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => i < stepIndex && setStepIndex(i)}
              disabled={i > stepIndex}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                i === stepIndex
                  ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/40"
                  : i < stepIndex
                    ? "text-amber-400/60 hover:text-amber-300"
                    : "text-white/25"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="px-6 py-8 sm:px-10 sm:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step.id === "company" && (
              <div className="space-y-6">
                <p className="text-white/55">
                  Commençons par identifier votre marque. Ces informations servent à personnaliser votre espace
                  sponsor.
                </p>
                <div>
                  <FieldLabel required>Raison sociale / marque</FieldLabel>
                  <TextInput
                    value={form.companyName}
                    onChange={(v) => patch({ companyName: v })}
                    placeholder="Ex. SportVision France"
                    required
                  />
                </div>
                <div>
                  <FieldLabel required>Secteur d&apos;activité</FieldLabel>
                  <SelectInput
                    value={form.sector}
                    onChange={(v) => patch({ sector: v })}
                    options={SPONSOR_SECTORS}
                    placeholder="Sélectionnez un secteur"
                    required
                  />
                </div>
                <div>
                  <FieldLabel required>Contact principal</FieldLabel>
                  <TextInput
                    value={form.contactName}
                    onChange={(v) => patch({ contactName: v })}
                    placeholder="Prénom Nom — Responsable marketing"
                    required
                  />
                </div>
              </div>
            )}

            {step.id === "campaign" && (
              <div className="space-y-8">
                <p className="text-white/55">
                  Définissez vos objectifs pour que nous calibrions la formule adaptée à votre ambition.
                </p>
                <div>
                  <FieldLabel required>Budget mensuel estimé</FieldLabel>
                  <SelectInput
                    value={form.budget}
                    onChange={(v) => patch({ budget: v })}
                    options={SPONSOR_BUDGET_RANGES}
                    placeholder="Fourchette budgétaire"
                    required
                  />
                </div>
                <div>
                  <FieldLabel required>Objectifs de campagne</FieldLabel>
                  <p className="mt-1 text-xs text-white/40">Sélectionnez un ou plusieurs objectifs</p>
                  <div className="mt-3">
                    <ChipSelect
                      options={SPONSOR_CAMPAIGN_GOALS}
                      selected={form.goals}
                      onChange={(goals) => patch({ goals })}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel required>Public cible</FieldLabel>
                  <p className="mt-1 text-xs text-white/40">Qui souhaitez-vous toucher en priorité ?</p>
                  <div className="mt-3">
                    <ChipSelect
                      options={SPONSOR_TARGET_AUDIENCES}
                      selected={form.audience}
                      onChange={(audience) => patch({ audience })}
                    />
                  </div>
                </div>
              </div>
            )}

            {step.id === "targeting" && (
              <div className="space-y-8">
                <p className="text-white/55">
                  Précisez vos zones géographiques et disciplines pour un ciblage optimal de vos campagnes.
                </p>
                <div>
                  <FieldLabel required>Régions ciblées</FieldLabel>
                  <p className="mt-1 text-xs text-white/40">Sélectionnez une ou plusieurs régions</p>
                  <div className="mt-3">
                    <ChipSelect
                      options={SPONSOR_REGIONS}
                      selected={form.regions}
                      onChange={(regions) => patch({ regions })}
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel required>Catégories sportives</FieldLabel>
                  <p className="mt-1 text-xs text-white/40">Sur quels univers sportifs souhaitez-vous être visible ?</p>
                  <div className="mt-3">
                    <ChipSelect
                      options={SPONSOR_SPORTS}
                      selected={form.sports}
                      onChange={(sports) => patch({ sports })}
                    />
                  </div>
                </div>
              </div>
            )}

            {step.id === "contact" && (
              <div className="space-y-6">
                <p className="text-white/55">
                  Dernières informations pour finaliser votre dossier et activer votre accès.
                </p>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <FieldLabel required>Email professionnel</FieldLabel>
                    <TextInput
                      type="email"
                      value={form.email}
                      onChange={(v) => patch({ email: v })}
                      placeholder="contact@votremarque.fr"
                      required
                    />
                  </div>
                  <div>
                    <FieldLabel>Téléphone</FieldLabel>
                    <TextInput
                      type="tel"
                      value={form.phone}
                      onChange={(v) => patch({ phone: v })}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Logo de la marque (optionnel)</FieldLabel>
                  <p className="mt-1 text-xs text-white/40">PNG ou SVG — max. 2 Mo. Sera demandé si absent.</p>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={(e) => patch({ logoFile: e.target.files?.[0] ?? null })}
                    className="mt-2 block w-full text-sm text-white/50 file:mr-4 file:rounded-full file:border-0 file:bg-amber-400/15 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-200 hover:file:bg-amber-400/25"
                  />
                  {form.logoFile ? (
                    <p className="mt-2 text-xs text-amber-300/70">{form.logoFile.name}</p>
                  ) : null}
                </div>
                <div>
                  <FieldLabel>Message complémentaire</FieldLabel>
                  <textarea
                    value={form.message}
                    onChange={(e) => patch({ message: e.target.value })}
                    rows={3}
                    placeholder="Précisions sur votre projet, calendrier souhaité…"
                    className="mt-2 w-full resize-none rounded-xl border border-amber-500/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
              </div>
            )}

            {step.id === "review" && (
              <div className="space-y-6">
                <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                  <Sparkles size={20} className="mt-0.5 shrink-0 text-amber-400" />
                  <p className="text-sm text-amber-100/80">
                    Vérifiez votre dossier avant envoi. Notre équipe partenaires vous recontacte sous 48 h
                    ouvrées pour activer votre espace sponsor.
                  </p>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Marque", form.companyName],
                    ["Secteur", form.sector],
                    ["Contact", form.contactName],
                    ["Budget", form.budget],
                    ["Email", form.email],
                    ["Téléphone", form.phone || "—"],
                    ["Objectifs", form.goals.join(", ")],
                    ["Public cible", form.audience.join(", ")],
                    ["Régions", form.regions.join(", ")],
                    ["Sports", form.sports.join(", ")],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-amber-400/60">{label}</dt>
                      <dd className="mt-1 text-sm text-white/85">{value}</dd>
                    </div>
                  ))}
                </dl>
                {form.message ? (
                  <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-amber-400/60">Message</dt>
                    <dd className="mt-1 text-sm text-white/85">{form.message}</dd>
                  </div>
                ) : null}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {submitState === "error" && errorMessage ? (
          <p className="mt-6 text-sm text-red-300">{errorMessage}</p>
        ) : null}

        {/* Navigation */}
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-amber-500/10 pt-8">
          <button
            type="button"
            onClick={goPrev}
            disabled={stepIndex === 0 || submitState === "loading"}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white/60 transition hover:text-white disabled:invisible"
          >
            <ChevronLeft size={18} />
            Retour
          </button>

          {step.id !== "review" ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:from-amber-400 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuer
              <ChevronRight size={18} />
            </button>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
