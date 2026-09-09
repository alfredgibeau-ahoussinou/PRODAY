import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import { AdminBadge, AdminText } from '../ui/adminUi';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminChrome, adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { findAdminNavItem, type AdminNavSectionId } from '../navigation/adminNavConfig';

type Props = {
  section: AdminNavSectionId;
  healthScore: number;
  actionCount: number;
  topInset?: number;
  onOpenCommand: () => void;
  onOpenOverview: () => void;
  onOpenMenu?: () => void;
};

/**
 * Bandeau commande Espace Admin.
 */
export function OpsDeskStrip({
  section,
  healthScore,
  actionCount,
  topInset = 0,
  onOpenCommand,
  onOpenOverview,
  onOpenMenu,
}: Props) {
  const t = ADMIN_TOKENS;
  const item = findAdminNavItem(section);
  const healthTone =
    healthScore >= 80 ? 'success' : healthScore >= 50 ? 'warn' : 'danger';

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: topInset > 0 ? topInset + 4 : adminSpace.sm,
          minHeight: adminChrome.topBarHeight + (topInset > 0 ? topInset : 0),
        },
      ]}
    >
      <View style={styles.zone}>
        {onOpenMenu ? (
          <Pressable onPress={onOpenMenu} hitSlop={8} style={styles.menuBtn}>
            <Icon name="menu" size={16} color={t.signal} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <AdminText variant="label" color={t.signal}>
            ESPACE ADMIN
          </AdminText>
          <AdminText variant="h2" numberOfLines={1}>
            {item?.label ?? 'Commande'}
          </AdminText>
          {item?.hint ? (
            <AdminText variant="mono" color={t.faint} numberOfLines={1}>
              {item.hint}
            </AdminText>
          ) : null}
        </View>
      </View>

      <View style={styles.metrics}>
        <Pressable onPress={onOpenOverview} style={styles.metricChip} hitSlop={6}>
          <AdminText variant="mono" color={t.muted}>
            HEALTH
          </AdminText>
          <AdminText
            variant="h3"
            color={
              healthTone === 'success'
                ? t.success
                : healthTone === 'warn'
                  ? t.warn
                  : t.danger
            }
          >
            {healthScore}%
          </AdminText>
        </Pressable>
        {actionCount > 0 ? (
          <AdminBadge label={`FILE ${actionCount}`} tone="warn" />
        ) : (
          <AdminBadge label="FILE OK" tone="success" />
        )}
        <Pressable onPress={onOpenCommand} style={styles.cmdBtn} hitSlop={8}>
          <Icon name="search" size={16} color={t.accentText} />
          <AdminText variant="caption" color={t.accentText}>
            CMD
          </AdminText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpace.md,
    paddingHorizontal: adminLayout.headerPadX,
    paddingBottom: adminSpace.sm,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN_TOKENS.borderStrong,
    backgroundColor: ADMIN_TOKENS.stripBg,
  },
  zone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ADMIN_TOKENS.surface,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  metricChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.borderStrong,
    backgroundColor: ADMIN_TOKENS.surface,
    alignItems: 'center',
    gap: 2,
    minWidth: 64,
  },
  cmdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: adminLayout.hitTarget,
    borderRadius: adminRadius.sm,
    backgroundColor: ADMIN_TOKENS.accentHot,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.borderLuxury,
  },
});
