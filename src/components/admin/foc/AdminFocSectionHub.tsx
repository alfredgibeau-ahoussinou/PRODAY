import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AdminFocTabs } from './AdminFocTabs';
import { adminChrome } from '../../../theme/adminTheme';

type HubTab = {
  id: string;
  label: string;
  render: () => React.ReactNode;
};

type Props = {
  tabs: HubTab[];
  initialTab?: string;
};

/**
 * Regroupe plusieurs écrans FOC sous des onglets de premier niveau.
 */
export function AdminFocSectionHub({ tabs, initialTab }: Props) {
  const styles = useMemo(() => createStyles(), []);
  const [tab, setTab] = useState(initialTab ?? tabs[0]?.id ?? '');

  useEffect(() => {
    if (initialTab && tabs.some((t) => t.id === initialTab)) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const active = tabs.find((t) => t.id === tab) ?? tabs[0];
  if (!active) return null;

  const tabDefs = tabs.map(({ id, label }) => ({ id, label }));

  return (
    <View style={styles.root}>
      <AdminFocTabs tabs={tabDefs} value={tab} onChange={setTab} />
      <View style={styles.body}>{active.render()}</View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.band },
    body: { flex: 1, minHeight: 0 },
  });
}
