"use client";

import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  buildPassportExtras,
  buildPassportStats,
  footIcon,
  PASSPORT_BADGE_META,
  PASSPORT_CLIP,
  PASSPORT_TIERS,
  resolvePassportTier,
  resolvePerformanceBadges,
  statColor,
  type PassportTierId,
} from "@/lib/prodayPassport";
import type { ProDayCardActionId, ProDayPlayerCardData } from "@/lib/prodayCards";
import { CARD_ACTION_LABELS, CARD_SOON_ACTIONS } from "@/lib/prodayCards";
import { nationCode } from "@/components/cards/FutCardShell";

type Props = {
  card: ProDayPlayerCardData;
  tierOverride?: PassportTierId;
  onAction?: (action: ProDayCardActionId) => void;
  /** Ouvre déjà en mode détail */
  defaultOpen?: boolean;
};

function AnimatedValue({ value, active }: { value: number; active: boolean }) {
  const [display, setDisplay] = useState(active ? 0 : value);
  useEffect(() => {
    if (!active) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const frames = 28;
    const id = window.setInterval(() => {
      frame += 1;
      const t = frame / frames;
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (frame >= frames) window.clearInterval(id);
    }, 22);
    return () => window.clearInterval(id);
  }, [value, active]);
  return <>{display}</>;
}

export function ProDayPassportCard({
  card,
  tierOverride,
  onAction,
  defaultOpen = false,
}: Props) {
  const theme = resolvePassportTier(card, tierOverride);
  const stats = buildPassportStats(card);
  const badges = resolvePerformanceBadges(card);
  const extras = buildPassportExtras(card);
  const [open, setOpen] = useState(defaultOpen);
  const [shine, setShine] = useState(false);
  const reduce = useReducedMotion();

  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 180, damping: 18 });

  function onPointerMove(e: ReactPointerEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onPointerLeave() {
    mx.set(0);
    my.set(0);
  }

  function openCard() {
    setOpen(true);
    setShine(true);
    window.setTimeout(() => setShine(false), 1400);
  }

  const ink = theme.ink;
  const clubCode = card.clubName.replace(/^FC\s+/i, "").slice(0, 2).toUpperCase();

  return (
    <>
      <div className="mx-auto w-full max-w-[300px]">
        <div
          ref={ref}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          className="relative w-full"
          style={{ perspective: 1200, background: "transparent" }}
        >
          <motion.button
            type="button"
            onClick={openCard}
            className="relative block w-full text-left"
            aria-label={`Passeport ${card.displayName}`}
            whileHover={reduce ? undefined : { scale: 1.02 }}
            animate={reduce ? undefined : { y: [0, -5, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          >
          <motion.div
            className="relative w-full"
            style={{
              aspectRatio: "3 / 4.35",
              rotateX: reduce ? 0 : rx,
              rotateY: reduce ? 0 : ry,
              transformStyle: "preserve-3d",
              filter: `drop-shadow(0 24px 40px ${theme.glow})`,
            }}
          >
            {/* Shell */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: PASSPORT_CLIP,
                WebkitClipPath: PASSPORT_CLIP,
                background: `linear-gradient(155deg, ${theme.frame[0]}, ${theme.frame[1]} 45%, ${theme.frame[2]})`,
                boxShadow: theme.neon
                  ? `0 0 0 1px ${theme.neon}88, 0 0 28px ${theme.neon}55`
                  : `inset 0 1px 0 rgba(255,255,255,0.35)`,
              }}
            >
              {/* Face */}
              <div
                className="absolute inset-[3px] overflow-hidden"
                style={{
                  clipPath: PASSPORT_CLIP,
                  WebkitClipPath: PASSPORT_CLIP,
                  background: theme.carbon
                    ? `
                      radial-gradient(circle at 30% 20%, ${theme.neon}33, transparent 45%),
                      repeating-linear-gradient(0deg, #111 0 1px, #0a0a0a 1px 3px),
                      repeating-linear-gradient(90deg, #151515 0 1px, #0c0c0c 1px 3px),
                      linear-gradient(160deg, ${theme.face[0]}, ${theme.face[1]}, ${theme.face[2]})
                    `
                    : `linear-gradient(165deg, ${theme.face[0]}, ${theme.face[1]} 52%, ${theme.face[2]})`,
                  color: ink,
                }}
              >
                {/* Holo / metallic sheen */}
                {theme.holographic ? (
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
                    style={{
                      background:
                        "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.55) 48%, transparent 62%), linear-gradient(200deg, #67e8f955, #c084fc44, #f472b655)",
                      backgroundSize: "200% 200%",
                      animation: reduce ? undefined : "prodayHolo 7s ease-in-out infinite",
                    }}
                  />
                ) : null}

                {/* Particles */}
                {!reduce ? (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute h-1 w-1 rounded-full bg-white/70"
                        style={{
                          left: `${8 + ((i * 17) % 84)}%`,
                          top: `${12 + ((i * 23) % 70)}%`,
                          animation: `prodaySpark ${3 + (i % 4)}s ease-in-out ${i * 0.35}s infinite`,
                          opacity: 0.35,
                        }}
                      />
                    ))}
                  </div>
                ) : null}

                {/* Shine sweep */}
                <AnimatePresence>
                  {shine ? (
                    <motion.div
                      className="pointer-events-none absolute inset-0 z-30"
                      initial={{ x: "-120%", opacity: 0 }}
                      animate={{ x: "120%", opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.55) 50%, transparent 65%)",
                      }}
                    />
                  ) : null}
                </AnimatePresence>

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col px-3 pb-3 pt-3">
                  {/* Tier chip */}
                  <div className="mb-1 flex items-center justify-between">
                    <span
                      className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em]"
                      style={{
                        background: theme.neon ? `${theme.neon}33` : "rgba(0,0,0,0.18)",
                        color: theme.neon ?? ink,
                        border: theme.neon ? `1px solid ${theme.neon}88` : "none",
                      }}
                    >
                      {theme.label}
                    </span>
                    {card.verified ? (
                      <span
                        className="rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wide"
                        style={{ background: "#0054F0", color: "#fff" }}
                      >
                        ✓ ProDay
                      </span>
                    ) : null}
                  </div>

                  {/* Top: OVR + meta + photo */}
                  <div className="relative flex min-h-0 flex-[1.15] gap-2">
                    <div className="z-10 flex w-[30%] shrink-0 flex-col items-center pt-1">
                      <span
                        className="text-[2.4rem] font-black leading-none tabular-nums"
                        style={{
                          fontFamily: "var(--font-display), Arial Black, Impact, sans-serif",
                          textShadow: theme.neon ? `0 0 12px ${theme.neon}` : undefined,
                        }}
                      >
                        <AnimatedValue value={card.overall} active={shine || open} />
                      </span>
                      <span className="mt-0.5 text-[0.75rem] font-black uppercase tracking-wide">
                        {card.primaryPosition}
                      </span>
                      <div className="mt-2 flex flex-col items-center gap-1.5">
                        {card.nationality === "France" ? (
                          <div className="flex h-3.5 w-5 overflow-hidden rounded-[1px] border border-black/30">
                            <span className="w-1/3 bg-[#002395]" />
                            <span className="w-1/3 bg-white" />
                            <span className="w-1/3 bg-[#ED2939]" />
                          </div>
                        ) : (
                          <span className="text-[9px] font-black">{nationCode(card.nationality)}</span>
                        )}
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full border text-[9px] font-black"
                          style={{
                            borderColor: `${ink}55`,
                            background: "rgba(255,255,255,0.35)",
                          }}
                        >
                          {clubCode}
                        </div>
                        <span className="text-[9px] font-bold opacity-80">{footIcon(card.strongFoot)}</span>
                      </div>
                    </div>

                    <div className="relative min-h-0 flex-1 overflow-hidden rounded-tl-2xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={card.photoUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover object-[center_12%]"
                        style={{
                          maskImage:
                            "linear-gradient(to bottom, #000 58%, transparent 100%), radial-gradient(ellipse at 50% 40%, #000 55%, transparent 78%)",
                          WebkitMaskImage:
                            "linear-gradient(to bottom, #000 58%, transparent 100%), radial-gradient(ellipse at 50% 40%, #000 55%, transparent 78%)",
                          maskComposite: "intersect",
                          WebkitMaskComposite: "source-in",
                        }}
                      />
                      <div
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: `linear-gradient(to top, ${theme.face[2]}cc, transparent 40%)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Center identity */}
                  <div className="mt-1 shrink-0 text-center">
                    <p
                      className="truncate text-[1.05rem] font-black uppercase tracking-[0.05em]"
                      style={{
                        fontFamily: "var(--font-display), Arial Black, Impact, sans-serif",
                      }}
                    >
                      {card.lastName}
                    </p>
                    <p className="mt-0.5 text-[9px] font-semibold opacity-75">
                      {card.age} ans · {card.heightCm} cm · {card.weightKg} kg
                    </p>
                    <p className="mt-0.5 truncate text-[9px] font-bold opacity-80">
                      {card.league} · {card.clubName}
                    </p>
                  </div>

                  {/* Badges */}
                  {badges.length ? (
                    <div className="mt-2 flex flex-wrap justify-center gap-1">
                      {badges.slice(0, 4).map((id) => {
                        const meta = PASSPORT_BADGE_META[id];
                        return (
                          <span
                            key={id}
                            className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
                            style={{
                              background: "rgba(0,0,0,0.18)",
                              color: ink,
                            }}
                            title={meta.label}
                          >
                            {meta.icon} {meta.label}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}

                  {/* Stats with bars */}
                  <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1.5">
                    {stats.map((s, i) => {
                      const color = statColor(s.value);
                      return (
                        <motion.div
                          key={s.key}
                          initial={false}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 * i }}
                          className="min-w-0"
                        >
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="truncate text-[9px] font-bold opacity-80">
                              {s.icon} {s.label}
                            </span>
                            <span
                              className="text-[11px] font-black tabular-nums"
                              style={{ color }}
                            >
                              <AnimatedValue value={s.value} active={shine} />
                            </span>
                          </div>
                          <div
                            className="mt-0.5 h-1 overflow-hidden rounded-full"
                            style={{ background: "rgba(0,0,0,0.2)" }}
                          >
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${s.value}%` }}
                              transition={{ duration: 0.7, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  <p className="mt-auto pt-2 text-center text-[8px] font-semibold uppercase tracking-[0.16em] opacity-50">
                    Passeport numérique · Toucher
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          </motion.button>
        </div>
      </div>

      {/* Detail modal — dashboard passeport */}
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-3 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal
              initial={{ opacity: 0, scale: 0.92, rotateY: -8, y: 24 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-[#07070a] p-5 shadow-2xl sm:p-6"
              style={{
                boxShadow: theme.neon
                  ? `0 0 60px ${theme.neon}44`
                  : `0 0 50px ${theme.glow}`,
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-40"
                style={{
                  background: `radial-gradient(circle at 20% 0%, ${theme.accent}55, transparent 50%)`,
                }}
              />

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">
                      Passeport · {theme.label}
                    </p>
                    <h3 className="mt-1 font-display text-2xl text-white">{card.displayName}</h3>
                    <p className="mt-1 text-sm text-white/55">
                      {card.primaryPosition} · OVR {card.overall} · Pot. {card.potential}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/70"
                  >
                    Fermer
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { l: "Forme", v: `${extras.formPct}%` },
                    { l: "Potentiel", v: extras.potential },
                    { l: "Progression IA", v: extras.aiProgressLabel },
                    { l: "État physique", v: extras.physicalState },
                    { l: "Visibilité", v: extras.recruiterVisibility },
                    { l: "Valeur", v: extras.estimatedValue },
                    { l: "Discipline", v: extras.disciplineScore },
                    { l: "Présence", v: `${extras.attendancePct}%` },
                    { l: "Recrutement", v: extras.recruitmentStatus },
                  ].map((row) => (
                    <div
                      key={row.l}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">
                        {row.l}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">{row.v}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">
                    Heatmap
                  </p>
                  <p className="mt-1 text-sm text-white/80">{extras.heatmapHint}</p>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">
                    Derniers matchs
                  </p>
                  <ul className="mt-2 space-y-1">
                    {extras.lastMatches.map((m) => (
                      <li key={m} className="text-sm text-white/75">
                        · {m}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-white/40">
                    Objectifs IA
                  </p>
                  <ul className="mt-2 space-y-1">
                    {extras.objectives.map((o) => (
                      <li key={o} className="text-sm text-white/75">
                        · {o}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {card.actions.map((action) => (
                    <button
                      key={action}
                      type="button"
                      onClick={() => {
                        onAction?.(action);
                        if (action === "view_profile") setOpen(false);
                      }}
                      className="min-h-11 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white"
                      style={{
                        background:
                          action === "view_profile" || action === "recruit"
                            ? theme.neon ?? card.accentHex
                            : "rgba(255,255,255,0.08)",
                      }}
                    >
                      {CARD_ACTION_LABELS[action]}
                    </button>
                  ))}
                </div>
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                    Bientôt
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CARD_SOON_ACTIONS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        disabled
                        className="min-h-11 cursor-not-allowed rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white/30"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes prodayHolo {
          0%, 100% { background-position: 0% 40%; }
          50% { background-position: 100% 60%; }
        }
        @keyframes prodaySpark {
          0%, 100% { opacity: 0.15; transform: translateY(0); }
          50% { opacity: 0.7; transform: translateY(-6px); }
        }
      `,
        }}
      />
    </>
  );
}

/** Sélecteur de niveaux pour la galerie */
export function PassportTierPicker({
  value,
  onChange,
}: {
  value: PassportTierId | "auto";
  onChange: (v: PassportTierId | "auto") => void;
}) {
  const ids: Array<PassportTierId | "auto"> = [
    "auto",
    "bronze",
    "silver",
    "gold",
    "platinum",
    "diamond",
    "legend",
    "premium",
  ];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
      {ids.map((id) => {
        const label = id === "auto" ? "Auto" : PASSPORT_TIERS[id].label;
        const on = value === id;
        const accent = id === "auto" ? "#4C8BFF" : PASSPORT_TIERS[id].accent;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`min-h-11 shrink-0 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide ${
              on ? "text-black" : "border border-white/15 text-white/60"
            }`}
            style={on ? { background: accent } : undefined}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
