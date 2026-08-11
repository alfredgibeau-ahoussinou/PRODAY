import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { ProDayText } from '../components/ui/ProDayText';
import { Icon, type IconName } from '../components/ui/Icon';
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
import { SubscriptionShell } from '../components/subscription/SubscriptionShell';
import { useSessionProfile } from '../hooks/useSessionProfile';
import {
  ParentShellContext,
  type ParentTabId,
} from './parentShellContext';

export type { ParentTabId } from './parentShellContext';
export { useParentShell } from './parentShellContext';

const TABS: { id: ParentTabId; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Accueil', icon: 'home' },
  { id: 'profil', label: 'Profil', icon: 'person' },
  { id: 'messages', label: 'Messages', icon: 'chat' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  { id: 'trajet', label: 'Trajet', icon: 'car' },
  { id: 'reglages', label: 'Réglages', icon: 'settings' },
];

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
  const [activeTab, setActiveTab] = useState<ParentTabId>('home');
  const [children, setChildren] = useState<ParentChildBundle[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        if (prev && list.some((c) => c.uid === prev)) return prev;
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
    () => children.find((c) => c.uid === selectedUid) ?? children[0] ?? null,
    [children, selectedUid],
  );

  const ctxValue = useMemo(
    () => ({
      children,
      selected,
      setSelectedUid: (uid: string) => setSelectedUid(uid),
      reload,
      loading,
    }),
    [children, selected, reload, loading],
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
      case 'profil':
        screen = <ParentChildProfileScreen />;
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
    }
  }

  return (
    <ParentShellContext.Provider value={ctxValue}>
      <SafeAreaView
        style={[styles.root, rootStyle, { backgroundColor: c.background }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar style="light" />
        <View style={styles.header}>
          <View>
            <ProDayText variant="caption" muted>
              Pôle Parent
            </ProDayText>
            <ProDayText variant="section">Pro Day Parent</ProDayText>
          </View>
          {selected ? (
            <Pressable
              onPress={() => setActiveTab('profil')}
              style={[styles.childPill, { borderColor: c.brand, backgroundColor: c.brandSoft }]}
            >
              <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
                {selected.display_name}
              </ProDayText>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.content}>{screen}</View>
        <SafeAreaView
          edges={['bottom']}
          style={[styles.tabBar, { borderTopColor: c.border, backgroundColor: c.surface }]}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={styles.tabItem}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Icon name={tab.icon} size={20} color={active ? c.brand : c.textMuted} />
                <ProDayText
                  variant="caption"
                  style={{
                    color: active ? c.brand : c.textMuted,
                    fontWeight: active ? '700' : '500',
                    fontSize: 10,
                  }}
                >
                  {tab.label}
                </ProDayText>
              </Pressable>
            );
          })}
        </SafeAreaView>
      </SafeAreaView>
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
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.xs,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
});
