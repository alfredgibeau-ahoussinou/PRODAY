"use client";

import {
  motion,
  AnimatePresence,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { RotateCcw, Sparkles, X } from "lucide-react";
import {
  CARD_ACTION_LABELS,
  CARD_ROLE_META,
  CARD_SOON_ACTIONS,
  type ProDayCardActionId,
  type ProDayCardBase,
} from "@/lib/prodayCards";
import { resolveFutSkin, type FutSkinMeta } from "@/lib/futSkins";

const ease = [0.22, 1, 0.36, 1] as const;

/** Legacy FUT silhouette — kept for any external refs. */
export const FUT_PATH =
  "M22 14 C22 8 28 4 40 4 L160 4 C172 4 178 8 178 14 L178 18 C178 26 184 32 192 36 L196 42 C198 48 198 56 198 64 L198 168 C198 208 158 242 100 272 C42 242 2 208 2 168 L2 64 C2 56 2 48 4 42 L8 36 C16 32 22 26 22 18 Z";

export const FUT_CLIP_CSS =
  "polygon(11% 1.5%, 89% 1.5%, 89% 5%, 96% 10%, 99% 16%, 99% 58%, 82% 86%, 50% 99%, 18% 86%, 1% 58%, 1% 16%, 4% 10%, 11% 5%)";

type FutCardShellProps = {
  card: ProDayCardBase;
  front: ReactNode;
  back: ReactNode;
  onAction?: (action: ProDayCardActionId) => void;
  formationLabel?: string;
};

function AnimatedStat({ value, active }: { value: number; active: boolean }) {
  const [display, setDisplay] = useState(active ? 0 : value);
  useEffect(() => {
    if (!active) {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const frames = 24;
    const id = window.setInterval(() => {
      frame += 1;
      const t = frame / frames;
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (frame >= frames) window.clearInterval(id);
    }, 20);
    return () => window.clearInterval(id);
  }, [value, active]);
  return <>{display}</>;
}

export function FutCardShell({
  card,
  front,
  back,
  onAction,
  formationLabel,
}: FutCardShellProps) {
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState(false);
  const [shine, setShine] = useState(false);
  const [pressing, setPressing] = useState(false);
  const reduce = useReducedMotion();
  const meta = CARD_ROLE_META[card.role];
  const skin = resolveFutSkin(card.tier, card.skinId);
  const tiltRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), {
    stiffness: 220,
    damping: 20,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-16, 16]), {
    stiffness: 220,
    damping: 20,
  });
  const glareX = useTransform(mx, [-0.5, 0.5], [12, 88]);
  const glareY = useTransform(my, [-0.5, 0.5], [12, 88]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.38), transparent 42%)`;

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (reduce || !tiltRef.current) return;
    const r = tiltRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onPointerLeave() {
    mx.set(0);
    my.set(0);
    setPressing(false);
  }

  function flip() {
    setFlipped((v) => !v);
    setShine(true);
    window.setTimeout(() => setShine(false), 900);
  }

  return (
    <>
      <motion.div
        className="mx-auto w-full max-w-[300px]"
        initial={reduce ? false : { opacity: 0, y: 32, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease }}
      >
        <div
          ref={tiltRef}
          onPointerMove={onPointerMove}
          onPointerLeave={onPointerLeave}
          onPointerDown={() => setPressing(true)}
          onPointerUp={() => setPressing(false)}
          className="relative"
          style={{ perspective: 1400 }}
        >
          <motion.div
            className="relative w-full"
            style={{
              aspectRatio: "1 / 1",
              rotateX: reduce ? 0 : rx,
              rotateY: reduce ? 0 : ry,
              transformStyle: "preserve-3d",
              scale: pressing && !reduce ? 0.97 : 1,
            }}
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              scale: { type: "spring", stiffness: 400, damping: 28 },
            }}
          >
            <motion.div
              className="absolute inset-0"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 24 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <SquareFace
                skin={skin}
                accent={card.accentHex}
                onActivate={flip}
                ariaLabel={`${card.displayName} — ${meta.label}. Toucher pour retourner.`}
              >
                {front}
                {!reduce ? (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-20 mix-blend-soft-light"
                    style={{ background: glareBg }}
                  />
                ) : null}
                <AnimatePresence>
                  {shine ? (
                    <motion.div
                      className="pointer-events-none absolute inset-0 z-30"
                      initial={{ x: "-130%", opacity: 0 }}
                      animate={{ x: "130%", opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.85, ease }}
                      style={{
                        background:
                          "linear-gradient(105deg, transparent 38%, rgba(255,255,255,0.55) 50%, transparent 62%)",
                      }}
                    />
                  ) : null}
                </AnimatePresence>
              </SquareFace>

              <SquareFace
                skin={skin}
                accent={card.accentHex}
                back
                onActivate={flip}
                ariaLabel={`Verso ${card.displayName}`}
              >
                {back}
              </SquareFace>
            </motion.div>

            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-3 left-1/2 h-6 w-[70%] -translate-x-1/2 rounded-full blur-xl"
              style={{ background: skin.glow }}
            />
          </motion.div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={flip}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70 transition hover:border-white/30 hover:text-white"
            >
              <RotateCcw size={12} />
              {flipped ? "Recto" : "Verso"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white transition"
              style={{ backgroundColor: card.accentHex }}
            >
              <Sparkles size={12} />
              Actions
            </button>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            {formationLabel ? (
              <span className="text-[11px] font-black uppercase tracking-[0.16em] text-white/80">
                {formationLabel}
                {card.verified ? " · ✓" : ""}
              </span>
            ) : null}
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">
              {card.editionLabel ?? skin.label} · {meta.label}
            </span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/85 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal
              initial={reduce ? false : { opacity: 0, y: 40, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: 24 }}
              transition={{ duration: 0.34, ease }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#09090c] p-5 shadow-2xl"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-50"
                style={{
                  background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${card.accentHex}55, transparent)`,
                }}
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 z-10 flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white/80"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
              <p className="relative font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                {meta.label} · {skin.label}
                {card.editionLabel ? ` · ${card.editionLabel}` : ""}
              </p>
              <h3 className="relative mt-2 font-display text-2xl text-white">
                {card.displayName}
              </h3>
              <div className="relative mt-5 flex flex-wrap gap-2">
                {card.actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      onAction?.(action);
                      if (action === "view_profile" || action === "view_club") {
                        setOpen(false);
                      }
                    }}
                    className="min-h-11 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
                    style={{
                      background:
                        action === "view_profile" ||
                        action === "view_club" ||
                        action === "share"
                          ? card.accentHex
                          : "rgba(255,255,255,0.08)",
                    }}
                  >
                    {CARD_ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
              <div className="relative mt-5 border-t border-white/10 pt-4">
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
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** Square face with skin chrome. */
function SquareFace({
  children,
  skin,
  accent,
  back,
  onActivate,
  ariaLabel,
}: {
  children: ReactNode;
  skin: FutSkinMeta;
  accent: string;
  back?: boolean;
  onActivate: () => void;
  ariaLabel: string;
}) {
  const uid = useId().replace(/:/g, "");
  return (
    <button
      type="button"
      onClick={onActivate}
      aria-label={ariaLabel}
      className={`absolute inset-0 overflow-hidden rounded-[1.35rem] text-left [backface-visibility:hidden] ${
        back ? "[transform:rotateY(180deg)]" : ""
      }`}
      style={{
        boxShadow: `0 28px 50px -18px ${skin.glow}, 0 0 0 1px ${accent}33`,
        background: `linear-gradient(155deg, ${skin.frame[0]}, ${skin.frame[1]} 48%, ${skin.frame[2]})`,
        color: skin.ink,
      }}
    >
      <div
        className="absolute inset-[3px] overflow-hidden rounded-[1.2rem]"
        style={{
          background: `linear-gradient(165deg, ${skin.face[0]}, ${skin.face[1]} 52%, ${skin.face[2]})`,
        }}
      >
        <FacePattern skin={skin} uid={uid} />
        <div className="relative z-10 h-full w-full">{children}</div>
      </div>
    </button>
  );
}

function FacePattern({ skin, uid }: { skin: FutSkinMeta; uid: string }) {
  if (skin.pattern === "rays" || skin.pattern === "hex" || skin.pattern === "shards") {
    return (
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
        viewBox="0 0 200 200"
        aria-hidden
      >
        <defs>
          <radialGradient id={`r-${uid}`} cx="55%" cy="28%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <circle cx="110" cy="70" r="110" fill={`url(#r-${uid})`} />
        {Array.from({ length: 22 }).map((_, i) => {
          const a = (i / 22) * Math.PI * 2 - Math.PI / 2;
          return (
            <line
              key={i}
              x1="110"
              y1="70"
              x2={110 + Math.cos(a) * 160}
              y2={70 + Math.sin(a) * 160}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={i % 2 ? 1.2 : 0.5}
            />
          );
        })}
      </svg>
    );
  }
  if (skin.pattern === "neon" || skin.pattern === "totw") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.04) 3px 4px)",
        }}
      />
    );
  }
  return null;
}

/**
 * Square face layout — rating badge, photo hero, name, 6 stats.
 */
export function FutFaceLayout({
  rating,
  position,
  flagLabel,
  clubLabel,
  leagueLabel,
  photoUrl,
  name,
  stats,
  ink,
  inkMuted: _inkMuted,
  divider,
  upgrade,
  plateColor: _plate,
}: {
  rating: number | string;
  position: string;
  flagLabel: string;
  clubLabel: string;
  leagueLabel?: string;
  photoUrl?: string | null;
  name: string;
  stats: Array<{ label: string; value: string | number }>;
  ink: string;
  inkMuted: string;
  divider: string;
  upgrade?: number;
  plateColor?: string;
}) {
  const clubCode = clubLabel.replace(/^FC\s+/i, "").slice(0, 2).toUpperCase();

  return (
    <div className="relative flex h-full w-full flex-col font-sans">
      {/* Photo zone */}
      <div className="relative min-h-0 flex-[1.15] overflow-hidden">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_18%]"
          />
        ) : (
          <div className="absolute inset-0 bg-black/25" />
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${ink}ee 0%, transparent 42%), linear-gradient(to right, ${ink}55 0%, transparent 28%)`,
            opacity: 0.55,
            mixBlendMode: "multiply",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" />

        {/* OVR / POS */}
        <div className="absolute left-3 top-3 z-10 flex flex-col items-center rounded-xl bg-black/35 px-2 py-1.5 backdrop-blur-sm">
          <span
            className="text-[1.85rem] font-black leading-none tabular-nums tracking-tight text-white"
            style={{ fontFamily: "var(--font-display), Arial Black, Impact, sans-serif" }}
          >
            {rating}
          </span>
          {upgrade != null && upgrade > 0 ? (
            <span className="text-[10px] font-black text-[#4ade80]">+{upgrade}</span>
          ) : null}
          <span className="mt-0.5 text-[11px] font-black uppercase tracking-wide text-white/90">
            {position}
          </span>
        </div>

        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1.5">
          {flagLabel === "FR" ? (
            <div className="flex h-4 w-6 overflow-hidden rounded-sm border border-white/30 shadow">
              <span className="w-1/3 bg-[#002395]" />
              <span className="w-1/3 bg-white" />
              <span className="w-1/3 bg-[#ED2939]" />
            </div>
          ) : (
            <span className="rounded bg-black/40 px-1.5 text-[10px] font-black text-white">
              {flagLabel}
            </span>
          )}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/90 text-[10px] font-black text-black shadow">
            {clubCode}
          </div>
        </div>
      </div>

      {/* Identity + stats */}
      <div className="relative z-10 shrink-0 px-3 pb-3 pt-2" style={{ color: ink }}>
        <p
          className="truncate text-center text-[1.05rem] font-black uppercase tracking-[0.06em]"
          style={{ fontFamily: "var(--font-display), Arial Black, Impact, sans-serif" }}
        >
          {name}
        </p>
        {leagueLabel ? (
          <p className="mt-0.5 truncate text-center text-[9px] font-semibold opacity-65">
            {leagueLabel} · {clubLabel}
          </p>
        ) : null}

        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {stats.slice(0, 6).map((s) => (
            <div
              key={s.label}
              className="rounded-lg px-1 py-1.5 text-center"
              style={{ background: "rgba(0,0,0,0.14)" }}
            >
              <p
                className="text-[0.95rem] font-black tabular-nums leading-none"
                style={{ fontFamily: "Arial Black, Impact, sans-serif" }}
              >
                {s.value}
              </p>
              <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide opacity-70">
                {s.label}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2 h-px w-full opacity-40" style={{ background: divider }} />
        <p className="mt-1.5 text-center text-[8px] font-semibold uppercase tracking-[0.18em] opacity-45">
          Toucher · Flip 3D
        </p>
      </div>
    </div>
  );
}

export function FutBackDetails({
  children,
  ink,
  animateStats,
}: {
  children: ReactNode;
  ink: string;
  animateStats?: boolean;
}) {
  void animateStats;
  return (
    <div
      className="flex h-full flex-col overflow-y-auto px-4 pb-4 pt-5 text-center"
      style={{ color: ink }}
    >
      {children}
    </div>
  );
}

export function StatChip({
  label,
  value,
  accent,
  animate,
}: {
  label: string;
  value: string | number;
  accent?: string;
  animate?: boolean;
}) {
  const numeric = typeof value === "number";
  return (
    <div className="rounded-lg bg-black/20 px-1.5 py-1.5 text-center">
      <p
        className="text-sm font-black tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {numeric && animate ? <AnimatedStat value={value} active /> : value}
      </p>
      <p className="text-[7px] font-bold uppercase opacity-70">{label}</p>
    </div>
  );
}

export function StatBar({
  label,
  value,
  max = 99,
  ink,
}: {
  label: string;
  value: number;
  max?: number;
  ink: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="text-left">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[9px] font-bold uppercase opacity-70">{label}</span>
        <span className="text-[11px] font-black tabular-nums">
          <AnimatedStat value={value} active />
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/20">
        <motion.div
          className="h-full rounded-full"
          style={{ background: ink }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease }}
        />
      </div>
    </div>
  );
}

export function clampStat(n: number) {
  return Math.max(40, Math.min(99, Math.round(n)));
}

export function nationCode(nationality: string) {
  const map: Record<string, string> = {
    France: "FR",
    Belgique: "BE",
    Espagne: "ES",
    Italie: "IT",
    Allemagne: "DE",
    Portugal: "PT",
    Brésil: "BR",
    Maroc: "MA",
    Sénégal: "SN",
    Algérie: "DZ",
  };
  return map[nationality] ?? nationality.slice(0, 2).toUpperCase();
}

export function FutSkinSwatch({ skin, active }: { skin: FutSkinMeta; active?: boolean }) {
  return (
    <div
      className={`relative aspect-square w-full overflow-hidden rounded-xl border transition ${
        active ? "scale-105 border-white shadow-lg" : "border-white/15 opacity-85 hover:opacity-100"
      }`}
      style={{
        background: `linear-gradient(165deg, ${skin.face[0]}, ${skin.face[1]} 50%, ${skin.face[2]})`,
      }}
    >
      <span
        className="absolute inset-x-0 bottom-2 text-center text-[7px] font-black uppercase"
        style={{ color: skin.ink }}
      >
        {skin.label.split(" ").pop()}
      </span>
    </div>
  );
}
