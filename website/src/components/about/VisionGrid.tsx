"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { VISION_PILLARS } from "@/lib/content";

export function VisionGrid() {
  return (
    <section className="bg-[#030303] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {VISION_PILLARS.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="card-premium rounded-2xl p-8"
            >
              <Reveal>
                <h3 className="font-display text-xl font-bold text-white">{item.title}</h3>
                <p className="mt-4 leading-relaxed text-white/55">{item.body}</p>
              </Reveal>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
