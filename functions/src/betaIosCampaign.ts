import * as admin from 'firebase-admin';
import {
  buildBetaEngagementEmail,
  buildBetaIosLaunchEmail,
  buildBetaIosPreAnnouncementEmail,
  getEngagementTopic,
} from './betaIosCampaignEmails';
import {
  BETA_CAMPAIGN_STATE_DOC,
  ENGAGEMENT_EMAIL_INTERVAL_MS,
  isIosBetaLaunched,
} from './betaIosCampaignConstants';
import { getBetaEmailJsConfig, getBetaSiteUrl } from './betaWaitlistMail';
import { isBrevoConfigured, sendTransactionalEmail } from './emailTransport';
import { configStr } from './runtimeConfig';
import { resolveBetaWaitlistStatus } from './betaWaitlistStatus';
import { generateBetaAccessToken } from './betaAccessToken';
import { isBetaRoleId, BETA_ROLE_LABELS } from './betaWaitlistEmail';

export type CampaignSendResult = {
  sent: number;
  skipped: number;
  failed: number;
  errors: string[];
};

export type CampaignState = {
  ios_pre_announcement_broadcast_at?: admin.firestore.Timestamp;
  ios_launch_executed_at?: admin.firestore.Timestamp;
  testflight_url?: string;
  engagement_round?: number;
  last_engagement_sent_at?: admin.firestore.Timestamp;
};

function getTestFlightUrlFromConfig(): string {
  return (
    configStr('beta', 'testflight_url', ['BETA_TESTFLIGHT_URL'])?.trim() ?? ''
  );
}

async function sendCampaignEmail(
  to: string,
  subject: string,
  html: string,
  text: string,
): Promise<void> {
  const emailJs = getBetaEmailJsConfig();
  if (!isBrevoConfigured() && !emailJs) {
    throw new Error('Transport email non configuré');
  }
  await sendTransactionalEmail(
    { to, subject, html, text },
    emailJs
      ? {
          config: emailJs,
          templateParams: {
            email: to,
            to_email: to,
            user_email: to,
            subject,
            site_url: getBetaSiteUrl(),
          },
        }
      : undefined,
  );
}

function resolveRoleLabel(data: admin.firestore.DocumentData): string {
  if (typeof data.role_label === 'string' && data.role_label.trim()) {
    return data.role_label.trim();
  }
  const role = String(data.role ?? 'player');
  return isBetaRoleId(role) ? BETA_ROLE_LABELS[role] : role;
}

function resolveAccessToken(data: admin.firestore.DocumentData): string {
  const existing =
    typeof data.access_token === 'string' && data.access_token.trim()
      ? data.access_token.trim()
      : '';
  return existing || generateBetaAccessToken();
}

async function getEligibleWaitlistDocs(
  db: admin.firestore.Firestore,
): Promise<admin.firestore.QueryDocumentSnapshot[]> {
  const snap = await db.collection('beta_waitlist').get();
  return snap.docs.filter((doc) => {
    const status = resolveBetaWaitlistStatus(doc.data());
    return status !== 'rejected';
  });
}

export async function sendIosPreAnnouncementToEntry(
  db: admin.firestore.Firestore,
  doc: admin.firestore.QueryDocumentSnapshot,
): Promise<'sent' | 'skipped' | 'failed'> {
  const data = doc.data();
  if (data.ios_pre_announcement_sent_at) return 'skipped';

  const email = String(data.email ?? '').trim().toLowerCase();
  if (!email) return 'skipped';

  const siteUrl = getBetaSiteUrl();
  const { subject, html, text } = buildBetaIosPreAnnouncementEmail({
    email,
    roleLabel: resolveRoleLabel(data),
    siteUrl,
    accessToken: resolveAccessToken(data),
  });

  try {
    await sendCampaignEmail(email, subject, html, text);
    await doc.ref.update({
      ios_pre_announcement_sent_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return 'sent';
  } catch (e) {
    console.error('[betaIosCampaign] pre-announcement failed', email, e);
    return 'failed';
  }
}

export async function broadcastIosPreAnnouncement(
  db: admin.firestore.Firestore,
): Promise<CampaignSendResult> {
  const result: CampaignSendResult = { sent: 0, skipped: 0, failed: 0, errors: [] };
  const docs = await getEligibleWaitlistDocs(db);

  for (const doc of docs) {
    const outcome = await sendIosPreAnnouncementToEntry(db, doc);
    if (outcome === 'sent') result.sent += 1;
    else if (outcome === 'skipped') result.skipped += 1;
    else {
      result.failed += 1;
      result.errors.push(String(doc.data().email ?? doc.id));
    }
  }

  await db.doc(BETA_CAMPAIGN_STATE_DOC).set(
    {
      ios_pre_announcement_broadcast_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return result;
}

export async function sendIosLaunchEmailToEntry(
  db: admin.firestore.Firestore,
  doc: admin.firestore.QueryDocumentSnapshot,
  testflightUrl: string,
): Promise<'sent' | 'skipped' | 'failed'> {
  const data = doc.data();
  if (data.ios_launch_email_sent_at) return 'skipped';

  const email = String(data.email ?? '').trim().toLowerCase();
  if (!email) return 'skipped';

  const siteUrl = getBetaSiteUrl();
  const { subject, html, text } = buildBetaIosLaunchEmail({
    email,
    roleLabel: resolveRoleLabel(data),
    siteUrl,
    testflightUrl,
    accessToken: resolveAccessToken(data),
  });

  try {
    await sendCampaignEmail(email, subject, html, text);
    await doc.ref.update({
      ios_launch_email_sent_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return 'sent';
  } catch (e) {
    console.error('[betaIosCampaign] launch email failed', email, e);
    return 'failed';
  }
}

export async function executeIosBetaLaunch(
  db: admin.firestore.Firestore,
): Promise<CampaignSendResult & { testflightUrl: string }> {
  const stateRef = db.doc(BETA_CAMPAIGN_STATE_DOC);
  const stateSnap = await stateRef.get();
  const state = (stateSnap.data() ?? {}) as CampaignState;
  if (state.ios_launch_executed_at) {
    return {
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [],
      testflightUrl: state.testflight_url ?? getTestFlightUrlFromConfig(),
    };
  }

  const testflightUrl = getTestFlightUrlFromConfig();
  if (!testflightUrl) {
    throw new Error(
      'BETA_TESTFLIGHT_URL non configuré — définir avant le lancement iOS',
    );
  }

  const result: CampaignSendResult = { sent: 0, skipped: 0, failed: 0, errors: [] };
  const docs = await getEligibleWaitlistDocs(db);

  for (const doc of docs) {
    const outcome = await sendIosLaunchEmailToEntry(db, doc, testflightUrl);
    if (outcome === 'sent') result.sent += 1;
    else if (outcome === 'skipped') result.skipped += 1;
    else {
      result.failed += 1;
      result.errors.push(String(doc.data().email ?? doc.id));
    }
  }

  await stateRef.set(
    {
      ios_launch_executed_at: admin.firestore.FieldValue.serverTimestamp(),
      testflight_url: testflightUrl,
      ios_launched: true,
      engagement_round: 0,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return { ...result, testflightUrl };
}

export async function sendEngagementRound(
  db: admin.firestore.Firestore,
  roundIndex: number,
): Promise<CampaignSendResult> {
  const topic = getEngagementTopic(roundIndex);
  const siteUrl = getBetaSiteUrl();
  const result: CampaignSendResult = { sent: 0, skipped: 0, failed: 0, errors: [] };
  const docs = await getEligibleWaitlistDocs(db);

  for (const doc of docs) {
    const data = doc.data();
    const lastIndex = typeof data.last_engagement_index === 'number' ? data.last_engagement_index : 0;
    if (lastIndex >= roundIndex) {
      result.skipped += 1;
      continue;
    }

    const email = String(data.email ?? '').trim().toLowerCase();
    if (!email) {
      result.skipped += 1;
      continue;
    }

    const { subject, html, text } = buildBetaEngagementEmail(topic, {
      email,
      roleLabel: resolveRoleLabel(data),
      siteUrl,
      accessToken: resolveAccessToken(data),
    });

    try {
      await sendCampaignEmail(email, subject, html, text);
      await doc.ref.update({
        last_engagement_index: roundIndex,
        last_engagement_sent_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      result.sent += 1;
    } catch (e) {
      console.error('[betaIosCampaign] engagement failed', email, e);
      result.failed += 1;
      result.errors.push(email);
    }
  }

  await db.doc(BETA_CAMPAIGN_STATE_DOC).set(
    {
      engagement_round: roundIndex,
      last_engagement_sent_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return result;
}

export async function processScheduledBetaIosCampaign(
  db: admin.firestore.Firestore,
  now: Date = new Date(),
): Promise<Record<string, unknown>> {
  const stateRef = db.doc(BETA_CAMPAIGN_STATE_DOC);
  const stateSnap = await stateRef.get();
  const state = (stateSnap.data() ?? {}) as CampaignState;
  const log: Record<string, unknown> = { at: now.toISOString() };

  if (isIosBetaLaunched(now) && !state.ios_launch_executed_at) {
    try {
      log.launch = await executeIosBetaLaunch(db);
    } catch (e) {
      log.launchError = e instanceof Error ? e.message : String(e);
    }
  }

  const refreshed = (await stateRef.get()).data() as CampaignState | undefined;
  if (refreshed?.ios_launch_executed_at) {
    const launchAt = refreshed.ios_launch_executed_at.toDate();
    const elapsed = now.getTime() - launchAt.getTime();
    const currentRound = refreshed.engagement_round ?? 0;
    const expectedRound = Math.floor(elapsed / ENGAGEMENT_EMAIL_INTERVAL_MS);

    if (expectedRound > currentRound && expectedRound > 0) {
      const nextRound = currentRound + 1;
      log.engagement = await sendEngagementRound(db, nextRound);
    } else {
      log.engagement = { skipped: true, currentRound, expectedRound };
    }
  }

  return log;
}

/** Envoi non bloquant après inscription waitlist. */
export async function sendIosPreAnnouncementAfterSignup(
  db: admin.firestore.Firestore,
  docRef: admin.firestore.DocumentReference,
): Promise<void> {
  const snap = await docRef.get();
  if (!snap.exists) return;
  await sendIosPreAnnouncementToEntry(db, snap as admin.firestore.QueryDocumentSnapshot);
}
