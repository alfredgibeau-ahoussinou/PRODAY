import Link from "next/link";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import type { LegalDocument } from "@/content/legal";
import { LEGAL_META } from "@/content/legal";
import { ROUTES } from "@/lib/routes";

type LegalDocumentViewProps = {
  doc: LegalDocument;
  pathname: string;
  kicker: string;
  pdfHref?: string;
  parties?: string[];
};

export function LegalDocumentView({ doc, pathname, kicker, pdfHref, parties }: LegalDocumentViewProps) {
  return (
    <>
      <PageHeader
        pathname={pathname}
        kicker={kicker}
        title={doc.title}
        description={`Dernière mise à jour : ${doc.updatedAt} — Contact : ${doc.contact}`}
        dark
      />
      <PageBody narrow tone="elevated">
        {pdfHref ? (
          <p className="mb-8">
            <a
              href={pdfHref}
              download
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              Télécharger le PDF
            </a>
          </p>
        ) : null}
        {doc.intro ? (
          <p className="text-base leading-relaxed text-white/70">{doc.intro}</p>
        ) : null}
        {parties?.length ? (
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold text-white">Entre</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/65">
              {parties.map((party) => (
                <li key={party}>{party}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className={`space-y-10 ${doc.intro || parties?.length ? "mt-10" : ""}`}>
          {doc.sections.map((section, index) => (
            <section key={section.id} id={section.id}>
              <h2 className="font-display text-xl font-bold text-white">
                {index + 1}. {section.title}
              </h2>
              {section.paragraphs.map((p) => (
                <p key={p} className="mt-3 text-sm leading-relaxed text-white/65">
                  {p}
                </p>
              ))}
              {section.bullets?.length ? (
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/65">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
        <p className="mt-14 border-t border-white/10 pt-8 text-sm text-white/45">
          Voir aussi{" "}
          <Link
            href={pathname === ROUTES.privacy ? ROUTES.terms : ROUTES.privacy}
            className="text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            {pathname === ROUTES.privacy
              ? "Conditions générales d'utilisation"
              : "Politique de confidentialité"}
          </Link>
          .
        </p>
      </PageBody>
    </>
  );
}
