import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CoachFutPlayerCard, FutPlayer } from './CoachFutPlayerCard';

interface CoachBenchDrawerProps {
  subs: FutPlayer[];
  unselected: FutPlayer[];
  selectedStarterId: string | null;
  selectedBenchId: string | null;
  onSelectBenchPlayer: (player: FutPlayer) => void;
}

export const CoachBenchDrawer: React.FC<CoachBenchDrawerProps> = ({
  subs,
  unselected,
  selectedStarterId,
  selectedBenchId,
  onSelectBenchPlayer,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterTab, setFilterTab] = useState<'subs' | 'reserves'>('subs');

  const displayList = filterTab === 'subs' ? subs : unselected;

  return (
    <View style={styles.container}>
      {/* Drawer Header with Collapse Toggle */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.headerBar}
        onPress={() => setIsExpanded((prev) => !prev)}
      >
        <View style={styles.headerLeft}>
          <View style={styles.benchIconBadge}>
            <MaterialCommunityIcons name="seat-passenger" size={14} color="#C5A059" />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>Banc & Remplaçants</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{subs.length}</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              {selectedStarterId
                ? 'Sélectionnez un remplaçant pour l’associer au titulaire'
                : 'Glissez ou touchez un joueur pour permuter'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Feather
            name={isExpanded ? 'chevron-down' : 'chevron-up'}
            size={18}
            color="#8B8B9A"
          />
        </View>
      </TouchableOpacity>

      {/* Expanded Content Tray */}
      {isExpanded && (
        <View style={styles.bodyTray}>
          {/* Filter Pills */}
          <View style={styles.filterPillsRow}>
            <TouchableOpacity
              style={[styles.filterPill, filterTab === 'subs' && styles.filterPillActive]}
              onPress={() => setFilterTab('subs')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterTab === 'subs' && styles.filterPillTextActive,
                ]}
              >
                Remplaçants disponibles ({subs.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterPill, filterTab === 'reserves' && styles.filterPillActive]}
              onPress={() => setFilterTab('reserves')}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterTab === 'reserves' && styles.filterPillTextActive,
                ]}
              >
                Réserves & Infirmerie ({unselected.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Scroll of Compact FUT Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
          >
            {displayList.map((player) => {
              const isSelected = selectedBenchId === player.id;
              const isCandidateTarget = selectedStarterId !== null;

              return (
                <View key={player.id} style={styles.cardItemWrap}>
                  <CoachFutPlayerCard
                    player={player}
                    size="bench"
                    isSelected={isSelected}
                    isTarget={isCandidateTarget}
                    onPress={() => onSelectBenchPlayer(player)}
                  />
                  <View style={styles.benchStatusBadge}>
                    <Text
                      style={[
                        styles.benchStatusText,
                        player.rsvp === 'present' && { color: '#30D158' },
                        player.rsvp === 'pending' && { color: '#FF9F0A' },
                        player.rsvp === 'injured' && { color: '#BF5AF2' },
                      ]}
                    >
                      {player.rsvp === 'present'
                        ? 'Dispo'
                        : player.rsvp === 'injured'
                        ? 'Blessé'
                        : 'Attente'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141418',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#181820',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  benchIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  countBadge: {
    backgroundColor: '#C5A059',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  headerSubtitle: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  headerRight: {
    paddingLeft: 8,
  },
  bodyTray: {
    paddingVertical: 10,
    backgroundColor: '#141418',
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#1C1C24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterPillActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    borderColor: '#C5A059',
  },
  filterPillText: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  filterPillTextActive: {
    color: '#C5A059',
    fontWeight: '700',
  },
  cardsScroll: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 12,
  },
  cardItemWrap: {
    alignItems: 'center',
    gap: 4,
  },
  benchStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  benchStatusText: {
    fontSize: 8.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
});
