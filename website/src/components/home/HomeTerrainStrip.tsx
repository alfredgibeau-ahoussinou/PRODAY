import Image from "next/image";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";

const BLOCKS = [
  {
    title: "Matchs",
    body: "Convocations, RSVP, stats. Fini de relancer tout le monde sur WhatsApp.",
    href: ROUTES.features,
    image: "/images/football-match-01.jpg",
    accent: "#00A8C4",
  },
  {
    title: "Mercato",
    body: "Annonces, candidatures, profil. Pour te faire remarquer près de chez toi.",
    href: ROUTES.joueur,
    image: "/images/football-mercato-01.jpg",
    accent: "#1FAA5A",
  },
  {
    title: "Covoit",
    body: "Propose ou cherche une place pour le match. Directement lié à l'événement.",
    href: ROUTES.features,
    image: "/images/football-team-01.jpg",
    accent: "#FF5A1F",
  },
] as const;

/** Trois blocs terrain — ton jeune, pas corporate. */
export function HomeTerrainStrip() {
  return (
    <section
      id="terrain"
      className="scroll-mt-28 border-t border-[#0f1f17]/8 bg-[#eef6f1] py-14 sm:py-16"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-8 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FF5A1F]">
            Sur le terrain
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em] text-[#0f1f17] sm:text-4xl">
            Ton foot, sans le bordel
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#4a6356] sm:text-base">
            Tape une carte. C&apos;est ce que tu utilises vraiment chaque semaine.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {BLOCKS.map((block) => (
            <Link
              key={block.title}
              href={block.href}
              className="group relative overflow-hidden rounded-3xl border border-[#0f1f17]/8 bg-white shadow-[0_18px_40px_-28px_rgba(15,31,23,0.28)] transition hover:-translate-y-1 hover:border-[#00A8C4]/35 hover:shadow-[0_24px_48px_-24px_rgba(0,168,196,0.3)]"
            >
              <div className="relative h-36 overflow-hidden sm:h-40">
                <Image
                  src={block.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
              </div>
              <div className="relative -mt-8 px-5 pb-5">
                <span
                  className="inline-block rounded-xl px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white"
                  style={{ backgroundColor: block.accent }}
                >
                  {block.title}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-[#4a6356]">{block.body}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
