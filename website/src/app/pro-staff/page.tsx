import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

/** Legacy /pro-staff → Pôle Coach. */
export default function ProStaffRedirectPage() {
  redirect(ROUTES.coach);
}
