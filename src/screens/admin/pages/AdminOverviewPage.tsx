import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../../../components/motion';
import { useAdminData } from '../../../context/AdminDataContext';
import { AdminPageScaffold } from '../../../components/admin/AdminPageScaffold';
import { AdminStatGrid } from '../../../components/admin/AdminStatGrid';
import { ProDaySurface } from '../../../components/ui/ProDaySurface';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { useAdminStyles } from '../../../components/admin/adminStyles';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing, radius } from '../../../theme/designTokens';
import type { AdminMainTabId } from '../../../navigation/adminTabConfig';
import type { AppColors } from '../../../theme/universeTheme';

interface AdminOverviewPageProps {
  onNavigate: (tab: AdminMainTabId) => void;
}

export const AdminOverviewPage: React.FC<AdminOverviewPageProps> = ({ onNavigate }) => {
  const { loading, stats } = useAdminData();
  const { colors: c } = useAdminStyles();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(c), [c]);

  const moderationPending =
    (stats?.pendingCommunityReels ?? 0) + (stats?.reelReports ?? 0);

  return (
    <AdminPageScaffold
      title={t('admin.overview.title')}
      subtitle={t('admin.overview.subtitle')}
      loading={loading}
    >
      {stats ? <AdminStatGrid stats={stats} /> : null}

      {stats && stats.pendingVerifications > 0 ? (
        <AlertRow
          icon="shield"
          title={t('admin.overview.verifications', { n: stats.pendingVerifications })}
          subtitle={t('admin.overview.verificationsSub')}
          onPress={() => onNavigate('users')}
          color={c.warning}
          styles={styles}
        />
      ) : null}

      {stats && stats.pendingCommunityReels > 0 ? (
        <AlertRow
          icon="time"
          title={t('admin.overview.reelsModerate', { n: stats.pendingCommunityReels })}
          subtitle={t('admin.overview.reelsModerateSub')}
          onPress={() => onNavigate('contenu')}
          color={c.brand}
          styles={styles}
        />
      ) : null}

      {stats && stats.reelReports > 0 ? (
        <AlertRow
          icon="warning"
          title={t('admin.overview.reelReports', { n: stats.reelReports })}
          subtitle={t('admin.overview.reelReportsSub')}
          onPress={() => onNavigate('contenu')}
          color={c.warning}
          styles={styles}
        />
      ) : null}

      <ProDayText variant="eyebrow" accent style={styles.sectionLabel}>
        {t('admin.overview.quickAccess')}
      </ProDayText>
      <View style={styles.grid}>
        <NavTile icon="people" label={t('admin.overview.users')} hint={t('admin.overview.usersHint')} onPress={() => onNavigate('users')} styles={styles} brand={c.brand} />
        <NavTile icon="time" label={t('admin.overview.moderation')} hint={t('admin.overview.moderationHint', { n: moderationPending })} onPress={() => onNavigate('contenu')} styles={styles} brand={c.brand} />
        <NavTile icon="business" label={t('admin.overview.clubs')} hint={t('admin.overview.clubsHint')} onPress={() => onNavigate('clubs')} styles={styles} brand={c.brand} />
        <NavTile icon="settings" label={t('admin.overview.system')} hint={t('admin.overview.systemHint')} onPress={() => onNavigate('system')} styles={styles} brand={c.brand} />
      </View>

      {stats ? (
        <ProDaySurface variant="module" style={styles.summaryCard}>
          <ProDayText variant="section">{t('admin.overview.summary')}</ProDayText>
          <ProDayText variant="body" muted style={styles.summaryLine}>
            {t('admin.overview.summaryLine1', {
              users: stats.users,
              clubs: stats.clubs,
              events: stats.teamEvents,
            })}
          </ProDayText>
          <ProDayText variant="body" muted style={styles.summaryLine}>
            {t('admin.overview.summaryLine2', {
              posts: stats.recruitmentPosts,
              apps: stats.applications,
              reels: stats.pendingCommunityReels,
            })}
          </ProDayText>
        </ProDaySurface>
      ) : null}
    </AdminPageScaffold>
  );
};

const AlertRow: React.FC<{
  icon: 'shield' | 'time' | 'warning';
  title: string;
  subtitle: string;
  onPress: () => void;
  color: string;
  styles: ReturnType<typeof createStyles>;
}> = ({ icon, title, subtitle, onPress, color, styles }) => (
  <PressableSpring onPress={onPress} scaleTo={0.98} haptic>
    <View style={[styles.alert, { borderColor: color }]}>
      <Icon name={icon} size={22} color={color} />
      <View style={styles.alertCopy}>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={[styles.alertSub, { color }]}>{subtitle}</Text>
      </View>
      <Icon name="chevron-forward" size={18} color={color} />
    </View>
  </PressableSpring>
);

type OverviewStyles = ReturnType<typeof createStyles>;

const NavTile: React.FC<{
  icon: 'people' | 'time' | 'business' | 'settings';
  label: string;
  hint: string;
  onPress: () => void;
  brand: string;
  styles: OverviewStyles;
}> = ({ icon, label, hint, onPress, brand, styles }) => (
  <PressableSpring onPress={onPress} scaleTo={0.97} haptic>
    <View style={styles.tile}>
      <Icon name={icon} size={22} color={brand} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileHint}>{hint}</Text>
    </View>
  </PressableSpring>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    alert: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      marginBottom: spacing.sm,
    },
    alertCopy: { flex: 1 },
    alertTitle: { fontSize: 14, fontWeight: '900', color: c.text },
    alertSub: { fontSize: 12, marginTop: 2, fontWeight: '700' },
    sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.xs },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    tile: {
      width: '47%',
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: 4,
    },
    tileLabel: { fontSize: 13, fontWeight: '900', color: c.text },
    tileHint: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
    summaryCard: {
      padding: spacing.md,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: c.border,
    },
    summaryLine: { lineHeight: 20 },
  });
}
