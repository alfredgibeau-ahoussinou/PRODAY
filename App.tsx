import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MAIN_TABS, type MainTabId } from './src/navigation/MainTabs';
import { TabNavigationProvider } from './src/context/TabNavigationContext';
import { AuthProvider } from './src/context/AuthContext';
import { colors, spacing } from './src/theme/designTokens';

const TAB_CONFIG: Record<MainTabId, { icon: string; label: string }> = {
  home: { icon: '🏠', label: 'Accueil' },
  recrutement: { icon: '🔍', label: 'Recrutement' },
  matchs: { icon: '🤝', label: 'Matchs' },
  messages: { icon: '💬', label: 'Messages' },
  profil: { icon: '👤', label: 'Profil' },
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
                <Text style={[styles.tabIcon, active && styles.tabIconActive]}>
                  {cfg.icon}
                </Text>
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
  tabIcon: { fontSize: 22, opacity: 0.45 },
  tabIconActive: { opacity: 1 },
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
