"use client";

import { CinematicBleed } from "@/components/immersive/CinematicBleed";

type TerminalStoryProps = {
  title: string;
  body: string;
  image?: string;
  className?: string;
};

/** Full-bleed story band : centered copy over one cinematic photo. */
export function TerminalStory({
  title,
  body,
  image,
  className = "",
}: TerminalStoryProps) {
  return (
    <section
      className={`relative overflow-hidden border-b border-white/10 bg-black px-4 py-24 sm:px-6 sm:py-32 ${className}`}
    >
      {image ? <CinematicBleed src={image} opacity={0.38} /> : null}
      <div className="relative mx-auto max-w-3xl text-center">
        <h2 className="font-display text-[clamp(1.7rem,4vw,2.85rem)] font-medium leading-[1.1] tracking-[-0.03em] text-white">
          {title}
        </h2>
        <p className="mt-8 text-base leading-relaxed text-white/65 sm:text-lg">
          {body}
        </p>
      </div>
    </section>
  );
}
