import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface ProDayBottomTabBarProps {
  activeTab: MainTabId;
  onTabPress: (tab: MainTabId) => void;
  unreadCount?: number;
}

interface NavDestination {
  id: MainTabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

export const ProDayBottomTabBar: React.FC<ProDayBottomTabBarProps> = ({
  activeTab,
  onTabPress,
  unreadCount = 0,
}) => {
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const { width } = useWindowDimensions();

  const role = profile?.role || 'player';
  const isPlayer = role === 'player';

  // Définition des 4 destinations exactes selon le tableau de la section 0.2
  const destinations: NavDestination[] = React.useMemo(() => {
    if (role === 'coach') {
      return [
        { id: 'home', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
        { id: 'matchs', label: 'Calendrier', icon: 'calendar-outline', iconActive: 'calendar' },
        { id: 'recrutement', label: 'Équipe', icon: 'people-outline', iconActive: 'people' },
        { id: 'plus', label: 'Menu', icon: 'grid-outline', iconActive: 'grid' },
      ];
    }
    if (role === 'club') {
      return [
        { id: 'home', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
        { id: 'matchs', label: 'Calendrier', icon: 'calendar-outline', iconActive: 'calendar' },
        { id: 'recrutement', label: 'Équipes', icon: 'shield-outline', iconActive: 'shield' },
        { id: 'plus', label: 'Menu', icon: 'grid-outline', iconActive: 'grid' },
      ];
    }
    if (role === 'parent') {
      return [
        { id: 'home', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
        { id: 'matchs', label: 'Calendrier', icon: 'calendar-outline', iconActive: 'calendar' },
        { id: 'famille', label: 'Enfants', icon: 'heart-outline', iconActive: 'heart' },
        { id: 'plus', label: 'Menu', icon: 'grid-outline', iconActive: 'grid' },
      ];
    }
    // Joueur par défaut (inspiré de Fitness Park)
    return [
      { id: 'home', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
      { id: 'matchs', label: 'Calendrier', icon: 'calendar-outline', iconActive: 'calendar' },
      { id: 'profil', label: 'Ma Carte', icon: 'card-outline', iconActive: 'card' },
      { id: 'plus', label: 'Menu', icon: 'grid-outline', iconActive: 'grid' },
    ];
  }, [role]);

  const handlePress = (tabId: MainTabId) => {
    prodayHaptics.tabSwitch();
    onTabPress(tabId);
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: isPlayer ? '#0F172A' : '#FFFFFF',
          borderTopColor: isPlayer ? '#1E293B' : '#E2E8F0',
        },
      ]}
    >
      <View style={styles.barContainer}>
        {destinations.map((dest) => {
          const isActive = activeTab === dest.id;
          const showBadge = dest.id === 'plus' && unreadCount > 0;

          return (
            <TouchableOpacity
              key={dest.id}
              onPress={() => handlePress(dest.id)}
              style={styles.tabItem}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={dest.label}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name={isActive ? dest.iconActive : dest.icon}
                  size={22}
                  color={
                    isActive
                      ? isPlayer
                        ? '#00F59B'
                        : '#0F172A'
                      : isPlayer
                        ? '#94A3B8'
                        : '#64748B'
                  }
                />
                {showBadge ? (
                  <View style={styles.badgeDot} />
                ) : null}
              </View>

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive
                      ? isPlayer
                        ? '#00F59B'
                        : '#0F172A'
                      : isPlayer
                        ? '#94A3B8'
                        : '#64748B',
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {dest.label}
              </Text>

              {/* Barre indicatrice sous l'onglet actif (style Apple/Fitness Park) */}
              {isActive ? (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: isPlayer ? '#00F59B' : '#0F172A' },
                  ]}
                />
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },
  barContainer: {
    flexDirection: 'row',
    height: 60,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    width: 28,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.2,
    fontFamily: Platform.select({
      ios: 'System',
      default: undefined,
    }),
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 16,
    height: 3,
    borderRadius: 1.5,
  },
  badgeDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});
