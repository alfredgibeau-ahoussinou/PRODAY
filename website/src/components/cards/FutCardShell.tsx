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
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { X, Shield } from "lucide-react";
import {
  CARD_ACTION_LABELS,
  type ProDayCardActionId,
  type ProDayCardBase,
} from "@/lib/prodayCards";
import type { FutSkinMeta } from "@/lib/futSkins";

const ease = [0.22, 1, 0.36, 1] as const;

type FutCardShellProps = {
  card: ProDayCardBase;
  front: ReactNode;
  back: ReactNode;
  onAction?: (action: ProDayCardActionId) => void;
  formationLabel?: string;
};

export function FutCardShell({
  card,
  front,
  back,
  onAction,
}: FutCardShellProps) {
  const [open, setOpen] = useState(false);
  const [pressing, setPressing] = useState(false);
  const reduce = useReducedMotion();
  const tiltRef = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), {
    stiffness: 220,
    damping: 20,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), {
    stiffness: 220,
    damping: 20,
  });
  const glareX = useTransform(mx, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(my, [-0.5, 0.5], [0, 100]);
  const glareBg = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15), transparent 60%)`;

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

  return (
    <>
      <motion.div
        className="mx-auto w-full max-w-[320px]"
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
          onClick={() => setOpen(true)}
          className="relative cursor-pointer"
          style={{ perspective: 1400 }}
        >
          <motion.div
            className="relative w-full rounded-[32px] overflow-hidden bg-[#0A0A0F] shadow-2xl"
            style={{
              aspectRatio: "3 / 4",
              rotateX: reduce ? 0 : rx,
              rotateY: reduce ? 0 : ry,
              transformStyle: "preserve-3d",
              scale: pressing && !reduce ? 0.97 : 1,
              boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
              scale: { type: "spring", stiffness: 400, damping: 28 },
            }}
          >
            {/* Front of the card */}
            <div className="absolute inset-0 w-full h-full">
              {front}
            </div>

            {/* Glare effect */}
            {!reduce && (
              <motion.div
                className="pointer-events-none absolute inset-0 z-20 rounded-[32px] mix-blend-overlay"
                style={{ background: glareBg }}
              />
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Modal / Back Details */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#121218] p-6 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 24, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
              
              <div className="mb-6">
                <h3 className="text-2xl font-black uppercase tracking-tight text-white">{card.displayName}</h3>
                <p className="text-sm font-semibold text-white/50">{card.tier.toUpperCase()} • {card.role.toUpperCase()}</p>
              </div>

              {back}

              <div className="mt-8 flex flex-col gap-2">
                {card.actions.map((act) => (
                  <button
                    key={act}
                    className="w-full rounded-xl bg-white/10 py-3 text-sm font-bold text-white hover:bg-white/20 transition-colors"
                    onClick={() => {
                      onAction?.(act);
                      setOpen(false);
                    }}
                  >
                    {CARD_ACTION_LABELS[act]}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Aesthetic Subcomponents used in ProDayFutCard

export function FutFaceLayout({
  rating,
  position,
  flagLabel,
  clubLabel,
  photoUrl,
  name,
  stats,
}: {
  rating: number | string;
  position: string;
  flagLabel?: string;
  clubLabel: string;
  leagueLabel?: string;
  photoUrl?: string | null;
  name: string;
  stats: { label: string; value: number | string }[];
  ink?: string;
  inkMuted?: string;
  divider?: string;
  upgrade?: number;
}) {
  return (
    <div className="relative flex h-full w-full flex-col">
      {/* Background Image full cover */}
      {photoUrl ? (
        <img src={photoUrl} className="absolute inset-0 h-full w-full object-cover" alt="" />
      ) : (
        <div className="absolute inset-0 h-full w-full bg-[#1A1A24]" />
      )}

      {/* Dark overlay gradients for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent h-1/3" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F] via-[#0A0A0F]/80 to-transparent top-1/2" />

      <div className="relative z-10 flex h-full flex-col p-5">
        
        {/* Top Badges */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-md">
            <span className="text-xl font-black text-white">{rating}</span>
            <div className="h-4 w-px bg-white/30" />
            <span className="text-xs font-bold text-white/80">{position}</span>
            {flagLabel && (
              <>
                <div className="h-4 w-px bg-white/30" />
                <span className="text-[10px] font-bold text-white/60">{flagLabel}</span>
              </>
            )}
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 backdrop-blur-md">
             <Shield size={18} className="text-white" />
          </div>
        </div>

        <div className="flex-1" />

        {/* Bottom Section */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col">
            <h2 className="text-3xl font-black tracking-tight text-white">{name}</h2>
            <p className="text-sm font-medium text-white/60">{clubLabel || "Agent Libre"}</p>
          </div>

          {/* Stats Glass Panel */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md">
             <StatChip label="MAT" value={stats[0].value} />
             <div className="h-6 w-px bg-white/10" />
             <StatChip label="NOTE" value={stats[1].value} />
             <div className="h-6 w-px bg-white/10" />
             <StatChip label="G+A" value={stats[2].value} />
          </div>
        </div>

      </div>
    </div>
  );
}

export function StatChip({ label, value, accent }: { label: string; value: number | string; accent?: string; animate?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-lg font-bold text-white" style={{ color: accent || 'white' }}>{value}</span>
      <span className="text-[10px] font-semibold tracking-wider text-white/50">{label}</span>
    </div>
  );
}

export function clampStat(n: number) {
  return Math.max(40, Math.min(99, Math.round(n)));
}

export function nationCode(n: string | undefined | null) {
  return (n || "FRA").slice(0, 3).toUpperCase();
}

export function FutBackDetails({
  children,
}: {
  ink?: string;
  children: ReactNode;
}) {
  return <div className="text-white">{children}</div>;
}

export function StatBar({
  label,
  value,
  max = 100,
}: {
  label: string;
  value: number;
  max?: number;
  ink?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs font-bold text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
           <div className="h-full rounded-full bg-white/90" style={{ width: `${pct}%` }} />
        </div>
        <span className="w-6 text-right text-sm font-black text-white">{value}</span>
      </div>
    </div>
  );
}

export function FutSkinSwatch({ skin, active }: { skin: FutSkinMeta; active: boolean }) {
  return (
    <div
      className={`h-8 w-8 rounded-full border-2 ${
        active ? "border-white" : "border-transparent"
      }`}
      style={{
        background: `linear-gradient(135deg, ${skin.frame[0]}, ${skin.frame[1]})`,
      }}
    />
  );
}
