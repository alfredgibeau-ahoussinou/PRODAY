"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Building2, User, Award, Layers } from "lucide-react";
import { ChipSelect, FieldLabel, SelectInput, TextInput } from "@/components/sponsor/devis/DevisField";
import { DevisWizardShell } from "@/components/sponsor/devis/DevisWizardShell";
import { SponsorVisibilityWidget } from "@/components/sponsor/devis/SponsorVisibilityWidget";
import { useSponsorDevisForm } from "@/hooks/useSponsorDevisForm";
import {
  SPONSOR_BUDGET_RANGES,
  SPONSOR_CAMPAIGN_GOALS,
  SPONSOR_CONTACT_ROLES,
  SPONSOR_REGIONS,
  SPONSOR_SECTORS,
  SPONSOR_SPORTS,
  SPONSOR_TARGET_AUDIENCES,
  type SponsorPackageTier,
} from "@/lib/sponsorContent";
import { ROUTES } from "@/lib/routes";
import {
  isContactStepValid,
  isEntrepriseStepValid,
  isFormuleStepValid,
  isProjetStepValid,
} from "@/lib/sponsorDevisStorage";

const PACKAGE_OPTIONS: { id: SponsorPackageTier; label: string; price: string; hint: string }[] = [
  { id: "starter", label: "Découverte", price: "0 €", hint: "Tester la visibilité locale · 1 ville" },
  { id: "territorial", label: "Territorial", price: "49 €/mois", hint: "1 à plusieurs départements ciblés" },
  { id: "national", label: "National Pro", price: "99 €/mois", hint: "France entière · Push géolocalisé" },
  { id: "custom", label: "Sur mesure", price: "Sur devis", hint: "Dispositif multi-territoires dédié" },
];

export const PACKAGE_LABELS: Record<SponsorPackageTier, string> = {
  starter: "Découverte (0 €)",
  territorial: "Territorial (49 €/mois)",
  national: "National Pro (99 €/mois)",
  custom: "Sur mesure",
};

export function DevisIntroPage() {
  const searchParams = useSearchParams();
  const packageParam = searchParams.get("package");
  const startHref =
    packageParam && ["starter", "territorial", "national", "custom"].includes(packageParam)
      ? `${ROUTES.sponsorDevisEntreprise}?package=${packageParam}`
      : ROUTES.sponsorDevisEntreprise;

  return (
    <DevisWizardShell stepId="intro" hideNav>
      <div className="space-y-8">
        <div className="text-center sm:text-left space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/20">
            <Sparkles size={13} />
            <span>Simulateur & Devis interactif</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            Demandez votre devis ProDay Sponsor
          </h1>
          <p className="text-white/65 max-w-2xl leading-relaxed text-sm sm:text-base">
            Tunnel interactif en 4 étapes clés : qualifiez votre entreprise, choisissez votre formule, 
            estimez votre visibilité locale en temps réel et recevez votre proposition personnalisée sous 48 h ouvrées.
          </p>
        </div>

        {/* 4 Étapes visuelles du tunnel */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Building2 size={18} />
              <span className="font-mono text-xs font-bold uppercase">1. Marque</span>
            </div>
            <p className="mt-2 text-xs text-white/60">Raison sociale & secteur d&apos;activité</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <User size={18} />
              <span className="font-mono text-xs font-bold uppercase">2. Contact</span>
            </div>
            <p className="mt-2 text-xs text-white/60">Coordonnées directes & fonction</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Award size={18} />
              <span className="font-mono text-xs font-bold uppercase">3. Formule & ROI</span>
            </div>
            <p className="mt-2 text-xs text-white/60">Formule, budget & simulation instantanée</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <Layers size={18} />
              <span className="font-mono text-xs font-bold uppercase">4. Projet</span>
            </div>
            <p className="mt-2 text-xs text-white/60">Ciblage géographique, sports & validation</p>
          </div>
        </div>

        {/* Aperçu live simulation */}
        <SponsorVisibilityWidget
          packageTier={packageParam ?? "territorial"}
          regions={["Île de France"]}
          sports={["Football amateur"]}
          title="Aperçu du potentiel de visibilité"
        />

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2 sm:justify-start">
          <Link
            href={startHref}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-lg transition hover:from-amber-400 hover:to-amber-300"
          >
            Lancer le simulateur de devis
            <ArrowRight size={16} />
          </Link>
          <Link
            href={ROUTES.sponsor}
            className="inline-flex items-center justify-center rounded-full border border-amber-400/30 px-6 py-3.5 text-sm font-medium text-amber-200 transition hover:bg-amber-400/10"
          >
            Retour au pôle Sponsor
          </Link>
        </div>
      </div>
    </DevisWizardShell>
  );
}

export function DevisEntrepriseStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { form, patch, hydrated } = useSponsorDevisForm({
    seedPackage: searchParams.get("package"),
  });
  const valid = useMemo(() => isEntrepriseStepValid(form), [form]);

  if (!hydrated) {
    return (
      <DevisWizardShell stepId="entreprise" hideNav>
        <p className="text-white/50">Chargement…</p>
      </DevisWizardShell>
    );
  }

  return (
    <DevisWizardShell
      stepId="entreprise"
      onBackHref={ROUTES.sponsorDevis}
      nextDisabled={!valid}
      onNext={() => router.push(ROUTES.sponsorDevisContact)}
    >
      <div className="space-y-6">
        <div>
          <FieldLabel required>Raison sociale / marque</FieldLabel>
          <TextInput
            value={form.companyName}
            onChange={(v) => patch({ companyName: v })}
            placeholder="Ex. SportVision France"
            required
            autoComplete="organization"
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

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs text-white/60">
          💡 <strong className="text-amber-300">Votre identité de marque</strong> sera mise en avant auprès des clubs affiliés ProDay de votre zone de chalandise.
        </div>
      </div>
    </DevisWizardShell>
  );
}

export function DevisContactStep() {
  const router = useRouter();
  const { form, patch, hydrated } = useSponsorDevisForm();
  const valid = useMemo(() => isContactStepValid(form), [form]);

  useEffect(() => {
    if (hydrated && !isEntrepriseStepValid(form)) {
      router.replace(ROUTES.sponsorDevisEntreprise);
    }
  }, [form, hydrated, router]);

  if (!hydrated || !isEntrepriseStepValid(form)) {
    return (
      <DevisWizardShell stepId="contact" hideNav>
        <p className="text-white/50">Chargement…</p>
      </DevisWizardShell>
    );
  }

  return (
    <DevisWizardShell
      stepId="contact"
      onBackHref={ROUTES.sponsorDevisEntreprise}
      nextDisabled={!valid}
      onNext={() => router.push(ROUTES.sponsorDevisFormule)}
    >
      <div className="space-y-6">
        <div>
          <FieldLabel required>Nom du contact</FieldLabel>
          <TextInput
            value={form.contactName}
            onChange={(v) => patch({ contactName: v })}
            placeholder="Prénom Nom"
            required
            autoComplete="name"
          />
        </div>
        <div>
          <FieldLabel>Fonction</FieldLabel>
          <SelectInput
            value={form.contactRole}
            onChange={(v) => patch({ contactRole: v })}
            options={SPONSOR_CONTACT_ROLES}
            placeholder="Votre rôle dans l'entreprise"
          />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <FieldLabel required>Email professionnel</FieldLabel>
            <TextInput
              type="email"
              value={form.email}
              onChange={(v) => patch({ email: v })}
              placeholder="contact@votremarque.fr"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <FieldLabel>Téléphone</FieldLabel>
            <TextInput
              type="tel"
              value={form.phone}
              onChange={(v) => patch({ phone: v })}
              placeholder="+33 6 12 34 56 78"
              autoComplete="tel"
            />
          </div>
        </div>
      </div>
    </DevisWizardShell>
  );
}

export function DevisFormuleStep() {
  const router = useRouter();
  const { form, patch, hydrated } = useSponsorDevisForm();
  const valid = useMemo(() => isFormuleStepValid(form), [form]);

  useEffect(() => {
    if (hydrated && !isContactStepValid(form)) {
      router.replace(ROUTES.sponsorDevisContact);
    }
  }, [form, hydrated, router]);

  if (!hydrated || !isContactStepValid(form)) {
    return (
      <DevisWizardShell stepId="formule" hideNav>
        <p className="text-white/50">Chargement…</p>
      </DevisWizardShell>
    );
  }

  return (
    <DevisWizardShell
      stepId="formule"
      onBackHref={ROUTES.sponsorDevisContact}
      nextDisabled={!valid}
      onNext={() => router.push(ROUTES.sponsorDevisProjet)}
    >
      <div className="space-y-8">
        <div>
          <FieldLabel required>Formule d&apos;intérêt</FieldLabel>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {PACKAGE_OPTIONS.map((opt) => {
              const active = form.packageTier === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patch({ packageTier: opt.id })}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? "border-amber-400/60 bg-amber-400/10 ring-1 ring-amber-400/40"
                      : "border-white/10 bg-white/[0.02] hover:border-amber-400/30"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-display font-bold text-white text-base">{opt.label}</p>
                    <span className="font-mono text-xs font-bold text-amber-400">{opt.price}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-white/55 leading-relaxed">{opt.hint}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <FieldLabel required>Budget mensuel envisagé</FieldLabel>
          <SelectInput
            value={form.budget}
            onChange={(v) => patch({ budget: v })}
            options={SPONSOR_BUDGET_RANGES}
            placeholder="Fourchette budgétaire"
            required
          />
        </div>

        {/* Estimation de visibilité réactive */}
        <SponsorVisibilityWidget
          packageTier={form.packageTier}
          regions={form.regions}
          sports={form.sports}
          budget={form.budget}
          title={`Estimation d'impact · Formule ${PACKAGE_LABELS[form.packageTier]}`}
        />
      </div>
    </DevisWizardShell>
  );
}

export function DevisProjetStep() {
  const router = useRouter();
  const { form, patch, hydrated } = useSponsorDevisForm();
  const valid = useMemo(() => isProjetStepValid(form), [form]);

  useEffect(() => {
    if (hydrated && !isFormuleStepValid(form)) {
      router.replace(ROUTES.sponsorDevisFormule);
    }
  }, [form, hydrated, router]);

  if (!hydrated || !isFormuleStepValid(form)) {
    return (
      <DevisWizardShell stepId="projet" hideNav>
        <p className="text-white/50">Chargement…</p>
      </DevisWizardShell>
    );
  }

  return (
    <DevisWizardShell
      stepId="projet"
      onBackHref={ROUTES.sponsorDevisFormule}
      nextDisabled={!valid}
      onNext={() => router.push(ROUTES.sponsorDevisRecap)}
    >
      <div className="space-y-8">
        <div>
          <FieldLabel required>Objectifs de campagne</FieldLabel>
          <p className="mt-1 text-xs text-white/40">Sélectionnez au moins un objectif principal</p>
          <div className="mt-3">
            <ChipSelect
              options={SPONSOR_CAMPAIGN_GOALS}
              selected={form.goals}
              onChange={(goals) => patch({ goals })}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Régions ciblées (calcul instantané du rayonnement)</FieldLabel>
          <p className="mt-1 text-xs text-white/40">Sélectionnez vos zones géographiques prioritaires</p>
          <div className="mt-3">
            <ChipSelect
              options={SPONSOR_REGIONS}
              selected={form.regions}
              onChange={(regions) => patch({ regions })}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Disciplines & catégories ciblées</FieldLabel>
          <div className="mt-3">
            <ChipSelect
              options={SPONSOR_SPORTS}
              selected={form.sports}
              onChange={(sports) => patch({ sports })}
            />
          </div>
        </div>

        <div>
          <FieldLabel>Public cible prioritaire</FieldLabel>
          <div className="mt-3">
            <ChipSelect
              options={SPONSOR_TARGET_AUDIENCES}
              selected={form.audience}
              onChange={(audience) => patch({ audience })}
            />
          </div>
        </div>

        {/* Live impact widget mis à jour selon ciblage */}
        <SponsorVisibilityWidget
          packageTier={form.packageTier}
          regions={form.regions}
          sports={form.sports}
          budget={form.budget}
          title="Projection finale de visibilité locale"
        />

        <div>
          <FieldLabel>Message complémentaire ou besoins spécifiques</FieldLabel>
          <textarea
            value={form.message}
            onChange={(e) => patch({ message: e.target.value })}
            rows={4}
            placeholder="Précisions sur votre marque, calendrier d'activation souhaité, opérations de dotation..."
            className="mt-2 w-full resize-none rounded-xl border border-amber-500/15 bg-black/40 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/20 text-sm"
          />
        </div>
      </div>
    </DevisWizardShell>
  );
}
