"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const stories = [
  {
    id: 1,
    name: "Thomas",
    role: "Joueur amateur",
    content:
      "Profil + Mercato au même endroit. Plus besoin de poster partout pour se faire voir.",
    avatar: "/images/football-player-01.jpg",
  },
  {
    id: 2,
    name: "Marie",
    role: "Coach U19",
    content:
      "Convocations et réponses sans relancer 20 fois sur WhatsApp. Ça change le weekend.",
    avatar: "/images/football-coach-01.jpg",
  },
  {
    id: 3,
    name: "Karim",
    role: "Kiné sportif",
    content:
      "Agenda et messages près des clubs. Moins de allers-retours, plus de terrain.",
    avatar: "/images/football-health-01.jpg",
  },
  {
    id: 4,
    name: "Sophie",
    role: "Supportrice",
    content:
      "Suivre mon club et le fil, sans payer. Simple, c’est tout.",
    avatar: "/images/football-supporter-01.jpg",
  },
] as const;

/** Illustrations produit : pas des avis clients certifiés. */
export function Testimonials() {
  return (
    <section className="relative bg-[#e8f3ec] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mb-10 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1FAA5A]">
            Dans la vraie vie
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em] text-[#0f1f17] sm:text-4xl">
            Ce que ça change
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-[#4a6356]">
            Exemples de parcours. Illustrations produit, pas des avis clients.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stories.map((story, index) => (
            <motion.div
              key={story.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="rounded-3xl border border-[#0f1f17]/8 bg-white p-5 shadow-[0_16px_36px_-28px_rgba(15,31,23,0.3)] transition hover:-translate-y-1 hover:border-[#00A8C4]/35"
            >
              <p className="text-sm leading-relaxed text-[#0f1f17]/85">{story.content}</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-full bg-[#eef6f1]">
                  <Image
                    src={story.avatar}
                    alt=""
                    fill
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0f1f17]">{story.name}</p>
                  <p className="text-xs text-[#4a6356]">{story.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
