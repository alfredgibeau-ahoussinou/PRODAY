import { Alert } from 'react-native';
import { adminService } from '../services/admin.service';
import { recruitmentService } from '../services/recruitment.service';
import type { AdminWorkItem } from './adminInsights';

export async function executeAdminWorkApprove(item: AdminWorkItem): Promise<void> {
  if (item.kind === 'verification' && item.entityId) {
    await adminService.validateProfile(item.entityId, 'approve');
    return;
  }
  if (item.kind === 'reel') {
    const reelId = item.id.replace(/^reel-/, '');
    await adminService.updateCommunityReelStatus(reelId, 'approved');
    return;
  }
  if (item.kind === 'application') {
    const appId = item.id.replace(/^app-/, '');
    await recruitmentService.updateApplicationStatus(appId, 'ACCEPTED');
    return;
  }
  if (item.kind === 'payment') {
    const payId = item.id.replace(/^pay-/, '');
    await adminService.updatePaymentStatus(payId, 'paid');
    return;
  }
  throw new Error('Action non supportée pour ce type de décision.');
}

export async function executeAdminWorkReject(item: AdminWorkItem): Promise<void> {
  if (item.kind === 'verification' && item.entityId) {
    await adminService.validateProfile(item.entityId, 'reject', 'Refus admin');
    return;
  }
  if (item.kind === 'reel') {
    const reelId = item.id.replace(/^reel-/, '');
    await adminService.updateCommunityReelStatus(reelId, 'rejected');
    return;
  }
  if (item.kind === 'application') {
    const appId = item.id.replace(/^app-/, '');
    await recruitmentService.updateApplicationStatus(appId, 'REJECTED');
    return;
  }
  if (item.kind === 'report') {
    const reportId = item.id.replace(/^report-/, '');
    await adminService.deleteReelReport(reportId);
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
