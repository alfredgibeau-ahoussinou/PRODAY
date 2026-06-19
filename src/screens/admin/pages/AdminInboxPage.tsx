import React, { useMemo, useState } from 'react';
import { useAdminData } from '../../../context/AdminDataContext';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminWorkQueue } from '../../../components/admin/AdminWorkQueue';
import { AdminKpiStrip } from '../../../components/admin/AdminKpiStrip';
import { AdminFilterChips } from '../../../components/admin/AdminFilterChips';
import { countWorkByKind, type AdminWorkItem } from '../../../utils/adminInsights';
import type { AdminMainTabId } from '../../../navigation/adminTabConfig';

interface AdminInboxPageProps {
  onNavigate: (tab: AdminMainTabId, item?: AdminWorkItem) => void;
}

type InboxFilter = 'all' | AdminWorkItem['kind'];

const FILTERS: { id: InboxFilter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'verification', label: 'Vérif.' },
  { id: 'reel', label: 'Reels' },
  { id: 'report', label: 'Signalements' },
  { id: 'payment', label: 'Paiements' },
  { id: 'application', label: 'Candidatures' },
];

export const AdminInboxPage: React.FC<AdminInboxPageProps> = ({ onNavigate }) => {
  const { loading, workQueue, stats } = useAdminData();
  const [filter, setFilter] = useState<InboxFilter>('all');

  const counts = useMemo(() => countWorkByKind(workQueue), [workQueue]);
  const filtered =
    filter === 'all' ? workQueue : workQueue.filter((w) => w.kind === filter);

  return (
    <AdminPageScaffold loading={loading}>
      <AdminKpiStrip
        items={[
          {
            key: 'total',
            label: 'Actions ouvertes',
            value: workQueue.length,
            icon: 'mail',
            alert: workQueue.length > 0,
          },
          {
            key: 'verify',
            label: 'Vérifications',
            value: counts.verification,
            icon: 'people',
            alert: counts.verification > 0,
          },
          {
            key: 'mod',
            label: 'Modération reels',
            value: counts.reel + counts.report,
            icon: 'warning',
            alert: counts.reel + counts.report > 0,
          },
          {
            key: 'pay',
            label: 'Paiements pending',
            value: stats?.pendingPayments ?? counts.payment,
            icon: 'document',
            alert: (stats?.pendingPayments ?? 0) > 0,
          },
        ]}
      />

      <AdminFilterChips options={FILTERS} value={filter} onChange={setFilter} />

      <AdminWorkQueue
        items={filtered}
        onPressItem={(item) => onNavigate(item.targetTab, item)}
      />
    </AdminPageScaffold>
  );
};
