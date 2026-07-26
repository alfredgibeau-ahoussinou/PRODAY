"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";

const testimonials = [
  {
    id: 1,
    name: "Thomas D.",
    role: "Joueur amateur",
    pole: "Joueur",
    content: "ProDay a changé ma façon de gérer mon profil foot. J'ai pu me faire repérer par un club régional grâce à mon CV ProDay. L'app est super intuitive et les stats en direct sont incroyables.",
    rating: 5,
    avatar: "/images/football-player-01.jpg",
  },
  {
    id: 2,
    name: "Marie L.",
    role: "Coach U19 Féminin",
    pole: "Pro Staff",
    content: "En tant que coach, ProDay me permet de suivre toutes mes joueuses en un seul endroit. Les profils détaillés et les statistiques m'aident à prendre de meilleures décisions tactiques.",
    rating: 5,
    avatar: "/images/football-coach-01.jpg",
  },
  {
    id: 3,
    name: "Karim B.",
    role: "Kinésithérapeute sportif",
    pole: "Santé",
    content: "L'agenda en ligne et la messagerie avec les clubs partenaires me font gagner un temps précieux. Je peux gérer mes patients et communiquer avec les staffs efficacement.",
    rating: 5,
    avatar: "/images/football-health-01.jpg",
  },
  {
    id: 4,
    name: "Sophie M.",
    role: "Supporter FC Lyon",
    pole: "Supporter",
    content: "Enfin une app qui me permet de suivre mon club et d'interagir avec d'autres supporters ! Les matchs en direct et le fil communautaire rendent l'expérience encore plus immersive.",
    rating: 5,
    avatar: "/images/football-supporter-01.jpg",
  },
];

export function Testimonials() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="font-display text-3xl font-extrabold uppercase tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            Ils utilisent ProDay
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-white/70">
            Découvrez ce que nos utilisateurs pensent de l'app
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 transition-all duration-300 hover:border-[var(--proday-accent)]/30 hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-[var(--proday-accent)] text-[var(--proday-accent)]"
                  />
                ))}
              </div>

              <p className="mb-6 text-sm leading-relaxed text-white/85">
                {testimonial.content}
              </p>

              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/10">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                  <p className="text-xs text-white/60">
                    {testimonial.role} · {testimonial.pole}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
