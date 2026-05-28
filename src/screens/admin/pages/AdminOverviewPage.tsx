import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminStatGrid } from '../../../components/admin/AdminStatGrid';
import { Icon } from '../../../components/ui/Icon';
import { colors, spacing, radius } from '../../../theme/designTokens';
import type { AdminMainTabId } from '../../../navigation/adminTabConfig';

interface AdminOverviewPageProps {
  onNavigate: (tab: AdminMainTabId) => void;
}

export const AdminOverviewPage: React.FC<AdminOverviewPageProps> = ({ onNavigate }) => {
  const { loading, stats } = useAdminData();

  return (
    <AdminPageScaffold
      title="Pilotage plateforme"
      subtitle="Vue d’ensemble · modération · indicateurs temps réel"
      loading={loading}
    >
      {stats ? <AdminStatGrid stats={stats} /> : null}

      {stats && stats.pendingVerifications > 0 ? (
        <TouchableOpacity style={styles.alert} onPress={() => onNavigate('users')}>
          <Icon name="warning" size={22} color={colors.warning} />
          <View style={styles.alertCopy}>
            <Text style={styles.alertTitle}>
              {stats.pendingVerifications} vérification(s) en attente
            </Text>
            <Text style={styles.alertSub}>Ouvrir la modération utilisateurs →</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={colors.warning} />
        </TouchableOpacity>
      ) : null}

      <Text style={styles.sectionLabel}>ACCÈS RAPIDES</Text>
      <View style={styles.grid}>
        <NavTile icon="people" label="Utilisateurs" onPress={() => onNavigate('users')} />
        <NavTile icon="calendar" label="Contenu" onPress={() => onNavigate('contenu')} />
        <NavTile icon="business" label="Clubs & finance" onPress={() => onNavigate('clubs')} />
        <NavTile icon="settings" label="Système" onPress={() => onNavigate('system')} />
      </View>

      {stats ? (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Synthèse</Text>
          <Text style={styles.summaryLine}>
            {stats.users} comptes · {stats.clubs} clubs · {stats.teamEvents} événements
          </Text>
          <Text style={styles.summaryLine}>
            {stats.recruitmentPosts} annonces mercato · {stats.applications} candidatures ·{' '}
            {stats.paymentRequests} cotisations
          </Text>
        </View>
      ) : null}
    </AdminPageScaffold>
  );
};

const NavTile: React.FC<{
  icon: 'people' | 'calendar' | 'business' | 'settings';
  label: string;
  onPress: () => void;
}> = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.88}>
    <Icon name={icon} size={22} color={colors.accent} />
    <Text style={styles.tileLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warningBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
    marginBottom: spacing.md,
  },
  alertCopy: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '900', color: colors.text },
  alertSub: { fontSize: 12, color: colors.warning, marginTop: 2, fontWeight: '700' },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  tile: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  tileLabel: { fontSize: 13, fontWeight: '800', color: colors.text },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: { fontSize: 14, fontWeight: '900', color: colors.text, marginBottom: spacing.sm },
  summaryLine: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
