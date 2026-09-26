import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import { AdminBadge, AdminText } from '../ui/adminUi';
import { useAdminTokens, ADMIN_TOKENS } from '../theme/adminTokens';
import { adminChrome, adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { findAdminNavItem, type AdminNavSectionId } from '../navigation/adminNavConfig';
import { useAppearance } from '../../../context/AppearanceContext';

type Props = {
  section: AdminNavSectionId;
  healthScore: number;
  actionCount: number;
  topInset?: number;
  showMenuButton?: boolean;
  canGoBack?: boolean;
  onBack?: () => void;
  onOpenCommand: () => void;
  onOpenOverview: () => void;
  onOpenMenu?: () => void;
};

/**
 * Bandeau Espace Admin Liquid Glass Apple — un seul bouton Menu clair + recherche + bascule Glass.
 */
export function OpsDeskStrip({
  section,
  healthScore,
  actionCount,
  topInset = 0,
  showMenuButton = false,
  canGoBack = false,
  onBack,
  onOpenCommand,
  onOpenOverview,
  onOpenMenu,
}: Props) {
  const t = useAdminTokens();
  const { isEffectiveGlass, glassMode, setGlassMode } = useAppearance();
  const item = findAdminNavItem(section);
  const healthTone =
    healthScore >= 80 ? 'success' : healthScore >= 50 ? 'warn' : 'danger';

  const toggleGlass = () => {
    if (glassMode === 'opaque') {
      void setGlassMode('glass');
    } else if (glassMode === 'glass') {
      void setGlassMode('system');
    } else {
      void setGlassMode('opaque');
    }
  };

  const resolvedTop = Math.max(topInset, Platform.OS === 'ios' ? 52 : 24);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: resolvedTop + adminSpace.xs,
          paddingBottom: adminSpace.md,
          minHeight: adminChrome.topBarHeight + resolvedTop,
          backgroundColor: t.stripBg,
          borderBottomColor: t.borderStrong,
          ...(t.glassBackdrop as any),
        },
      ]}
    >
      <View style={styles.zone}>
        {canGoBack && onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            testID="admin-back-btn"
          >
            <Icon name="arrow-back" size={16} color={t.signal} />
            <AdminText variant="caption" color={t.signal} style={{ fontWeight: '700' }}>
              Retour
            </AdminText>
          </Pressable>
        ) : null}
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
        <Pressable
          onPress={toggleGlass}
          style={[styles.glassToggleChip, { borderColor: isEffectiveGlass ? t.signal : t.border }]}
          hitSlop={6}
          accessibilityLabel="Bascule mode Liquid Glass"
          testID="admin-glass-toggle"
        >
          <Icon name="sparkles" size={12} color={isEffectiveGlass ? t.signal : t.faint} />
          <AdminText
            variant="label"
            color={isEffectiveGlass ? t.signal : t.faint}
            style={{ fontSize: 8, letterSpacing: 0.6 }}
          >
            {isEffectiveGlass ? 'GLASS' : 'OPAQUE'}
          </AdminText>
        </Pressable>

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
  },
  zone: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: adminLayout.hitTarget,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.signal,
    backgroundColor: ADMIN_TOKENS.accentSoft,
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
    backgroundColor: ADMIN_TOKENS.accentSoft,
  },
  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  glassToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: adminRadius.sm,
    borderWidth: 1,
    backgroundColor: ADMIN_TOKENS.surface,
    minHeight: 30,
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
