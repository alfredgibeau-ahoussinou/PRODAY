import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ADMIN_LOGIN_PATH,
  getAdminSessionFromCookies,
} from "@/lib/adminSession";
import { AdminReferrals } from "@/components/admin/AdminReferrals";
import { fetchAdminPlatformStats } from "@/lib/adminPlatformApi";

export const metadata: Metadata = {
  title: "Parrainage Admin : ProDay",
  robots: { index: false, follow: false },
};

export default async function AdminReferralsPage() {
  if (!(await getAdminSessionFromCookies())) {
    redirect(ADMIN_LOGIN_PATH);
  }

  const result = await fetchAdminPlatformStats();

  return (
    <AdminReferrals
      items={result.data.referrals.items}
      codes={result.data.referrals.codes}
      totalSubscribed={result.data.referrals.total_subscribed}
      rewardsEarned={result.data.referrals.rewards_earned}
      error={result.ok ? null : (result.error ?? "Chargement impossible")}
    />
  );
}
