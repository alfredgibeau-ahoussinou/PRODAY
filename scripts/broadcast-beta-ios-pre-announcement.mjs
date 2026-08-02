#!/usr/bin/env node
/**
 * Broadcast email « bêta iOS le 11 août 2026 à 18 h » à tous les inscrits waitlist.
 *
 * Usage :
 *   BETA_WAITLIST_ADMIN_FUNCTION_URL=https://…/websiteBetaWaitlistAdmin \
 *   BETA_WEBSITE_ADMIN_SECRET=… \
 *   node scripts/broadcast-beta-ios-pre-announcement.mjs
 */
const url = process.env.BETA_WAITLIST_ADMIN_FUNCTION_URL?.trim();
const secret = process.env.BETA_WEBSITE_ADMIN_SECRET?.trim();

if (!url || !secret) {
  console.error(
    "Variables requises : BETA_WAITLIST_ADMIN_FUNCTION_URL, BETA_WEBSITE_ADMIN_SECRET",
  );
  process.exit(1);
}

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Admin-Secret": secret,
  },
  body: JSON.stringify({ action: "broadcast_ios_pre_announcement" }),
});

const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error("Échec", res.status, data);
  process.exit(1);
}

console.log("Annonce iOS envoyée :", JSON.stringify(data, null, 2));
