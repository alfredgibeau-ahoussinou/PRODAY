import React from 'react';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminPageHero } from '../../../components/admin/AdminPageHero';
import { AdminBetaProgramPanel } from '../../../components/admin/AdminBetaProgramPanel';

export const AdminBetaPage: React.FC = () => {
  return (
    <AdminPageScaffold loading={false}>
      <AdminPageHero
        kicker="CROISSANCE"
        title="Programme bêta"
        subtitle="Waitlist, invitations et campagnes d’accès anticipé."
      />
      <AdminBetaProgramPanel />
    </AdminPageScaffold>
  );
};
