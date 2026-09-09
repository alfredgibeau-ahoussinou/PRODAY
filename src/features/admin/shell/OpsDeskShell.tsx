import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminDataProvider, useAdminData } from '../data/AdminDataContext';
import { AdminGateScreen } from '../screens/AdminGateScreen';
import { OpsDeskRail } from './OpsDeskRail';
import { OpsDeskStrip } from './OpsDeskStrip';
import { renderAdminPane } from './renderAdminPane';
import { AdminCommandPalette } from '../ui/AdminCommandPalette';
import { AdminText } from '../ui/adminUi';
import { useIsAdmin } from '../../../hooks/useIsAdmin';
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

interface OpsDeskShellProps {
  onPreviewUserApp: () => void;
  onPreviewPresidentPole?: () => void;
}

function OpsDeskInner({ onPreviewUserApp, onPreviewPresidentPole }: OpsDeskShellProps) {
  const data = useAdminData();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const expandedRail = width >= adminChrome.tabletBreakpoint;
  const { recordNav, navDirection } = useAdminMotion();

  const [section, setSection] = useState<AdminNavSectionId>('pulse');
  const [focusId, setFocusId] = useState<string | undefined>();
  const [commandOpen, setCommandOpen] = useState(false);
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

  const pane = useMemo(
    () =>
      renderAdminPane({
        section,
        focusId,
        onNavigate: navigate,
        onPreviewUserApp,
        onPreviewPresidentPole,
        onOpenCommand: openCommand,
      }),
    [section, focusId, navigate, onPreviewUserApp, onPreviewPresidentPole, openCommand],
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['right']}>
        <View style={styles.row}>
          <OpsDeskRail
            activeId={section}
            onSelect={(id) => navigate(id)}
            onOpenCommand={openCommand}
            compact={!expandedRail}
            queueCount={data.workQueue.length}
          />

          <View style={styles.main}>
            <OpsDeskStrip
              section={section}
              healthScore={data.health.score}
              actionCount={data.workQueue.length}
              topInset={expandedRail ? insets.top : 0}
              onOpenCommand={openCommand}
              onOpenPulse={() => navigate('pulse')}
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

      <AdminCommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={navigate}
      />
    </View>
  );
}

/**
 * Bureau Ops — shell fondateur.
 * Remplace AdminAppShell (dock 5 onglets + void graphite).
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
        <StatusBar style="dark" />
        <AdminPaneSkeleton rows={4} />
        <AdminText variant="caption" color={t.muted} style={styles.loaderHint}>
          Chargement du Bureau Ops…
        </AdminText>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.loader} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="dark" />
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
