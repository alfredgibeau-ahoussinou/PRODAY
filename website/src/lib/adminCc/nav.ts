/** Navigation par domaines — PRODAY Admin Control Center */

export type AccNavItem = {
  href: string;
  label: string;
  /** Clé pour badges dynamiques */
  badgeKey?: "pendingBeta" | "actionRequired" | "pastDue";
};

export type AccNavDomain = {
  id: string;
  label: string;
  href: string;
  items: AccNavItem[];
};

export const ACC_HOME = "/admin/home";

export const ACC_DOMAINS: AccNavDomain[] = [
  {
    id: "home",
    label: "Accueil",
    href: ACC_HOME,
    items: [{ href: ACC_HOME, label: "Control Center" }],
  },
  {
    id: "platform",
    label: "Plateforme",
    href: "/admin/platform",
    items: [
      { href: "/admin/platform", label: "Vue globale" },
      { href: "/admin/platform/health", label: "Santé système" },
      { href: "/admin/ops/status", label: "Statut e-mail & diffusion" },
      { href: "/admin/ops/visites", label: "Activité / trafic" },
      { href: "/admin/ops/analytics", label: "Performance" },
    ],
  },
  {
    id: "users",
    label: "Utilisateurs",
    href: "/admin/users",
    items: [
      { href: "/admin/users", label: "Tous" },
      { href: "/admin/users?role=player", label: "Joueurs" },
      { href: "/admin/users?role=coach", label: "Coachs" },
      { href: "/admin/users?role=club", label: "Présidents / clubs" },
      { href: "/admin/users?role=supporter", label: "Supporters" },
      { href: "/admin/users?role=sponsor", label: "Sponsors" },
    ],
  },
  {
    id: "clubs",
    label: "Clubs",
    href: "/admin/clubs",
    items: [
      { href: "/admin/clubs", label: "Tous les clubs" },
      { href: "/admin/clubs?view=new", label: "Nouveaux" },
      { href: "/admin/clubs?view=active", label: "Actifs" },
    ],
  },
  {
    id: "commercial",
    label: "Commercial",
    href: "/admin/commercial",
    items: [
      { href: "/admin/commercial", label: "Pipeline CRM" },
      { href: "/admin/commercial/devis", label: "Devis", badgeKey: "actionRequired" },
      { href: "/admin/commercial/pricing", label: "Calculateur prix" },
      { href: "/admin/ops/beta", label: "Liste d’attente", badgeKey: "pendingBeta" },
      { href: "/admin/ops/referrals", label: "Parrainage" },
    ],
  },
  {
    id: "finances",
    label: "Finances",
    href: "/admin/finances",
    items: [
      { href: "/admin/finances", label: "Dashboard" },
      { href: "/admin/finances/subscriptions", label: "Abonnements" },
      { href: "/admin/finances/subscriptions?focus=past_due", label: "Impayés", badgeKey: "pastDue" },
    ],
  },
  {
    id: "product",
    label: "Produit",
    href: "/admin/product",
    items: [
      { href: "/admin/product", label: "Modules & pôles" },
      { href: "/admin/product/flags", label: "Feature flags" },
    ],
  },
  {
    id: "ai",
    label: "IA",
    href: "/admin/ai",
    items: [
      { href: "/admin/ai", label: "Centre IA" },
      { href: "/admin/ai/agents", label: "Agents" },
    ],
  },
  {
    id: "communication",
    label: "Communication",
    href: "/admin/communication",
    items: [
      { href: "/admin/communication", label: "Emails & campagnes" },
      { href: "/admin/ops/feedback", label: "Retours bêta" },
    ],
  },
  {
    id: "support",
    label: "Support",
    href: "/admin/support",
    items: [
      { href: "/admin/support", label: "Tickets" },
      { href: "/admin/ops/feedback", label: "Incidents bêta" },
    ],
  },
  {
    id: "content",
    label: "Contenu",
    href: "/admin/content",
    items: [{ href: "/admin/content", label: "Pages & médias" }],
  },
  {
    id: "security",
    label: "Sécurité",
    href: "/admin/security",
    items: [
      { href: "/admin/security", label: "Rôles & permissions" },
      { href: "/admin/security/audit", label: "Audit" },
      { href: "/admin/security/reports", label: "Modération" },
    ],
  },
  {
    id: "system",
    label: "Système",
    href: "/admin/system",
    items: [
      { href: "/admin/system", label: "Configuration" },
      { href: "/admin/platform/health", label: "Intégrations" },
    ],
  },
];

export const ACC_COMMAND_ITEMS: { href: string; label: string; keywords: string }[] =
  ACC_DOMAINS.flatMap((d) =>
    d.items.map((item) => ({
      href: item.href,
      label: `${d.label} · ${item.label}`,
      keywords: `${d.label} ${item.label} ${d.id}`.toLowerCase(),
    })),
  );

export function findAccDomain(pathname: string): AccNavDomain | undefined {
  if (pathname === ACC_HOME || pathname === "/admin" || pathname === "/admin/dashboard") {
    return ACC_DOMAINS[0];
  }
  const scored = ACC_DOMAINS.filter((d) => d.id !== "home").map((d) => {
    const hit = d.items.some(
      (i) => pathname === i.href.split("?")[0] || pathname.startsWith(`${i.href.split("?")[0]}/`),
    );
    const domainHit =
      pathname === d.href || pathname.startsWith(`${d.href}/`) || pathname.startsWith(`/admin/${d.id}`);
    return { d, score: hit ? 2 : domainHit ? 1 : 0 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.score ? scored[0].d : ACC_DOMAINS[0];
}
