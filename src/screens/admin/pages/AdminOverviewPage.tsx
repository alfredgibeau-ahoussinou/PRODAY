import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAdminData } from '../../../context/AdminDataContext';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminStatGrid } from '../../../components/admin/AdminStatGrid';
import { Icon } from '../../../components/ui/Icon';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import { spacing, radius } from '../../../theme/designTokens';
import type { AdminMainTabId } from '../../../navigation/adminTabConfig';
import type { AppColors } from '../../../theme/universeTheme';

interface AdminOverviewPageProps {
  onNavigate: (tab: AdminMainTabId) => void;
}

export const AdminOverviewPage: React.FC<AdminOverviewPageProps> = ({ onNavigate }) => {
  const { loading, stats } = useAdminData();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <AdminPageScaffold
      title="Pilotage plateforme"
      subtitle="Vue d’ensemble · modération · indicateurs temps réel"
      loading={loading}
    >
      {stats ? <AdminStatGrid stats={stats} /> : null}

      {stats && stats.pendingVerifications > 0 ? (
        <TouchableOpacity style={styles.alert} onPress={() => onNavigate('users')}>
          <Icon name="warning" size={22} color={c.warning} />
          <View style={styles.alertCopy}>
            <Text style={styles.alertTitle}>
              {stats.pendingVerifications} vérification(s) en attente
            </Text>
            <Text style={styles.alertSub}>Ouvrir la modération utilisateurs →</Text>
          </View>
          <Icon name="chevron-forward" size={18} color={c.warning} />
        </TouchableOpacity>
      ) : null}

      <Text style={styles.sectionLabel}>ACCÈS RAPIDES</Text>
      <View style={styles.grid}>
        <NavTile icon="people" label="Utilisateurs" onPress={() => onNavigate('users')} brand={c.brand} styles={styles} />
        <NavTile icon="calendar" label="Contenu" onPress={() => onNavigate('contenu')} brand={c.brand} styles={styles} />
        <NavTile icon="business" label="Clubs & finance" onPress={() => onNavigate('clubs')} brand={c.brand} styles={styles} />
        <NavTile icon="settings" label="Système" onPress={() => onNavigate('system')} brand={c.brand} styles={styles} />
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

type OverviewStyles = ReturnType<typeof createStyles>;

const NavTile: React.FC<{
  icon: 'people' | 'calendar' | 'business' | 'settings';
  label: string;
  onPress: () => void;
  brand: string;
  styles: OverviewStyles;
}> = ({ icon, label, onPress, brand, styles }) => (
  <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.88}>
    <Icon name={icon} size={22} color={brand} />
    <Text style={styles.tileLabel}>{label}</Text>
  </TouchableOpacity>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    alert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.warningBg,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.warning,
      marginBottom: spacing.md,
    },
    alertCopy: { flex: 1 },
    alertTitle: { fontSize: 14, fontWeight: '900', color: c.text },
    alertSub: { fontSize: 12, color: c.warning, marginTop: 2, fontWeight: '700' },
    sectionLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: c.brand,
      letterSpacing: 1.2,
      marginBottom: spacing.sm,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    tile: {
      width: '47%',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    tileLabel: { fontSize: 13, fontWeight: '800', color: c.text },
    summaryCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    summaryTitle: { fontSize: 14, fontWeight: '900', color: c.text, marginBottom: spacing.sm },
    summaryLine: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });
}
