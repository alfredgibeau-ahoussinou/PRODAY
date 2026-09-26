import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ProDayText } from '../components/ui/ProDayText';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { spacing, radius } from '../theme/designTokens';
import {
  parentPortalService,
  type ParentChildBundle,
} from '../services/parentPortal.service';
import { ParentHomeScreen } from '../screens/parent/ParentHomeScreen';
import { ParentChildProfileScreen } from '../screens/parent/ParentChildProfileScreen';
import { ParentMessagesScreen } from '../screens/parent/ParentMessagesScreen';
import { ParentAgendaScreen } from '../screens/parent/ParentAgendaScreen';
import { ParentCarpoolScreen } from '../screens/parent/ParentCarpoolScreen';
import { ParentSettingsScreen } from '../screens/parent/ParentSettingsScreen';
import { ParentGuideScreen } from '../screens/parent/ParentGuideScreen';
import { ParentMenuScreen } from '../screens/parent/ParentMenuScreen';
import { SubscriptionShell } from '../components/subscription/SubscriptionShell';
import { useSessionProfile } from '../hooks/useSessionProfile';
import {
  ParentShellContext,
  type ParentTabId,
} from './parentShellContext';
import {
  PARENT_PRIMARY_TABS,
  PARENT_MENU_TOOLS,
  canonicalizeParentNav,
  resolveParentFallbackNav,
} from '../features/parent/navigation/parentNavConfig';
import { AppBackButton } from '../components/ui/AppBackButton';
import { ParentTabBar } from '../features/parent/shell/ParentTabBar';
import { ParentSidebar } from '../features/parent/shell/ParentSidebar';
import { ParentShellNavProvider } from '../features/parent/shell/ParentShellNavContext';
import { parentChrome } from '../features/parent/theme/parentDesignSystem';
import { PaneTransition, useShellNavDirection } from '../motion';

const PARENT_MOTION_ORDER = [
  ...PARENT_PRIMARY_TABS.map((t) => t.id),
  ...PARENT_MENU_TOOLS.map((t) => t.id),
] as const;

export type { ParentTabId } from './parentShellContext';
export { useParentShell } from './parentShellContext';

/**
 * Shell Pôle Parent — dock mobile 5 onglets · sidebar + contenu borné dès 900px.
 */
export const ParentAppShell: React.FC = () => {
  const profile = useSessionProfile();
  if (!profile) return null;
  return (
    <SubscriptionShell profile={profile}>
      <ParentAppShellInner />
    </SubscriptionShell>
  );
};

const ParentAppShellInner: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { colors: c, rootStyle } = useThemedScreen();
  const { width } = useWindowDimensions();
  const wide = width >= parentChrome.wideBreakpoint;
  const { direction, noteNav } = useShellNavDirection(PARENT_MOTION_ORDER);
  const [activeTab, setActiveTabRaw] = useState<ParentTabId>('home');
  const [history, setHistory] = useState<ParentTabId[]>([]);
  const [children, setChildren] = useState<ParentChildBundle[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveTab = useCallback(
    (tab: ParentTabId, options?: { replace?: boolean; clearHistory?: boolean }) => {
      const next = canonicalizeParentNav(tab);
      const current = canonicalizeParentNav(activeTab);

      if (options?.clearHistory) {
        setHistory([]);
      } else if (options?.replace) {
        // do not append to history
      } else if (next !== current) {
        setHistory((prev) => [...prev.slice(-29), current]);
      }

      noteNav(next);
      setActiveTabRaw(next);
    },
    [activeTab, noteNav],
  );

  const fallback = resolveParentFallbackNav(activeTab);
  const hasFallback =
    canonicalizeParentNav(fallback) !== canonicalizeParentNav(activeTab);
  const canGoBack = history.length > 0 || hasFallback;

  const goBack = useCallback(() => {
    if (history.length > 0) {
      const previous = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      const next = canonicalizeParentNav(previous);
      noteNav(next);
      setActiveTabRaw(next);
      return;
    }
    const fb = resolveParentFallbackNav(activeTab);
    if (fb && canonicalizeParentNav(fb) !== canonicalizeParentNav(activeTab)) {
      const next = canonicalizeParentNav(fb);
      noteNav(next);
      setActiveTabRaw(next);
    }
  }, [history, activeTab, noteNav]);

  const reload = useCallback(async () => {
    if (!profile) {
      setChildren([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await parentPortalService.listLinkedChildren(profile);
      setChildren(list);
      setSelectedUid((prev) => {
        if (prev && list.some((child) => child.uid === prev)) return prev;
        return list[0]?.uid ?? null;
      });
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const selected = useMemo(
    () => children.find((child) => child.uid === selectedUid) ?? children[0] ?? null,
    [children, selectedUid],
  );

  const ctxValue = useMemo(
    () => ({
      children,
      selected,
      setSelectedUid: (uid: string) => setSelectedUid(uid),
      reload,
      loading,
      activeTab,
      setActiveTab,
    }),
    [children, selected, reload, loading, activeTab, setActiveTab],
  );

  let screen: React.ReactNode = null;
  if (loading && children.length === 0) {
    screen = (
      <View style={styles.center}>
        <ActivityIndicator color={c.brand} />
      </View>
    );
  } else {
    switch (activeTab) {
      case 'home':
        screen = <ParentHomeScreen onOpenTab={setActiveTab} />;
        break;
      case 'enfant':
        screen = <ParentChildProfileScreen />;
        break;
      case 'guide':
        screen = <ParentGuideScreen />;
        break;
      case 'plus':
        screen = <ParentMenuScreen />;
        break;
      case 'messages':
        screen = <ParentMessagesScreen />;
        break;
      case 'agenda':
        screen = <ParentAgendaScreen />;
        break;
      case 'trajet':
        screen = <ParentCarpoolScreen />;
        break;
      case 'reglages':
        screen = <ParentSettingsScreen onSignOut={signOut} />;
        break;
      default:
        screen = <ParentHomeScreen onOpenTab={setActiveTab} />;
    }
  }

  return (
    <ParentShellContext.Provider value={ctxValue}>
      <ParentShellNavProvider
        history={history}
        canGoBack={canGoBack}
        goBack={goBack}
        requestNav={setActiveTab}
      >
        <SafeAreaView
          style={[
            styles.root,
            rootStyle,
            { backgroundColor: c.background },
            wide ? styles.rootWide : null,
          ]}
          edges={['top', 'left', 'right']}
        >
          <StatusBar style="light" />
          {wide ? (
            <ParentSidebar
              activeId={activeTab}
              parentName={profile?.display_name ?? 'Parent'}
              onSelect={setActiveTab}
              onSignOut={() => void signOut()}
            />
          ) : null}
          <View style={styles.main}>
            {!wide ? (
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  {canGoBack || activeTab !== 'home' ? (
                    <AppBackButton
                      onPress={goBack}
                      fallbackNavId="home"
                      style={styles.headerBackBtn}
                    />
                  ) : null}
                  <View>
                    <ProDayText variant="caption" muted>
                      Parent
                    </ProDayText>
                    <ProDayText variant="section">Pro Day</ProDayText>
                  </View>
                </View>
                {selected ? (
                  <Pressable
                    onPress={() => setActiveTab('enfant')}
                    style={[styles.childPill, { borderColor: c.brand, backgroundColor: c.brandSoft }]}
                  >
                    <ProDayText variant="caption" accent style={{ fontWeight: '700' }}>
                      {selected.display_name}
                    </ProDayText>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            <View
              style={[
                styles.content,
                wide
                  ? { maxWidth: parentChrome.contentMaxWidth, width: '100%', alignSelf: 'center' }
                  : null,
              ]}
            >
              <PaneTransition sectionKey={activeTab} direction={direction} context="tab">
                {React.isValidElement(screen) ? screen : null}
              </PaneTransition>
            </View>
            {!wide ? (
              <ParentTabBar
                items={PARENT_PRIMARY_TABS}
                activeId={activeTab}
                onSelect={setActiveTab}
              />
            ) : null}
          </View>
        </SafeAreaView>
      </ParentShellNavProvider>
    </ParentShellContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootWide: { flexDirection: 'row' },
  main: { flex: 1, minWidth: 0 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerBackBtn: {
    marginRight: 2,
  },
  childPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  content: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
