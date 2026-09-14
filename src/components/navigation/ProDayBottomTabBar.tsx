import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import type { MainTabId } from '../../navigation/mainTabConfig';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { FITNESS_PARK } from '../../theme/fitnessParkTheme';
import { PlayerQrPassModal } from '../player/PlayerQrPassModal';

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
  const [showQrModal, setShowQrModal] = useState(false);

  const role = profile?.role || 'player';
  const isPlayer = role === 'player';

  // Définition des 4 destinations exactes selon le style Fitness Park
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
    // Joueur officiel Fitness Park (Accueil, Training, [QR PASS], Ma Carte, Moi)
    return [
      { id: 'home', label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
      { id: 'matchs', label: 'Training', icon: 'barbell-outline', iconActive: 'barbell' },
      { id: 'profil', label: 'Ma Carte', icon: 'card-outline', iconActive: 'card' },
      { id: 'plus', label: 'Moi', icon: 'person-outline', iconActive: 'person' },
    ];
  }, [role]);

  const handlePress = (tabId: MainTabId) => {
    prodayHaptics.tabSwitch();
    onTabPress(tabId);
  };

  const handleCenterPress = () => {
    prodayHaptics.impactHeavy();
    setShowQrModal(true);
  };

  const renderTab = (dest: NavDestination) => {
    const isActive = activeTab === dest.id;
    const showBadge = dest.id === 'plus' && unreadCount > 0;
    const activeColor = FITNESS_PARK.accentYellow;
    const inactiveColor = FITNESS_PARK.textMuted;

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
            color={isActive ? activeColor : inactiveColor}
          />
          {showBadge ? <View style={styles.badgeDot} /> : null}
        </View>

        <Text
          style={[
            styles.tabLabel,
            {
              color: isActive ? activeColor : inactiveColor,
              fontWeight: isActive ? '800' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {dest.label}
        </Text>

        {isActive ? (
          <View
            style={[
              styles.activeIndicator,
              { backgroundColor: activeColor },
            ]}
          />
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: FITNESS_PARK.dockBg,
          borderTopColor: FITNESS_PARK.dockBorder,
        },
      ]}
    >
      <View style={styles.barContainer}>
        {/* Tab 1: Accueil */}
        {renderTab(destinations[0])}

        {/* Tab 2: Training / Calendrier */}
        {renderTab(destinations[1])}

        {/* Bouton Central Jaune Fitness Park (QR Pass / Accès Dématérialisé) */}
        <TouchableOpacity
          style={styles.centerQrWrap}
          activeOpacity={0.85}
          onPress={handleCenterPress}
          accessibilityRole="button"
          accessibilityLabel="Mon Pass QR"
        >
          <View style={styles.centerQrCircle}>
            <MaterialCommunityIcons
              name="qrcode-scan"
              size={26}
              color={FITNESS_PARK.dockCenterIcon}
            />
          </View>
        </TouchableOpacity>

        {/* Tab 3: Ma Carte / Équipe */}
        {renderTab(destinations[2])}

        {/* Tab 4: Moi / Menu */}
        {renderTab(destinations[3])}
      </View>

      {/* Modal du Pass Adhérent Dématérialisé */}
      <PlayerQrPassModal
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    borderTopWidth: 1,
    elevation: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: -4 },
  },
  barContainer: {
    flexDirection: 'row',
    height: 60,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
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
    bottom: 0,
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
  centerQrWrap: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    zIndex: 10,
  },
  centerQrCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: FITNESS_PARK.accentYellow,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: FITNESS_PARK.bg,
    ...Platform.select({
      ios: {
        shadowColor: FITNESS_PARK.accentYellow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
