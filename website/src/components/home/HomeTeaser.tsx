"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

type HomeTeaserProps = {
  title: string;
  description: string;
  href: string;
  cta: string;
  children: React.ReactNode;
  reverse?: boolean;
};

export function HomeTeaser({
  title,
  description,
  href,
  cta,
  children,
  reverse,
}: HomeTeaserProps) {
  return (
    <section className="border-t border-neutral-200 py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal className={reverse ? "lg:order-2" : ""}>
          <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
          <p className="mt-4 text-proday-muted leading-relaxed">{description}</p>
          <Link
            href={href}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition hover:gap-3"
          >
            {cta}
            <ArrowRight size={16} />
          </Link>
        </Reveal>
        <Reveal delay={0.1} className={reverse ? "lg:order-1" : ""}>
          {children}
        </Reveal>
      </div>
    </section>
  );
}
