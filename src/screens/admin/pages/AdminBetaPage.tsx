import React from 'react';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminBetaProgramPanel } from '../../../components/admin/AdminBetaProgramPanel';

export const AdminBetaPage: React.FC = () => {
  return (
    <AdminPageScaffold loading={false}>
      <AdminBetaProgramPanel />
    </AdminPageScaffold>
  );
};
