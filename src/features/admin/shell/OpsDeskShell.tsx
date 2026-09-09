import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminDataProvider, useAdminData } from '../data/AdminDataContext';
import { AdminGateScreen } from '../screens/AdminGateScreen';
import { OpsDeskRail } from './OpsDeskRail';
import { OpsDeskMenuDrawer } from './OpsDeskMenuDrawer';
import { OpsDeskStrip } from './OpsDeskStrip';
import { renderAdminPane } from './renderAdminPane';
import { AdminCommandPalette } from '../ui/AdminCommandPalette';
import { AdminText } from '../ui/adminUi';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
import { useAuth } from '../../../context/AuthContext';
import type { AdminNavSectionId } from '../navigation/adminNavConfig';
import { ADMIN_TOKENS } from '../theme/adminTokens';
import { adminChrome, adminSpace } from '../theme/adminDesignSystem';
import {
  AdminMotionProvider,
  AdminPaneSkeleton,
  AdminPaneTransition,
  useAdminMotion,
  type AdminNavDirection,
} from '../motion';
import { userNeedsAdminVerificationReview } from '../../../utils/adminUserVerification';

interface OpsDeskShellProps {
  onPreviewUserApp: () => void;
  onPreviewPresidentPole?: () => void;
}

/** Inset top fiable (hook + fallback status bar — évite le collé sous le notch). */
function useAdminTopInset(): number {
  const insets = useSafeAreaInsets();
  const fallback =
    Platform.OS === 'android'
      ? RNStatusBar.currentHeight ?? 0
      : Constants.statusBarHeight ?? 0;
  return Math.max(insets.top, fallback);
}

function OpsDeskInner({ onPreviewUserApp, onPreviewPresidentPole }: OpsDeskShellProps) {
  const data = useAdminData();
  const { signOut } = useAuth();
  const topInset = useAdminTopInset();
  const { width } = useWindowDimensions();
  const expandedRail = width >= adminChrome.tabletBreakpoint;
  const { recordNav, navDirection } = useAdminMotion();

  const [section, setSection] = useState<AdminNavSectionId>('overview');
  const [focusId, setFocusId] = useState<string | undefined>();
  const [commandOpen, setCommandOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [direction, setDirection] = useState<AdminNavDirection>(1);
  const sectionRef = useRef(section);
  sectionRef.current = section;

  const navigate = useCallback(
    (next: AdminNavSectionId, nextFocus?: string) => {
      const dir = recordNav(sectionRef.current, next);
      setDirection(dir);
      setSection(next);
      setFocusId(nextFocus);
    },
    [recordNav],
  );

  const openCommand = useCallback(() => setCommandOpen(true), []);

  const requestSignOut = useCallback(() => {
    Alert.alert('Déconnexion', 'Quitter l’Espace Admin ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: () => {
          setMenuOpen(false);
          void signOut();
        },
      },
    ]);
  }, [signOut]);

  const pane = useMemo(
    () =>
      renderAdminPane({
        section,
        focusId,
        onNavigate: navigate,
        onPreviewUserApp,
        onPreviewPresidentPole,
      }),
    [section, focusId, navigate, onPreviewUserApp, onPreviewPresidentPole],
  );

  const verificationsCount = data.users.filter(userNeedsAdminVerificationReview).length;
  const badgeCounts = {
    queueCount: data.workQueue.length,
    membershipsCount: data.pendingMemberships.length,
    verificationsCount,
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['left', 'right']}>
        <View style={styles.row}>
          {expandedRail ? (
            <OpsDeskRail
              activeId={section}
              onSelect={(id) => navigate(id)}
              onOpenCommand={openCommand}
              onSignOut={requestSignOut}
              topInset={topInset}
              {...badgeCounts}
            />
          ) : null}

          <View style={styles.main}>
            <OpsDeskStrip
              section={section}
              healthScore={data.health.score}
              actionCount={data.workQueue.length}
              topInset={topInset}
              showMenuButton={!expandedRail}
              onOpenCommand={openCommand}
              onOpenOverview={() => navigate('overview')}
              onOpenMenu={() => setMenuOpen(true)}
            />

            <View
              style={[
                styles.content,
                width >= adminChrome.wideBreakpoint ? styles.contentWide : null,
              ]}
            >
              <AdminPaneTransition
                sectionKey={section}
                direction={direction || navDirection}
                context="tab"
              >
                {React.isValidElement(pane) ? pane : null}
              </AdminPaneTransition>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {!expandedRail ? (
        <OpsDeskMenuDrawer
          open={menuOpen}
          activeId={section}
          onSelect={(id) => navigate(id)}
          onClose={() => setMenuOpen(false)}
          onSignOut={requestSignOut}
          topInset={topInset}
          {...badgeCounts}
        />
      ) : null}

      <AdminCommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={navigate}
      />
    </View>
  );
}

/**
 * Espace Admin — shell fondateur control room.
 */
export const OpsDeskShell: React.FC<OpsDeskShellProps> = ({
  onPreviewUserApp,
  onPreviewPresidentPole,
}) => {
  const { isAdmin, claimLoading } = useIsAdmin();
  const t = ADMIN_TOKENS;

  if (claimLoading) {
    return (
      <SafeAreaView style={styles.loader} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <AdminPaneSkeleton rows={4} />
        <AdminText variant="caption" color={t.muted} style={styles.loaderHint}>
          Chargement Espace Admin…
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
      <AdminMotionProvider>
        <OpsDeskInner
          onPreviewUserApp={onPreviewUserApp}
          onPreviewPresidentPole={onPreviewPresidentPole}
        />
      </AdminMotionProvider>
    </AdminDataProvider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ADMIN_TOKENS.bg },
  safe: { flex: 1 },
  row: { flex: 1, flexDirection: 'row' },
  main: { flex: 1, backgroundColor: ADMIN_TOKENS.bg, minWidth: 0 },
  content: { flex: 1, minWidth: 0 },
  contentWide: {
    width: '100%',
    maxWidth: adminChrome.contentMax,
    alignSelf: 'center',
  },
  loader: {
    flex: 1,
    backgroundColor: ADMIN_TOKENS.bg,
  },
  loaderHint: {
    textAlign: 'center',
    paddingBottom: adminSpace.xl,
  },
});
