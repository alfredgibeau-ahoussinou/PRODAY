import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { AdminFocMatchsScreen } from './AdminFocMatchsScreen';
import { AdminFocCompetitionsScreen } from './AdminFocCompetitionsScreen';
import { AdminFocTabs, AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { ADMIN_MATCHS_EVENTS_TABS } from '../../../navigation/adminNavConfig';
import { adminChrome } from '../../../theme/adminTheme';

type TabId = (typeof ADMIN_MATCHS_EVENTS_TABS)[number]['id'];

type Props = {
  initialTab?: string;
};

export function AdminMatchsEventsScreen({ initialTab }: Props) {
  const [tab, setTab] = useState<TabId>(
    (ADMIN_MATCHS_EVENTS_TABS.some((t) => t.id === initialTab)
      ? initialTab
      : 'matchs') as TabId,
  );

  return (
    <View style={styles.root}>
      <AdminFocPageHeader
        title="Matchs & Événements"
        subtitle="Calendrier matchs amicaux, tournois et événements club."
      />
      <AdminFocTabs
        tabs={[...ADMIN_MATCHS_EVENTS_TABS]}
        value={tab}
        onChange={(id) => setTab(id as TabId)}
      />
      {tab === 'matchs' ? (
        <AdminFocMatchsScreen embedded />
      ) : (
        <AdminFocCompetitionsScreen embedded />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
});
