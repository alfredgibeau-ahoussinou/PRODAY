import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AdminPlatformConfigPanel } from '../../../components/admin/AdminPlatformConfigPanel';
import { AdminBetaProgramPanel } from '../../../components/admin/AdminBetaProgramPanel';
import { AdminOpsDataPanel } from '../../../components/admin/AdminOpsDataPanel';
import { AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

export function AdminFocConfigScreen() {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: adminChrome.band },
        body: { padding: spacing.md, paddingBottom: 80, gap: spacing.md },
      }),
    [],
  );
  return (
    <View style={styles.root}>
      <AdminFocPageHeader
        title="Configuration plateforme"
        subtitle="Flags, maintenance, données ops et programme bêta."
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <AdminPlatformConfigPanel />
        <AdminOpsDataPanel />
        <AdminBetaProgramPanel />
      </ScrollView>
    </View>
  );
}
