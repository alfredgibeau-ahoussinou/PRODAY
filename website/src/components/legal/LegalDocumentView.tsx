import Link from "next/link";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import type { LegalDocument } from "@/content/legal";
import { ROUTES } from "@/lib/routes";

type LegalDocumentViewProps = {
  doc: LegalDocument;
  pathname: string;
  kicker: string;
};

export function LegalDocumentView({ doc, pathname, kicker }: LegalDocumentViewProps) {
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
        {doc.intro ? (
          <p className="text-base leading-relaxed text-white/70">{doc.intro}</p>
        ) : null}
        <div className="mt-10 space-y-10">
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
