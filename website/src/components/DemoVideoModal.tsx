"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { ROUTES } from "@/lib/routes";

type Props = {
  open: boolean;
  onClose: () => void;
  /** URL YouTube/Vimeo/mp4 — vide = placeholder « bientôt » + lien démo interactive. */
  videoUrl?: string;
};

export function DemoVideoModal({ open, onClose, videoUrl }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isEmbed =
    !!videoUrl &&
    (videoUrl.includes("youtube.com") ||
      videoUrl.includes("youtu.be") ||
      videoUrl.includes("vimeo.com"));

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Démonstration ProDay"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-[#0b0b10] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
            Voir la démonstration
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 p-2 text-white/70 transition hover:border-white/30 hover:text-white"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="aspect-video w-full bg-black">
          {videoUrl && isEmbed ? (
            <iframe
              title="Démonstration ProDay"
              src={videoUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : videoUrl ? (
            <video src={videoUrl} controls autoPlay className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <p className="font-display text-2xl font-extrabold text-white">
                La vidéo arrive bientôt
              </p>
              <p className="max-w-md text-sm leading-relaxed text-white/60">
                En attendant, testez la démo interactive : la navigation réelle des pôles,
                sans compte.
              </p>
              <Link
                href={ROUTES.demo}
                className="rounded-full bg-[var(--proday-accent)] px-5 py-2.5 text-sm font-bold text-black transition hover:bg-[#2a6fff]"
                onClick={onClose}
              >
                Ouvrir la démo interactive
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
