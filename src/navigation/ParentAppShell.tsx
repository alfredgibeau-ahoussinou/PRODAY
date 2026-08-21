import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
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
} from '../features/parent/navigation/parentNavConfig';
import { ParentTabBar } from '../features/parent/shell/ParentTabBar';
import { ParentShellNavProvider } from '../features/parent/shell/ParentShellNavContext';
import { PaneTransition, useShellNavDirection } from '../motion';

const PARENT_MOTION_ORDER = [
  ...PARENT_PRIMARY_TABS.map((t) => t.id),
  ...PARENT_MENU_TOOLS.map((t) => t.id),
] as const;

export type { ParentTabId } from './parentShellContext';
export { useParentShell } from './parentShellContext';

/**
 * Shell Pôle Parent — 5 onglets (Accueil, Enfant, Guide IA, Menu, Profil).
 * Style volontairement simple, aligné sur le dock Coach.
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
  const { direction, noteNav } = useShellNavDirection(PARENT_MOTION_ORDER);
  const [activeTab, setActiveTabRaw] = useState<ParentTabId>('home');
  const [children, setChildren] = useState<ParentChildBundle[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveTab = useCallback((tab: ParentTabId) => {
    const next = canonicalizeParentNav(tab);
    noteNav(next);
    setActiveTabRaw(next);
  }, [noteNav]);

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
      <ParentShellNavProvider requestNav={setActiveTab}>
        <SafeAreaView
          style={[styles.root, rootStyle, { backgroundColor: c.background }]}
          edges={['top', 'left', 'right']}
        >
          <StatusBar style="light" />
          <View style={styles.header}>
            <View>
              <ProDayText variant="caption" muted>
                Parent
              </ProDayText>
              <ProDayText variant="section">Pro Day</ProDayText>
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
          <View style={styles.content}>
            <PaneTransition sectionKey={activeTab} direction={direction} context="tab">
              {screen}
            </PaneTransition>
          </View>
          <ParentTabBar
            items={PARENT_PRIMARY_TABS}
            activeId={activeTab}
            onSelect={setActiveTab}
          />
        </SafeAreaView>
      </ParentShellNavProvider>
    </ParentShellContext.Provider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
