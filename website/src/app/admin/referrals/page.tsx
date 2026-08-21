import { redirect } from "next/navigation";

/** Legacy route → Admin Control Center */
export default function LegacyAdminRedirect() {
  redirect("/admin/ops/referrals");
}
