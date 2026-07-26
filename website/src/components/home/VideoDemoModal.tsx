"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";

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
            <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c10] shadow-2xl">
              <button
                onClick={onClose}
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
                  Découvrez ProDay en 45 secondes
                </h3>

                <div className="mt-6 aspect-video overflow-hidden rounded-2xl bg-white/5">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--proday-accent)]/20">
                        <svg
                          className="h-8 w-8 text-[var(--proday-accent)]"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                      <p className="text-sm text-white/45">Vidéo de démonstration</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <p className="text-base leading-relaxed text-white/70">
                    Découvrez rapidement comment ProDay peut vous aider à atteindre vos
                    objectifs cette saison.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5 text-[var(--proday-accent)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p className="text-sm text-white/70">
                        Trouvez un club ou recrutez des talents
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5 text-[var(--proday-accent)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p className="text-sm text-white/70">
                        Gérez votre équipe et organisez vos matchs
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg
                        className="h-5 w-5 text-[var(--proday-accent)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <p className="text-sm text-white/70">
                        Connectez-vous avec la communauté football
                      </p>
                    </div>
                  </div>
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
