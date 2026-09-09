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
  /** Affiche le bouton Menu (mobile — pas de rail permanent). */
  showMenuButton?: boolean;
  onOpenCommand: () => void;
  onOpenOverview: () => void;
  onOpenMenu?: () => void;
};

/**
 * Bandeau Espace Admin — un seul bouton Menu clair + recherche secondaire.
 */
export function OpsDeskStrip({
  section,
  healthScore,
  actionCount,
  topInset = 0,
  showMenuButton = false,
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
        {showMenuButton && onOpenMenu ? (
          <Pressable
            onPress={onOpenMenu}
            hitSlop={8}
            style={styles.menuBtn}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir le menu"
            testID="admin-menu-open"
          >
            <Icon name="hamburger" size={18} color={t.signal} />
            <AdminText variant="caption" color={t.signal}>
              Menu
            </AdminText>
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
        <Pressable
          onPress={onOpenCommand}
          style={styles.searchBtn}
          hitSlop={8}
          accessibilityLabel="Recherche commande"
          testID="admin-command-open"
        >
          <Icon name="search" size={18} color={t.muted} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: adminLayout.hitTarget,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.signal,
    backgroundColor: 'rgba(232,184,74,0.12)',
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
  searchBtn: {
    width: adminLayout.hitTarget,
    height: adminLayout.hitTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.border,
    backgroundColor: ADMIN_TOKENS.surface,
  },
});
