"use client";

import { motion, AnimatePresence } from "framer-motion";

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VideoDemoModal({ isOpen, onClose }: VideoDemoModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c10] shadow-2xl">
              <button
                onClick={onClose}
                aria-label="Fermer la modal"
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <div className="p-6 sm:p-8">
                <h3 className="font-display text-2xl font-extrabold uppercase tracking-[-0.03em] text-white sm:text-3xl">
                  Vidéo de présentation
                </h3>
                <p className="mt-2 text-sm text-white/55">
                  Connecter · Progresser · Réussir. Cinq pôles, covoiturage, terrain.
                </p>

                <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-black">
                  <video
                    className="h-full w-full object-contain"
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    aria-label="Vidéo de présentation ProDay"
                  >
                    <source src="/videos/proday-intro.mp4" type="video/mp4" />
                    Votre navigateur ne peut pas lire cette vidéo.
                  </video>
                </div>

                <div className="mt-6">
                  <button
                    onClick={onClose}
                    className="w-full rounded-xl bg-[var(--proday-accent)] px-6 py-3 font-display font-bold uppercase tracking-[-0.02em] text-white transition hover:bg-[var(--proday-accent)]/90"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
