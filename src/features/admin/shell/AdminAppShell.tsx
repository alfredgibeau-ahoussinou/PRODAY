import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminDataProvider, useAdminData } from '../data/AdminDataContext';
import { AdminGateScreen } from '../screens/AdminGateScreen';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { renderAdminPane } from './renderAdminPane';
import { AdminCommandPalette } from '../ui/AdminCommandPalette';
import { AdminText } from '../ui/adminUi';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import {
  ADMIN_MENU_DEST_IDS,
  ADMIN_PRIMARY_NAV_IDS,
  findAdminNavItem,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminChrome, adminLayout, adminSpace } from '../theme/adminDesignSystem';
import { Icon } from '../../../components/ui/Icon';

interface AdminAppShellProps {
  onPreviewUserApp: () => void;
}

function AdminShellInner({ onPreviewUserApp }: AdminAppShellProps) {
  const data = useAdminData();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= adminChrome.wideBreakpoint;
  const t = ADMIN_TOKENS;

  const [section, setSection] = useState<AdminNavSectionId>('accueil');
  const [focusId, setFocusId] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const navigate = useCallback((next: AdminNavSectionId, nextFocus?: string) => {
    setSection(next === 'menu' && wide ? 'accueil' : next);
    setFocusId(nextFocus);
  }, [wide]);

  const openCommand = useCallback(() => setCommandOpen(true), []);

  const pane = useMemo(
    () =>
      renderAdminPane({
        section,
        focusId,
        onNavigate: navigate,
        onPreviewUserApp,
        onOpenCommand: openCommand,
      }),
    [section, focusId, navigate, onPreviewUserApp, openCommand],
  );

  const dockPadBottom = Math.max(insets.bottom, 10);
  /** Mobile : pas de top bar — le contenu commence sous la status bar. */
  const contentTopPad = wide ? 0 : insets.top + adminLayout.contentTop;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <View style={styles.row}>
          {wide ? (
            <AdminSidebar
              activeId={section}
              onSelect={(id) => navigate(id)}
              onOpenCommand={openCommand}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
              actionCount={data.workQueue.length}
            />
          ) : null}

          <View style={styles.main}>
            {wide ? (
              <AdminTopBar
                section={section}
                healthScore={data.health.score}
                actionCount={data.workQueue.length}
                topInset={insets.top}
                onOpenCommand={openCommand}
                onOpenHealth={() => navigate('plateforme')}
              />
            ) : null}

            <View style={[styles.content, { paddingTop: contentTopPad }]}>{pane}</View>

            {!wide ? (
              <View style={[styles.dock, { paddingBottom: dockPadBottom }]}>
                <LinearGradient
                  colors={['transparent', 'rgba(212,184,128,0.06)']}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.dockRail}>
                  {ADMIN_PRIMARY_NAV_IDS.map((id) => {
                    const item = findAdminNavItem(id === 'menu' ? 'accueil' : id);
                    const active =
                      id === 'menu'
                        ? section === 'menu' || ADMIN_MENU_DEST_IDS.includes(section)
                        : section === id;
                    const icon = id === 'menu' ? 'hamburger' : item?.icon ?? 'home';
                    return (
                      <Pressable
                        key={id}
                        onPress={() => navigate(id)}
                        style={[styles.dockItem, active && styles.dockItemActive]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                      >
                        <Icon
                          name={icon}
                          size={adminChrome.tabBarIcon}
                          color={active ? t.accent : t.muted}
                        />
                        <AdminText
                          variant="caption"
                          color={active ? t.champagneBright : t.muted}
                          style={{
                            fontWeight: active ? '800' : '500',
                            fontSize: 10,
                            letterSpacing: active ? 0.4 : 0,
                          }}
                          numberOfLines={1}
                        >
                          {id === 'menu' ? 'Menu' : item?.shortLabel ?? id}
                        </AdminText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>

      <AdminCommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={navigate}
      />
    </View>
  );
}

export const AdminAppShell: React.FC<AdminAppShellProps> = ({ onPreviewUserApp }) => {
  const { isAdmin, claimLoading } = useIsAdmin();
  const t = ADMIN_TOKENS;

  if (claimLoading) {
    return (
      <SafeAreaView style={styles.loader} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={t.accent} />
        <AdminText variant="caption" color={t.muted}>
          Chargement du Control Center…
        </AdminText>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.loader} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <AdminGateScreen />
      </SafeAreaView>
    );
  }

  return (
    <AdminDataProvider>
      <AdminShellInner onPreviewUserApp={onPreviewUserApp} />
    </AdminDataProvider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ADMIN_TOKENS.bg },
  safe: { flex: 1 },
  row: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, backgroundColor: ADMIN_TOKENS.bg },
  content: { flex: 1 },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpace.lg,
    backgroundColor: ADMIN_TOKENS.bg,
  },
  dock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ADMIN_TOKENS.hairline,
    backgroundColor: ADMIN_TOKENS.dockBg,
    paddingTop: adminSpace.sm,
    paddingHorizontal: adminSpace.xs,
  },
  dockRail: {
    flexDirection: 'row',
    minHeight: adminChrome.dockRailHeight,
    alignItems: 'center',
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    minHeight: adminLayout.hitTarget,
    justifyContent: 'center',
    borderRadius: 12,
  },
  dockItemActive: {
    backgroundColor: ADMIN_TOKENS.accentSoft,
  },
});
