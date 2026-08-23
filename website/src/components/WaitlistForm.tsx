"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BETA_PITCH } from "@/lib/content";
import { IOS_BETA_LAUNCH_LABEL } from "@/lib/betaIosLaunch";
import { betaRoleLabel, type BetaRoleId } from "@/lib/betaWelcomeEmail";
import { POLE_BRAND_COLORS } from "@/lib/brandColors";
import { ROUTES } from "@/lib/routes";
import { saveWaitlistStatus } from "@/lib/waitlistStatusStorage";
import { readStoredReferralCode } from "./ReferralCapture";

type WaitlistFormProps = {
  fullPage?: boolean;
  compact?: boolean;
  minimal?: boolean;
  initialRole?: BetaRoleId;
};

type SubmitState = "idle" | "loading" | "success" | "error";
type WaitlistStatus = "pending" | "approved" | "rejected";

const ROLES: { id: BetaRoleId; label: string }[] = [
  { id: "player", label: "Joueur" },
  { id: "supporter", label: "Supporter" },
  { id: "coach", label: "Coach" },
  { id: "club", label: "Club" },
  { id: "sponsor", label: "Sponsor" },
];

/** Couleur pôle officielle par rôle bêta. */
const ROLE_POLE_COLOR: Record<BetaRoleId, string> = {
  player: POLE_BRAND_COLORS.joueur.accent,
  supporter: POLE_BRAND_COLORS.supporter.accent,
  coach: POLE_BRAND_COLORS.pro_staff.accent,
  club: POLE_BRAND_COLORS.pro_club.accent,
  sponsor: POLE_BRAND_COLORS.sponsor.accent,
};

function roleTextOnAccent(role: BetaRoleId): string {
  return role === "sponsor" ? "#0A0A0A" : "#FFFFFF";
}

const fieldClass =
  "min-h-12 w-full rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm text-white caret-[#5B75FF] placeholder:text-white/35 outline-none transition focus:border-[#5B75FF]/55 disabled:opacity-60";

/** Champs densifiés pour la page inscription dédiée. */
const fieldClassDense =
  "min-h-11 w-full border border-white/15 bg-[#0c0c0e] px-3.5 py-2.5 text-base text-white caret-[var(--proday-accent)] placeholder:text-white/35 outline-none transition focus:border-[var(--proday-accent)]/55 disabled:opacity-60 sm:min-h-10 sm:text-sm";

function primaryButtonStyle(role: BetaRoleId): React.CSSProperties {
  return {
    backgroundColor: ROLE_POLE_COLOR[role],
    color: roleTextOnAccent(role),
  };
}

const primaryBtnClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-full px-8 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[11rem]";

const primaryBtnClassDense =
  "inline-flex min-h-11 w-full items-center justify-center px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10";

export function WaitlistForm({
  fullPage,
  compact,
  minimal,
  initialRole,
}: WaitlistFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<BetaRoleId>(initialRole ?? "player");
  const [state, setState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus>("pending");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setErrorMessage("Email invalide. Vérifie le format.");
      setState("error");
      return;
    }

    setState("loading");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/beta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value,
          role,
          referral_code: readStoredReferralCode() ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        status?: WaitlistStatus;
        message?: string;
      };

      if (!res.ok) {
        setErrorMessage(data.error ?? "Inscription impossible. Réessaie.");
        setState("error");
        return;
      }

      const status =
        data.status === "approved" || data.status === "rejected"
          ? data.status
          : "pending";
      setWaitlistStatus(status);
      saveWaitlistStatus({ email: value, role, status });
      if (fullPage) {
        router.push(ROUTES.betaStatut);
        return;
      }
      setState("success");
    } catch {
      setErrorMessage("Connexion impossible. Vérifie ton réseau.");
      setState("error");
    }
  }

  if (minimal) {
    return (
      <section id="inscription" className="scroll-mt-28 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#5B75FF]">
              Bêta
            </p>
            <h2 className="font-display mt-3 text-3xl font-medium tracking-[-0.03em] text-white sm:text-4xl">
              Rejoins ProDay
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/55">
              {BETA_PITCH.summary}
            </p>
          </div>
          {state === "success" ? (
            <SuccessCard
              email={email}
              role={role}
              waitlistStatus={waitlistStatus}
            />
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4">
              <RolePills role={role} onChange={setRole} disabled={state === "loading"} />
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder="ton@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === "loading"}
                  aria-label="Adresse email"
                  className={`${fieldClass} flex-1`}
                />
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className={primaryBtnClass}
                  style={primaryButtonStyle(role)}
                >
                  {state === "loading" ? "Envoi…" : "Je m'inscris"}
                </button>
              </div>
              {state === "error" && errorMessage ? (
                <p className="text-sm text-red-300">{errorMessage}</p>
              ) : null}
            </form>
          )}
        </div>
      </section>
    );
  }

  const inputClass = fullPage ? fieldClassDense : fieldClass;
  const submitClass = fullPage ? primaryBtnClassDense : primaryBtnClass;

  return (
    <section
      id={fullPage ? undefined : "inscription"}
      className={
        fullPage
          ? ""
          : compact
            ? "scroll-mt-24 border-b border-white/10 bg-black py-14 md:py-16"
            : "scroll-mt-24 border-b border-white/10 bg-black py-20 sm:py-24"
      }
    >
      <div className={fullPage ? "" : "mx-auto max-w-3xl px-4 sm:px-6"}>
        {!fullPage ? (
          <div className="mb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#5B75FF]">
              Bêta
            </p>
            <h2 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium tracking-[-0.035em] text-white">
              Viens tester ProDay
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55">
              {BETA_PITCH.summary}
            </p>
          </div>
        ) : null}

        {state === "success" ? (
          <SuccessCard
            email={email}
            role={role}
            waitlistStatus={waitlistStatus}
          />
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className={fullPage ? "space-y-5" : "space-y-7"}
          >
            <div>
              <p
                id="beta-role-label"
                className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40 sm:text-[10px] sm:tracking-[0.2em]"
              >
                Qui es-tu ?
              </p>
              <div className={fullPage ? "mt-2.5" : "mt-4"}>
                <RolePills
                  role={role}
                  onChange={setRole}
                  disabled={state === "loading"}
                  dense={fullPage}
                  labelledBy="beta-role-label"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="beta-email"
                className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/40 sm:text-[10px] sm:tracking-[0.2em]"
              >
                Email
              </label>
              <div
                className={`mt-2.5 flex flex-col gap-2.5 ${
                  fullPage ? "" : "sm:mt-3 sm:flex-row sm:items-stretch sm:gap-3"
                }`}
              >
                <input
                  id="beta-email"
                  type="email"
                  required
                  autoComplete="email"
                  enterKeyHint="go"
                  placeholder="ton@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === "loading"}
                  aria-label="Adresse email"
                  className={`${inputClass} flex-1`}
                />
                {!fullPage ? (
                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className={submitClass}
                    style={primaryButtonStyle(role)}
                  >
                    {state === "loading" ? "Envoi…" : "Je m'inscris"}
                  </button>
                ) : null}
              </div>
            </div>

            {state === "error" && errorMessage ? (
              <p className="text-sm text-red-300">{errorMessage}</p>
            ) : null}

            {fullPage ? (
              <div className="sticky bottom-0 z-10 -mx-4 border-t border-white/10 bg-[#111114]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className={submitClass}
                  style={primaryButtonStyle(role)}
                >
                  {state === "loading" ? "Envoi…" : "Je m'inscris"}
                </button>
                <p className="mt-2 text-[10px] leading-relaxed text-white/30 sm:mt-3 sm:text-[11px] sm:text-white/35">
                  En t&apos;inscrivant, tu acceptes de recevoir des emails sur la
                  liste d&apos;attente ProDay. Désinscription possible à tout moment.
                </p>
              </div>
            ) : (
              <p className="text-[11px] leading-relaxed text-white/35 sm:text-xs">
                En t&apos;inscrivant, tu acceptes de recevoir des emails sur la
                liste d&apos;attente ProDay. Désinscription possible à tout moment.
              </p>
            )}
          </motion.form>
        )}
      </div>
    </section>
  );
}

function RolePills({
  role,
  onChange,
  disabled,
  dense = false,
  labelledBy,
}: {
  role: BetaRoleId;
  onChange: (id: BetaRoleId) => void;
  disabled?: boolean;
  dense?: boolean;
  labelledBy?: string;
}) {
  return (
    <div
      className={
        dense
          ? "grid grid-cols-2 gap-1.5 sm:grid-cols-3"
          : "grid grid-cols-2 gap-2 sm:grid-cols-3"
      }
      role="group"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : "Rôle"}
    >
      {ROLES.map((r) => {
        const active = role === r.id;
        const accent = ROLE_POLE_COLOR[r.id];
        return (
          <button
            key={r.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(r.id)}
            className={`min-h-10 px-2 font-mono text-[9px] uppercase tracking-[0.1em] transition disabled:opacity-60 sm:min-h-11 sm:px-3 sm:text-[10px] sm:tracking-[0.12em] ${
              dense ? "rounded-none py-2" : "rounded-full py-2.5"
            } ${
              active
                ? "font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                : "border bg-transparent text-white/55 hover:text-white"
            }`}
            style={
              active
                ? {
                    backgroundColor: accent,
                    color: roleTextOnAccent(r.id),
                    borderColor: accent,
                  }
                : {
                    borderColor: `${accent}55`,
                  }
            }
            onMouseEnter={(e) => {
              if (active || disabled) return;
              e.currentTarget.style.borderColor = accent;
              e.currentTarget.style.color = accent;
            }}
            onMouseLeave={(e) => {
              if (active || disabled) return;
              e.currentTarget.style.borderColor = `${accent}55`;
              e.currentTarget.style.color = "";
            }}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );
}

function SuccessCard({
  email,
  role,
  waitlistStatus,
}: {
  email: string;
  role: BetaRoleId;
  waitlistStatus: WaitlistStatus;
}) {
  const accent = ROLE_POLE_COLOR[role];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border p-6 sm:p-8"
      style={{
        borderColor: `${accent}55`,
        backgroundColor: `${accent}14`,
      }}
    >
      <p
        className="font-mono text-[10px] uppercase tracking-[0.22em]"
        style={{ color: accent }}
      >
        Confirmé
      </p>
      <p className="mt-3 font-display text-2xl font-medium tracking-[-0.02em] text-white">
        C&apos;est noté.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        Inscription confirmée pour <span className="text-white">{email}</span> (
        {betaRoleLabel(role)}).
        {waitlistStatus === "approved" ? (
          <> Check ta boîte mail (et les spams) pour le lien d&apos;accès à l&apos;espace bêta.</>
        ) : waitlistStatus === "rejected" ? (
          <> Cette adresse n&apos;est plus sur la liste. Contacte proday.admin@gmail.com si besoin.</>
        ) : (
          <>
            {" "}
            Statut : <span className="text-white">en attente</span>. Tu recevras un email dès
            validation, avec le lien programme / installer. Bêta iOS le{" "}
            {IOS_BETA_LAUNCH_LABEL}.
          </>
        )}
      </p>
      <Link
        href={ROUTES.betaStatut}
        className="mt-5 inline-flex text-sm font-medium text-[#5B75FF] underline-offset-4 hover:underline"
      >
        Voir mon statut
      </Link>
    </motion.div>
  );
}
