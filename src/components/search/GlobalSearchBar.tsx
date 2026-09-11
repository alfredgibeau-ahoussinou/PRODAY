import React from 'react';
import { StyleSheet, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../motion';
import { ELITE_COLORS, ELITE_RADIUS } from '../../theme/prodayEliteTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface GlobalSearchBarProps {
  onPress: () => void;
  accent?: string;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

/**
 * Barre de recherche universelle ProDay
 * Design obsidian sombre, réactive au toucher avec retour haptique
 */
export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onPress,
  accent = ELITE_COLORS.pitchGreen,
  placeholder = 'Rechercher joueur, page, club...',
  style,
  compact = false,
}) => {
  return (
    <PressableSpring
      onPress={() => {
        prodayHaptics.press();
        onPress();
      }}
      scaleTo={0.98}
      style={[styles.container, compact && styles.containerCompact, style]}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir la recherche universelle"
      accessibilityHint="Recherchez des joueurs, des pages, des clubs et des fonctionnalités"
    >
      <View style={styles.innerRow}>
        <View style={[styles.searchIconHolder, { backgroundColor: `${accent}15` }]}>
          <Ionicons name="search" size={16} color={accent} />
        </View>

        <Text style={styles.placeholderText} numberOfLines={1}>
          {placeholder}
        </Text>

        <View style={styles.shortcutBadge}>
          <Ionicons name="sparkles" size={12} color={accent} />
          <Text style={styles.shortcutText}>Tout</Text>
        </View>
      </View>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F131C',
    borderRadius: ELITE_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  containerCompact: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: ELITE_RADIUS.sm,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchIconHolder: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    flex: 1,
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  shortcutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: ELITE_RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shortcutText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
});
