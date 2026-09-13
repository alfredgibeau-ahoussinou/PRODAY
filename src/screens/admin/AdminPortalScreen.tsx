import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { AnimatedRouteContent } from '../../components/motion';
import { AdminHomeScreen } from './AdminHomeScreen';
import { AdminStaffScreen } from './AdminStaffScreen';
import { AdminSystemScreen } from './AdminSystemScreen';

export type AdminTabId = 'cockpit' | 'staff' | 'system';

interface AdminPortalScreenProps {
  initialTab?: AdminTabId;
}

export const AdminPortalScreen: React.FC<AdminPortalScreenProps> = ({
  initialTab = 'cockpit',
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<AdminTabId>(initialTab);

  const tabs: { id: AdminTabId; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'cockpit', label: 'Cockpit Club', icon: 'stats-chart' },
    { id: 'staff', label: 'Staff & Équipes', icon: 'people' },
    { id: 'system', label: 'Système & Kill-Switch', icon: 'construct' },
  ];

  const handleTabSelect = (tabId: AdminTabId) => {
    if (tabId === activeTab) return;
    prodayHaptics.selection();
    setActiveTab(tabId);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'cockpit':
        return <AdminHomeScreen />;
      case 'staff':
        return <AdminStaffScreen />;
      case 'system':
        return <AdminSystemScreen />;
      default:
        return <AdminHomeScreen />;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Apple Segmented Pill Rail */}
      <View style={styles.railContainer}>
        <View style={styles.pillRail}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => handleTabSelect(tab.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isActive ? '#000000' : '#94A3B8'}
                />
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Cross-Fade Animated Body */}
      <View style={styles.body}>
        <AnimatedRouteContent
          routeKey={activeTab}
          routeOrder={tabs.map((t) => t.id)}
        >
          {renderContent()}
        </AnimatedRouteContent>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0E',
  },
  railContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  pillRail: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 16,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#000000',
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
});
