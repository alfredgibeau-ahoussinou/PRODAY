import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Layout Admin Control Center — noindex ; chrome site masqué via SiteShell. */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="acc-shell min-h-screen bg-[#06080f] text-white">{children}</div>;
}
