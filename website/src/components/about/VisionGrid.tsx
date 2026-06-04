"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/Reveal";
import { VISION_PILLARS } from "@/lib/content";

export function VisionGrid() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {VISION_PILLARS.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm"
            >
              <Reveal>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="mt-4 text-proday-muted leading-relaxed">{item.body}</p>
              </Reveal>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
