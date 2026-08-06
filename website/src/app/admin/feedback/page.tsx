import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminFeedback } from "@/components/admin/AdminFeedback";
import { fetchBetaFeedbackAdmin } from "@/lib/adminBetaApi";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";

export const metadata: Metadata = {
  title: "Retours bêta Admin - ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminFeedbackPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const result = await fetchBetaFeedbackAdmin();

  return (
    <AdminFeedback
      initialItems={result.items}
      initialCounts={result.counts}
      initialError={result.ok ? null : (result.error ?? "Chargement impossible")}
    />
  );
}
