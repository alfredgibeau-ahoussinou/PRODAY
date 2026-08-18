import { Alert } from 'react-native';
import { adminService } from '../services/admin.service';
import { recruitmentService } from '../services/recruitment.service';
import { sponsorQuoteService } from '../services/sponsorQuote.service';
import type { AdminWorkItem } from './adminInsights';

export type AdminWorkInlineAction = 'approve' | 'reject';

const INLINE_APPROVE_KINDS = new Set<AdminWorkItem['kind']>([
  'verification',
  'reel',
  'application',
  'payment',
  'report',
]);

const INLINE_REJECT_KINDS = new Set<AdminWorkItem['kind']>([
  'verification',
  'reel',
  'application',
  'payment',
  'report',
  'quote',
  'post',
]);

export function canAdminWorkInlineAction(
  item: AdminWorkItem,
  action: AdminWorkInlineAction,
): boolean {
  if (action === 'approve') return INLINE_APPROVE_KINDS.has(item.kind);
  return INLINE_REJECT_KINDS.has(item.kind);
}

/** Kinds qui nécessitent l'écran dédié (ex. composer un devis). */
export function adminWorkItemNeedsOpenToTreat(item: AdminWorkItem): boolean {
  return item.kind === 'quote' || (item.kind === 'post' && !canAdminWorkInlineAction(item, 'approve'));
}

function parseWorkItemId(item: AdminWorkItem, prefix: string): string {
  return item.id.replace(new RegExp(`^${prefix}-`), '');
}

function parseReelIdFromBookmark(bookmarkKey: string): string | null {
  if (bookmarkKey.startsWith('proday-')) return bookmarkKey.slice('proday-'.length);
  return null;
}

export async function executeAdminWorkApprove(item: AdminWorkItem): Promise<void> {
  if (!canAdminWorkInlineAction(item, 'approve')) {
    throw new Error('Action non supportée pour ce type de décision.');
  }

  if (item.kind === 'verification' && item.entityId) {
    await adminService.validateProfile(item.entityId, 'approve');
    return;
  }
  if (item.kind === 'reel') {
    const reelId = parseWorkItemId(item, 'reel');
    await adminService.updateCommunityReelStatus(reelId, 'approved');
    return;
  }
  if (item.kind === 'application') {
    const appId = parseWorkItemId(item, 'app');
    await recruitmentService.updateApplicationStatus(appId, 'ACCEPTED');
    return;
  }
  if (item.kind === 'payment') {
    const payId = parseWorkItemId(item, 'pay');
    await adminService.updatePaymentStatus(payId, 'paid');
    return;
  }
  if (item.kind === 'report') {
    const reportId = parseWorkItemId(item, 'report');
    const bookmarkKey = item.entityId;
    if (bookmarkKey) {
      const reelId = parseReelIdFromBookmark(bookmarkKey);
      if (reelId) {
        await adminService.updateCommunityReelStatus(reelId, 'rejected');
      }
    }
    await adminService.deleteReelReport(reportId);
    return;
  }
  throw new Error('Action non supportée pour ce type de décision.');
}

export async function executeAdminWorkReject(item: AdminWorkItem): Promise<void> {
  if (!canAdminWorkInlineAction(item, 'reject')) {
    throw new Error('Action non supportée pour ce type de décision.');
  }

  if (item.kind === 'verification' && item.entityId) {
    await adminService.validateProfile(item.entityId, 'reject', 'Refus admin');
    return;
  }
  if (item.kind === 'reel') {
    const reelId = parseWorkItemId(item, 'reel');
    await adminService.updateCommunityReelStatus(reelId, 'rejected');
    return;
  }
  if (item.kind === 'application') {
    const appId = parseWorkItemId(item, 'app');
    await recruitmentService.updateApplicationStatus(appId, 'REJECTED');
    return;
  }
  if (item.kind === 'payment') {
    const payId = parseWorkItemId(item, 'pay');
    await adminService.deletePaymentRequest(payId);
    return;
  }
  if (item.kind === 'report') {
    const reportId = parseWorkItemId(item, 'report');
    await adminService.deleteReelReport(reportId);
    return;
  }
  if (item.kind === 'quote') {
    const quoteId = parseWorkItemId(item, 'quote');
    await sponsorQuoteService.rejectQuote(quoteId);
    return;
  }
  if (item.kind === 'post') {
    const postId = parseWorkItemId(item, 'post');
    await adminService.updateRecruitmentPost(postId, 'CLOSED');
    return;
  }
  throw new Error('Action non supportée pour ce type de décision.');
}

export function confirmAdminWorkApprove(
  item: AdminWorkItem,
  onConfirm: () => Promise<void>,
): void {
  Alert.alert('Approuver ?', item.title, [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Approuver',
      onPress: () => {
        void onConfirm().catch(() => {
          Alert.alert('Erreur', 'Impossible d\'effectuer cette action.');
        });
      },
    },
  ]);
}

export function confirmAdminWorkReject(
  item: AdminWorkItem,
  onConfirm: () => Promise<void>,
): void {
  Alert.alert('Refuser / Clôturer ?', item.title, [
    { text: 'Annuler', style: 'cancel' },
    {
      text: 'Confirmer',
      style: 'destructive',
      onPress: () => {
        void onConfirm().catch(() => {
          Alert.alert('Erreur', 'Impossible d\'effectuer cette action.');
        });
      },
    },
  ]);
}

export async function runAdminWorkApprove(
  item: AdminWorkItem,
  refresh: () => void | Promise<void>,
): Promise<void> {
  await executeAdminWorkApprove(item);
  await refresh();
  Alert.alert('Décision enregistrée', 'L\'élément a été approuvé.');
}

export async function runAdminWorkReject(
  item: AdminWorkItem,
  refresh: () => void | Promise<void>,
): Promise<void> {
  await executeAdminWorkReject(item);
  await refresh();
  Alert.alert('Décision enregistrée', 'L\'élément a été refusé ou clôturé.');
}
