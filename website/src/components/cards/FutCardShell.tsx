"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useId, useState, type CSSProperties, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  CARD_ACTION_LABELS,
  CARD_ROLE_META,
  type ProDayCardActionId,
  type ProDayCardBase,
} from "@/lib/prodayCards";
import { resolveFutSkin, type FutSkinMeta } from "@/lib/futSkins";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Silhouette type template FUT (sommet à encoches, pointe basse).
 * viewBox 200×280
 */
export const FUT_PATH =
  "M22 14 C22 8 28 4 40 4 L160 4 C172 4 178 8 178 14 L178 18 C178 26 184 32 192 36 L196 42 C198 48 198 56 198 64 L198 168 C198 208 158 242 100 272 C42 242 2 208 2 168 L2 64 C2 56 2 48 4 42 L8 36 C16 32 22 26 22 18 Z";

/** Clip CSS aligné sur le template or fourni */
const FUT_CLIP_CSS =
  "polygon(11% 1.5%, 89% 1.5%, 89% 5%, 96% 10%, 99% 16%, 99% 58%, 82% 86%, 50% 99%, 18% 86%, 1% 58%, 1% 16%, 4% 10%, 11% 5%)";

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
  formationLabel,
}: FutCardShellProps) {
  const [flipped, setFlipped] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const meta = CARD_ROLE_META[card.role];
  const skin = resolveFutSkin(card.tier, card.skinId);

  return (
    <>
      <div className="mx-auto w-full max-w-[320px]">
        <motion.button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          onDoubleClick={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
          className="group relative block w-full text-left [perspective:1200px]"
          aria-label={`${card.displayName} — ${meta.label}`}
          animate={reduce ? undefined : { y: [0, -4, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
          whileHover={reduce ? undefined : { scale: 1.02 }}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            className="relative w-full"
            style={{ aspectRatio: "570 / 713", transformStyle: "preserve-3d" }}
          >
            <CardFace skin={skin}>{front}</CardFace>
            <CardFace skin={skin} back>
              {back}
            </CardFace>
          </motion.div>
        </motion.button>

        {formationLabel ? (
          <div className="mt-3 flex justify-center">
            <span className="rounded-md bg-[#1d4ed8] px-3.5 py-1 text-xs font-black uppercase tracking-wide text-white shadow-lg">
              {formationLabel}
            </span>
          </div>
        ) : (
          <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            {skin.label}
          </p>
        )}
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/80 p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal
              initial={reduce ? false : { opacity: 0, y: 36, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: 20 }}
              transition={{ duration: 0.32, ease }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/15 bg-[#0a0a0f] p-5 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/40 p-2 text-white/80"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
                {meta.label} · {skin.label}
              </p>
              <h3 className="mt-2 font-display text-2xl text-white">{card.displayName}</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {card.actions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      onAction?.(action);
                      if (action === "view_profile" || action === "view_club") setOpen(false);
                    }}
                    className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
                    style={{
                      background:
                        action === "view_profile" || action === "view_club"
                          ? card.accentHex
                          : "rgba(255,255,255,0.08)",
                    }}
                  >
                    {CARD_ACTION_LABELS[action]}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function CardFace({
  children,
  skin,
  back,
}: {
  children: ReactNode;
  skin: FutSkinMeta;
  back?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const faceId = `face-${uid}`;
  const frameId = `frame-${uid}`;
  const raysId = `rays-${uid}`;
  const useTemplate = skin.id === "gold";

  return (
    <div
      className={`absolute inset-0 [backface-visibility:hidden] ${
        back ? "[transform:rotateY(180deg)]" : ""
      }`}
      style={{ filter: `drop-shadow(0 22px 40px ${skin.glow})` }}
    >
      {useTemplate ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/fut-template-gold.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            clipPath: FUT_CLIP_CSS,
            WebkitClipPath: FUT_CLIP_CSS,
          }}
        />
      ) : (
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 200 280"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={frameId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={skin.frame[0]} />
              <stop offset="55%" stopColor={skin.frame[1]} />
              <stop offset="100%" stopColor={skin.frame[2]} />
            </linearGradient>
            <linearGradient id={faceId} x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor={skin.face[0]} />
              <stop offset="50%" stopColor={skin.face[1]} />
              <stop offset="100%" stopColor={skin.face[2]} />
            </linearGradient>
            <radialGradient id={raysId} cx="55%" cy="28%" r="68%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <path d={FUT_PATH} fill={`url(#${frameId})`} />
          <path
            d={FUT_PATH}
            fill={`url(#${faceId})`}
            transform="translate(100 140) scale(0.935) translate(-100 -140)"
          />
          {skin.pattern === "rays" || skin.pattern === "hex" || skin.pattern === "shards" ? (
            <g opacity="0.8">
              <circle cx="110" cy="80" r="110" fill={`url(#${raysId})`} />
              {Array.from({ length: 26 }).map((_, i) => {
                const a = (i / 26) * Math.PI * 2 - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1="110"
                    y1="80"
                    x2={110 + Math.cos(a) * 180}
                    y2={80 + Math.sin(a) * 180}
                    stroke="rgba(255,255,255,0.14)"
                    strokeWidth={i % 2 ? 1.3 : 0.55}
                  />
                );
              })}
            </g>
          ) : null}
        </svg>
      )}

      <div
        className="absolute inset-0 overflow-hidden"
        style={
          {
            clipPath: FUT_CLIP_CSS,
            WebkitClipPath: FUT_CLIP_CSS,
            color: skin.ink,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Layout exact type template FUT :
 * 99 / POS / flag / club à gauche · photo à droite · NAME · stats 2 col · badge bas
 */
export function FutFaceLayout({
  rating,
  position,
  flagLabel,
  clubLabel,
  leagueLabel: _league,
  photoUrl,
  name,
  stats,
  ink,
  inkMuted: _inkMuted,
  divider,
  upgrade,
  plateColor,
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
  /** Fond pour masquer les placeholders du template or */
  plateColor?: string;
}) {
  const leftStats = stats.slice(0, 3);
  const rightStats = stats.slice(3, 6);
  const clubCode = clubLabel.replace(/^FC\s+/i, "").slice(0, 2).toUpperCase();
  const plate = plateColor;
  const plateStyle = plate ? { background: plate } : undefined;

  return (
    <div className="relative h-full w-full font-sans">
      {/* Colonne gauche — OVR / POS / flag / club */}
      <div className="absolute left-[9%] top-[6%] z-20 flex w-[22%] flex-col items-center">
        <div className="relative w-full rounded-sm px-0.5 text-center" style={plateStyle}>
          <span
            className="block text-[clamp(1.75rem,8vw,2.6rem)] font-black leading-none tracking-tight tabular-nums"
            style={{
              color: ink,
              fontFamily: "Arial Black, Impact, Helvetica Condensed, sans-serif",
            }}
          >
            {rating}
          </span>
          {upgrade != null && upgrade > 0 ? (
            <span className="absolute -right-2 top-0 text-[10px] font-black text-[#15803d]">
              +{upgrade}
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 w-full rounded-sm text-center" style={plateStyle}>
          <span
            className="text-[clamp(0.65rem,2.4vw,0.85rem)] font-black uppercase tracking-wide"
            style={{ color: ink }}
          >
            {position}
          </span>
        </div>
        <div className="mt-2 flex flex-col items-center gap-1.5">
          {flagLabel === "FR" ? (
            <div className="flex h-4 w-6 overflow-hidden rounded-[1px] border border-black/40 shadow-sm">
              <span className="w-1/3 bg-[#002395]" />
              <span className="w-1/3 bg-white" />
              <span className="w-1/3 bg-[#ED2939]" />
            </div>
          ) : (
            <span className="rounded-sm px-1 text-[10px] font-black" style={{ color: ink, ...plateStyle }}>
              {flagLabel}
            </span>
          )}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-black shadow"
            style={{
              borderColor: ink,
              color: ink,
              background: "rgba(255,255,255,0.85)",
            }}
          >
            {clubCode}
          </div>
        </div>
      </div>

      {/* Photo joueur — zone droite haut */}
      <div className="absolute bottom-[42%] left-[30%] right-[6%] top-[5%] z-10 overflow-hidden">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt=""
            className="h-full w-full object-cover object-[center_12%]"
            style={{
              maskImage:
                "linear-gradient(to bottom, #000 55%, transparent 100%), linear-gradient(to right, transparent 0%, #000 12%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, #000 55%, transparent 100%), linear-gradient(to right, transparent 0%, #000 12%)",
              maskComposite: "intersect",
              WebkitMaskComposite: "source-in",
            }}
          />
        ) : (
          <div className="flex h-full items-end justify-center">
            <div className="h-[78%] w-[68%] rounded-t-full bg-black/35" />
          </div>
        )}
      </div>

      {/* Nom */}
      <div
        className="absolute left-[12%] right-[12%] top-[52%] z-20 truncate px-1 text-center text-[clamp(0.85rem,3.2vw,1.15rem)] font-black uppercase tracking-[0.06em]"
        style={{
          color: ink,
          ...plateStyle,
          fontFamily: "Arial Black, Impact, Helvetica Condensed, sans-serif",
        }}
      >
        {name}
      </div>

      {/* Stats 2 colonnes — format 99 PAC */}
      <div className="absolute bottom-[12%] left-[16%] right-[16%] top-[58%] z-20 flex justify-center gap-0">
        <div className="flex flex-1 flex-col items-end justify-start gap-[0.35rem] pr-2.5 pt-1">
          {leftStats.map((s) => (
            <div
              key={s.label}
              className="flex items-baseline gap-1 leading-none"
              style={{ color: ink, ...plateStyle }}
            >
              <span
                className="text-[clamp(0.95rem,3.4vw,1.2rem)] font-black tabular-nums"
                style={{ fontFamily: "Arial Black, Impact, sans-serif" }}
              >
                {s.value}
              </span>
              <span className="text-[clamp(0.55rem,2vw,0.7rem)] font-black uppercase tracking-wide">
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <div className="w-px self-stretch opacity-70" style={{ background: divider }} />
        <div className="flex flex-1 flex-col items-start justify-start gap-[0.35rem] pl-2.5 pt-1">
          {rightStats.map((s) => (
            <div
              key={s.label}
              className="flex items-baseline gap-1 leading-none"
              style={{ color: ink, ...plateStyle }}
            >
              <span
                className="text-[clamp(0.95rem,3.4vw,1.2rem)] font-black tabular-nums"
                style={{ fontFamily: "Arial Black, Impact, sans-serif" }}
              >
                {s.value}
              </span>
              <span className="text-[clamp(0.55rem,2vw,0.7rem)] font-black uppercase tracking-wide">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Badge bas (pointe) */}
      <div
        className="absolute bottom-[3.5%] left-1/2 z-20 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border text-[8px] font-black"
        style={{
          borderColor: `${ink}88`,
          color: ink,
          background: "rgba(255,255,255,0.75)",
        }}
      >
        PD
      </div>
    </div>
  );
}

export function FutBackDetails({ children, ink }: { children: ReactNode; ink: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden px-5 pt-10 text-center" style={{ color: ink }}>
      {children}
    </div>
  );
}

export function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded bg-black/20 px-1.5 py-1 text-center">
      <p className="text-sm font-black tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      <p className="text-[7px] font-bold uppercase opacity-70">{label}</p>
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
      className={`relative aspect-[570/713] w-full overflow-hidden border transition ${
        active ? "scale-105 border-white" : "border-white/15 opacity-85 hover:opacity-100"
      }`}
      style={{
        background: `linear-gradient(165deg, ${skin.face[0]}, ${skin.face[1]} 50%, ${skin.face[2]})`,
        clipPath: FUT_CLIP_CSS,
      }}
    >
      <span
        className="absolute inset-x-0 bottom-4 text-center text-[7px] font-black uppercase"
        style={{ color: skin.ink }}
      >
        {skin.label.split(" ").pop()}
      </span>
    </div>
  );
}
