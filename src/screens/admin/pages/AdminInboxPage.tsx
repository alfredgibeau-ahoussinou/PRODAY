import React, { useMemo, useState } from 'react';
import { useAdminData } from '../../../context/AdminDataContext';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminPageHero } from '../../../components/admin/AdminPageHero';
import { AdminWorkQueue } from '../../../components/admin/AdminWorkQueue';
import { AdminKpiStrip } from '../../../components/admin/AdminKpiStrip';
import { AdminFilterChips } from '../../../components/admin/AdminFilterChips';
import { AdminSectionHeader } from '../../../components/admin/AdminSectionHeader';
import { countWorkByKind, type AdminWorkItem } from '../../../utils/adminInsights';
import type { AdminMainTabId } from '../../../navigation/adminTabConfig';

interface AdminInboxPageProps {
  onNavigate: (tab: AdminMainTabId, item?: AdminWorkItem) => void;
}

type InboxFilter = 'all' | AdminWorkItem['kind'];

export const AdminInboxPage: React.FC<AdminInboxPageProps> = ({ onNavigate }) => {
  const { loading, workQueue, stats } = useAdminData();
  const [filter, setFilter] = useState<InboxFilter>('all');

  const counts = useMemo(() => countWorkByKind(workQueue), [workQueue]);
  const filtered =
    filter === 'all' ? workQueue : workQueue.filter((w) => w.kind === filter);

  const FILTERS: { id: InboxFilter; label: string; count?: number }[] = [
    { id: 'all', label: 'Tout', count: workQueue.length },
    { id: 'verification', label: 'Vérif.', count: counts.verification },
    { id: 'reel', label: 'Reels', count: counts.reel },
    { id: 'report', label: 'Signalements', count: counts.report },
    { id: 'payment', label: 'Paiements', count: counts.payment },
    { id: 'application', label: 'Candidatures', count: counts.application },
    { id: 'quote', label: 'Devis', count: counts.quote },
  ];

  return (
    <AdminPageScaffold loading={loading}>
      <AdminPageHero
        kicker="OPS"
        title="Inbox"
        subtitle={
          workQueue.length === 0
            ? 'File vide — rien à traiter pour le moment.'
            : `${workQueue.length} élément${workQueue.length > 1 ? 's' : ''} prioritaire${workQueue.length > 1 ? 's' : ''}. Touchez pour naviguer.`
        }
        actions={
          workQueue.length > 0
            ? [
                {
                  label: 'Tout afficher',
                  icon: 'mail',
                  onPress: () => setFilter('all'),
                },
              ]
            : undefined
        }
      />

      <AdminKpiStrip
        items={[
          {
            key: 'total',
            label: 'Ouvertes',
            value: workQueue.length,
            icon: 'mail',
            alert: workQueue.length > 0,
            onPress: () => setFilter('all'),
          },
          {
            key: 'verify',
            label: 'Vérifications',
            value: counts.verification,
            icon: 'people',
            alert: counts.verification > 0,
            onPress: () => setFilter('verification'),
          },
          {
            key: 'mod',
            label: 'Modération',
            value: counts.reel + counts.report,
            icon: 'warning',
            alert: counts.reel + counts.report > 0,
            onPress: () => setFilter(counts.report > counts.reel ? 'report' : 'reel'),
          },
          {
            key: 'pay',
            label: 'Paiements',
            value: stats?.pendingPayments ?? counts.payment,
            icon: 'document',
            alert: (stats?.pendingPayments ?? 0) > 0,
            onPress: () => setFilter('payment'),
          },
        ]}
      />

      <AdminFilterChips options={FILTERS} value={filter} onChange={setFilter} />

      <AdminSectionHeader
        title="File prioritaire"
        count={filtered.length}
        hint="Triée par criticité"
      />

      <AdminWorkQueue
        items={filtered}
        onPressItem={(item) => onNavigate(item.targetTab, item)}
      />
    </AdminPageScaffold>
  );
};
