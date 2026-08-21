import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdminDataProvider, useAdminData } from '../data/AdminDataContext';
import { AdminGateScreen } from '../screens/AdminGateScreen';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { renderAdminPane } from './renderAdminPane';
import { AdminCommandPalette } from '../ui/AdminCommandPalette';
import { AdminText } from '../ui/adminUi';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import {
  ADMIN_PRIMARY_NAV_IDS,
  findAdminNavItem,
  type AdminNavSectionId,
} from '../navigation/adminNavConfig';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminChrome, adminLayout, adminRadius, adminSpace } from '../theme/adminDesignSystem';
import { Icon } from '../../../components/ui/Icon';

interface AdminAppShellProps {
  onPreviewUserApp: () => void;
}

function AdminShellInner({ onPreviewUserApp }: AdminAppShellProps) {
  const data = useAdminData();
  const { width } = useWindowDimensions();
  const wide = width >= adminChrome.wideBreakpoint;
  const t = ADMIN_TOKENS;

  const [section, setSection] = useState<AdminNavSectionId>('accueil');
  const [focusId, setFocusId] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const navigate = useCallback((next: AdminNavSectionId, nextFocus?: string) => {
    setSection(next === 'menu' && wide ? 'accueil' : next);
    setFocusId(nextFocus);
    setMobileMenu(false);
  }, [wide]);

  const pane = useMemo(
    () =>
      renderAdminPane({
        section,
        focusId,
        onNavigate: navigate,
        onPreviewUserApp,
      }),
    [section, focusId, navigate, onPreviewUserApp],
  );

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.row}>
        {wide ? (
          <AdminSidebar
            activeId={section}
            onSelect={(id) => navigate(id)}
            onOpenCommand={() => setCommandOpen(true)}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            actionCount={data.workQueue.length}
          />
        ) : null}

        <View style={styles.main}>
          <AdminTopBar
            section={section}
            healthScore={data.health.score}
            actionCount={data.workQueue.length}
            wide={wide}
            onOpenMenu={wide ? undefined : () => setMobileMenu(true)}
            onOpenCommand={() => setCommandOpen(true)}
            onOpenHealth={() => navigate('plateforme')}
          />
          <View style={styles.content}>{pane}</View>

          {!wide ? (
            <View style={styles.dock}>
              {ADMIN_PRIMARY_NAV_IDS.map((id) => {
                const item = findAdminNavItem(id === 'menu' ? 'accueil' : id);
                const active = section === id || (id === 'menu' && section === 'menu');
                const icon =
                  id === 'menu'
                    ? 'hamburger'
                    : item?.icon ?? 'home';
                return (
                  <Pressable
                    key={id}
                    onPress={() => navigate(id)}
                    style={styles.dockItem}
                  >
                    <Icon name={icon} size={22} color={active ? t.accent : t.muted} />
                    <AdminText
                      variant="label"
                      color={active ? t.champagne : t.faint}
                      style={{ letterSpacing: 0.6, fontSize: 9 }}
                    >
                      {id === 'menu' ? 'Menu' : item?.shortLabel ?? id}
                    </AdminText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </View>

      <Modal visible={mobileMenu} animationType="slide" onRequestClose={() => setMobileMenu(false)}>
        <SafeAreaView style={styles.mobileMenu} edges={['top', 'left', 'right', 'bottom']}>
          <AdminSidebar
            activeId={section}
            onSelect={(id) => navigate(id)}
            onOpenCommand={() => {
              setMobileMenu(false);
              setCommandOpen(true);
            }}
            actionCount={data.workQueue.length}
          />
          <Pressable onPress={() => setMobileMenu(false)} style={styles.closeMenu}>
            <AdminText variant="caption" color={t.muted}>
              Fermer
            </AdminText>
          </Pressable>
        </SafeAreaView>
      </Modal>

      <AdminCommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={navigate}
      />
    </SafeAreaView>
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
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ADMIN_TOKENS.hairline,
    backgroundColor: ADMIN_TOKENS.dockBg,
    paddingTop: adminSpace.sm,
    paddingBottom: adminSpace.sm,
    paddingHorizontal: adminSpace.xs,
    minHeight: adminChrome.dockRailHeight,
  },
  dockItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    minHeight: adminLayout.hitTarget,
    justifyContent: 'center',
  },
  mobileMenu: { flex: 1, flexDirection: 'row', backgroundColor: ADMIN_TOKENS.bg },
  closeMenu: {
    position: 'absolute',
    top: 56,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: adminRadius.pill,
    backgroundColor: ADMIN_TOKENS.surfaceRaised,
    borderWidth: 1,
    borderColor: ADMIN_TOKENS.border,
  },
});
