import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MAIN_TABS, type MainTabId } from './src/navigation/MainTabs';
import { TabNavigationProvider } from './src/context/TabNavigationContext';
import { AuthProvider } from './src/context/AuthContext';
import { Icon, type IconName } from './src/components/ui/Icon';
import { colors, spacing } from './src/theme/designTokens';

const TAB_CONFIG: Record<
  MainTabId,
  { icon: IconName; label: string; badge?: number }
> = {
  home: { icon: 'home', label: 'Accueil' },
  recrutement: { icon: 'search', label: 'Recrutement' },
  matchs: { icon: 'calendar', label: 'Matchs' },
  messages: { icon: 'chat', label: 'Messages' },
  profil: { icon: 'person', label: 'Profil' },
};

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabId>('recrutement');
  const current = MAIN_TABS.find((t) => t.id === activeTab)!;
  const Screen = current.screen;

  return (
    <AuthProvider>
      <TabNavigationProvider value={{ activeTab, setActiveTab }}>
        <SafeAreaView style={styles.root}>
          <StatusBar style="dark" />
          <View style={styles.screen}>
            <Screen />
          </View>
          <View style={styles.tabBar}>
            {MAIN_TABS.map((tab) => {
              const active = tab.id === activeTab;
              const cfg = TAB_CONFIG[tab.id];
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <View style={styles.iconWrap}>
                    <Icon
                      name={cfg.icon}
                      size={22}
                      color={active ? colors.brand : colors.textMuted}
                    />
                    {cfg.badge != null && cfg.badge > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{cfg.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {cfg.label}
                  </Text>
                  {active && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </TabNavigationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  tabItem: { flex: 1, alignItems: 'center', position: 'relative' },
  iconWrap: { position: 'relative', height: 26, justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: colors.brand,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  tabLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  tabLabelActive: { color: colors.brand, fontWeight: '700' },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brand,
  },
});
