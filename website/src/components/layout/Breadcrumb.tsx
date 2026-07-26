"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumb() {
  const pathname = usePathname();
  
  // Don't show breadcrumb on homepage
  if (pathname === "/") return null;

  const pathSegments = pathname.split("/").filter(Boolean);
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Accueil", href: "/" },
    ...pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/");
      const label = formatSegment(segment);
      return { label, href };
    }),
  ];

  return (
    <nav aria-label="Fil d'ariane" className="mb-6">
      <ol className="flex items-center gap-2 text-sm text-white/50">
        {breadcrumbs.map((item, index) => (
          <Fragment key={item.href}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
            <li>
              {index === breadcrumbs.length - 1 ? (
                <span className="text-white/70" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-white transition-colors"
                >
                  {index === 0 && <Home className="h-4 w-4 inline mr-1" aria-hidden="true" />}
                  {item.label}
                </Link>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

function formatSegment(segment: string): string {
  // Format URL segments to readable labels
  const segmentMap: Record<string, string> = {
    "beta": "Bêta",
    "inscription": "Inscription",
    "pro": "Pro",
    "pro-joueur": "Pro Joueur",
    "pro-club": "Pro Club",
    "pro-staff": "Pro Staff",
    "amateur": "Amateur",
    "supporter": "Supporter",
    "sante": "Santé",
    "sponsor": "Sponsor",
    "tarifs": "Tarifs",
    "fonctionnalites": "Fonctionnalités",
    "faq": "FAQ",
    "demo": "Démo",
    "a-propos": "À propos",
    "vision": "Vision",
    "roadmap": "Roadmap",
    "quiz": "Quiz",
    "parcours": "Parcours",
    "partenaires": "Partenaires",
    "confiance": "Confiance",
    "confidentialite": "Confidentialité",
    "cgu": "CGU",
    "comparatif": "Comparatif",
    "ecosysteme": "Écosystème",
    "homme": "Homme",
    "woman": "Femme",
    "shop": "Boutique",
    "pulse": "Pulse",
    "live-stats": "Stats en direct",
    "admin": "Admin",
    "aide": "Aide",
    "installer": "Installer",
    "programme": "Programme",
    "visites": "Visites",
    "login": "Connexion",
    "logout": "Déconnexion",
  };

  return segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}
