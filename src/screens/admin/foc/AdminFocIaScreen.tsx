import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AdminPlatformConfigPanel } from '../../../components/admin/AdminPlatformConfigPanel';
import { AdminFocPageHeader } from '../../../components/admin/foc/AdminFocTabs';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

/**
 * Supervision des flags plateforme réels (IA, vidéo, modules) — pas un stub.
 */
export function AdminFocIaScreen() {
  const styles = useMemo(() => createStyles(), []);
  return (
    <View style={styles.root}>
      <AdminFocPageHeader
        title="IA ProDay"
        subtitle="Flags live (platform_config). Chaque interrupteur écrit Firestore et s’applique dans l’app."
      />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.note}>
          <Text style={styles.noteTitle}>Ce n’est pas un playground</Text>
          <Text style={styles.noteBody}>
            Vidéo Club / Coach, Reels, Mercato, boutique : les bascules ci-dessous sont les
            vraies clés produit. Aucun bouton Connect OAuth fictif.
          </Text>
        </View>
        <AdminPlatformConfigPanel />
      </ScrollView>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.band },
    body: { padding: spacing.md, paddingBottom: 80, gap: spacing.md },
    note: {
      backgroundColor: adminChrome.shell,
      borderRadius: adminChrome.radius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
      padding: spacing.md,
      gap: 6,
    },
    noteTitle: {
      fontFamily: adminType.bodyExtra,
      fontSize: 14,
      fontWeight: '800',
      color: adminChrome.text,
    },
    noteBody: {
      fontFamily: adminType.body,
      fontSize: 13,
      lineHeight: 19,
      color: adminChrome.textMuted,
    },
  });
}
