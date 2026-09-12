import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { CoachStandingsTable } from '../../components/coach/CoachStandingsTable';

interface Props {
  onNavigate?: (navId: string) => void;
  onOpenMatch?: (matchId: string) => void;
}

export const CoachHomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showAiInsight, setShowAiInsight] = useState(false);
  const [showStandings, setShowStandings] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C5A059" />
      }
    >
      {/* 1. Header: Apple Breathing Identity */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.clubBadge}>
            <MaterialCommunityIcons name="shield-crown" size={20} color="#C5A059" />
          </View>
          <View>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryTag}>FFF R1 · POULE B</Text>
              <Text style={styles.seasonTag}>SAISON 2026/2027</Text>
            </View>
            <Text style={styles.teamTitle}>FC ProDay Seniors 1</Text>
            <Text style={styles.coachSubtitle}>Entraîneur Principal · Staff Technique</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerActionBtn}
          onPress={() => onNavigate?.('com_staff')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-group-outline" size={18} color="#C5A059" />
        </TouchableOpacity>
      </View>

      {/* 2. Hero Centerpiece: Match Countdown & Attendance Glance */}
      <View style={styles.heroCard}>
        {/* Top Tag & Countdown */}
        <View style={styles.heroTopRow}>
          <View style={styles.matchBadge}>
            <MaterialCommunityIcons name="trophy-variant" size={12} color="#0A84FF" />
            <Text style={styles.matchBadgeText}>CHAMPIONNAT R1 · J17</Text>
          </View>
          <View style={styles.countdownBadge}>
            <Feather name="clock" size={12} color="#FFFFFF" />
            <Text style={styles.countdownText}>Dimanche · 15:00 (J-2)</Text>
          </View>
        </View>

        {/* Fixture Teams Presentation */}
        <View style={styles.fixtureRow}>
          <View style={styles.fixtureTeam}>
            <View style={[styles.teamAvatar, styles.homeAvatar]}>
              <Text style={styles.teamAvatarText}>FCP</Text>
            </View>
            <Text numberOfLines={1} style={styles.fixtureTeamName}>FC ProDay</Text>
            <Text style={styles.fixtureTeamRank}>1er · 38 pts</Text>
          </View>

          <View style={styles.fixtureCenter}>
            <Text style={styles.fixtureVs}>VS</Text>
            <View style={styles.homeStatusPill}>
              <Text style={styles.homeStatusText}>À domicile</Text>
            </View>
          </View>

          <View style={styles.fixtureTeam}>
            <View style={[styles.teamAvatar, styles.awayAvatar]}>
              <Text style={styles.teamAvatarText}>RCF</Text>
            </View>
            <Text numberOfLines={1} style={styles.fixtureTeamName}>RC France</Text>
            <Text style={styles.fixtureTeamRank}>2e · 35 pts</Text>
          </View>
        </View>

        {/* Location & Attendance Summary */}
        <View style={styles.attendanceBar}>
          <View style={styles.attendanceItem}>
            <Ionicons name="location-outline" size={13} color="#8B8B9A" />
            <Text style={styles.attendanceText}>Stade d’Honneur</Text>
          </View>
          <View style={styles.barDivider} />
          <View style={styles.attendanceItem}>
            <Ionicons name="checkmark-circle" size={13} color="#30D158" />
            <Text style={[styles.attendanceText, { color: '#30D158' }]}>16 Présents</Text>
          </View>
          <View style={styles.barDivider} />
          <View style={styles.attendanceItem}>
            <Ionicons name="time-outline" size={13} color="#FF9F0A" />
            <Text style={[styles.attendanceText, { color: '#FF9F0A' }]}>2 En attente</Text>
          </View>
        </View>

        {/* Foot à 11 Starting XI Lineup Glance */}
        <View style={styles.lineupPreviewBox}>
          <View style={styles.lineupPreviewHeader}>
            <View style={styles.lineupPreviewHeaderLeft}>
              <MaterialCommunityIcons name="shield-check" size={13} color="#30D158" />
              <Text style={styles.lineupPreviewTitle}>COMPOSITION DU MATCH · 4-3-3</Text>
            </View>
            <View style={styles.lineupCountBadge}>
              <Text style={styles.lineupCountText}>11 Titulaires Prêts</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lineupChipsScroll}>
            {[
              { num: 1, name: 'Lloris', pos: 'GK', ovr: 86 },
              { num: 3, name: 'Saliba', pos: 'LB', ovr: 82 },
              { num: 4, name: 'Pogba', pos: 'CB', ovr: 87 },
              { num: 5, name: 'Diallo', pos: 'CB', ovr: 83 },
              { num: 2, name: 'Badé', pos: 'RB', ovr: 81 },
              { num: 8, name: 'Ruiz', pos: 'CM', ovr: 85 },
              { num: 6, name: 'Doué', pos: 'CDM', ovr: 84 },
              { num: 10, name: 'Cherki', pos: 'CM', ovr: 88 },
              { num: 11, name: 'Tel', pos: 'LW', ovr: 83 },
              { num: 9, name: 'Benali', pos: 'ST', ovr: 89 },
              { num: 7, name: 'Mbeumo', pos: 'RW', ovr: 84 },
            ].map((p) => (
              <View key={p.num} style={styles.starterChip}>
                <View style={[styles.starterPosBadge, p.pos === 'GK' && { backgroundColor: '#FF9F0A' }]}>
                  <Text style={styles.starterPosText}>{p.pos}</Text>
                </View>
                <Text style={styles.starterChipName}>#{p.num} {p.name}</Text>
                <Text style={styles.starterChipOvr}>{p.ovr}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Single Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryCtaBtn}
          activeOpacity={0.88}
          onPress={() => onNavigate?.('equipe')}
        >
          <MaterialCommunityIcons name="soccer-field" size={18} color="#000000" />
          <Text style={styles.primaryCtaText}>Ajuster la Composition & Tactique</Text>
          <Feather name="arrow-right" size={16} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* 3. Discreet & Optional AI Tactical Assistant */}
      <View style={styles.aiDiscreetCard}>
        <TouchableOpacity
          style={styles.aiDiscreetHeader}
          activeOpacity={0.8}
          onPress={() => setShowAiInsight((prev) => !prev)}
        >
          <View style={styles.aiIconBadge}>
            <MaterialCommunityIcons name="star-four-points" size={14} color="#C5A059" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiPromptTitle}>Conseil Tactique IA (Optionnel)</Text>
            <Text style={styles.aiPromptPreview}>
              Système 4-3-3 étiré recommandé face au 3-5-2 de RC France
            </Text>
          </View>
          <Feather
            name={showAiInsight ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#8B8B9A"
          />
        </TouchableOpacity>

        {showAiInsight && (
          <View style={styles.aiExpandedTray}>
            <Text style={styles.aiExpandedBody}>
              L’analyse prédictive identifie une vulnérabilité adverse dans le dos des pistons lors des transitions défensives. Recommandation : attaques verticales directes sur les couloirs.
            </Text>
            <View style={styles.aiStatsRow}>
              <View style={styles.aiStatPill}>
                <Text style={styles.aiStatLabel}>Probabilité Victoire</Text>
                <Text style={[styles.aiStatVal, { color: '#30D158' }]}>58%</Text>
              </View>
              <View style={styles.aiStatPill}>
                <Text style={styles.aiStatLabel}>xG Prédit</Text>
                <Text style={styles.aiStatVal}>2.1 vs 1.2</Text>
              </View>
              <View style={styles.aiStatPill}>
                <Text style={styles.aiStatLabel}>Contrôle Manuel</Text>
                <Text style={[styles.aiStatVal, { color: '#0A84FF' }]}>100% Libre</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 4. Minimalist Quick Access Tiles */}
      <View style={styles.tilesGrid}>
        {/* Tile 1: Tableau Noir Multi-Format */}
        <TouchableOpacity
          style={styles.tileCard}
          activeOpacity={0.85}
          onPress={() => onNavigate?.('smart_tactics')}
        >
          <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
            <MaterialCommunityIcons name="draw-pen" size={20} color="#0A84FF" />
          </View>
          <Text style={styles.tileTitle}>Tableau Noir</Text>
          <Text style={styles.tileDesc}>Foot à 11, à 8, Futsal 5v5 & Animation</Text>
        </TouchableOpacity>

        {/* Tile 2: Séances & Schémas */}
        <TouchableOpacity
          style={styles.tileCard}
          activeOpacity={0.85}
          onPress={() => onNavigate?.('entrainements')}
        >
          <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
            <MaterialCommunityIcons name="whistle-outline" size={20} color="#30D158" />
          </View>
          <Text style={styles.tileTitle}>Entraînements</Text>
          <Text style={styles.tileDesc}>Schémas vectoriels & Ateliers visuels</Text>
        </TouchableOpacity>

        {/* Tile 3: Direct Match Center */}
        <TouchableOpacity
          style={styles.tileCard}
          activeOpacity={0.85}
          onPress={() => onNavigate?.('match_center')}
        >
          <View style={[styles.tileIconWrap, { backgroundColor: 'rgba(255, 159, 10, 0.15)' }]}>
            <MaterialCommunityIcons name="clipboard-play-outline" size={20} color="#FF9F0A" />
          </View>
          <Text style={styles.tileTitle}>Match Center</Text>
          <Text style={styles.tileDesc}>Chronomètre, Scoreur & Scouting vocal</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Live Standings Collapsible Section */}
      <View style={styles.standingsSection}>
        <TouchableOpacity
          style={styles.standingsHeader}
          activeOpacity={0.8}
          onPress={() => setShowStandings((prev) => !prev)}
        >
          <View style={styles.standingsHeaderLeft}>
            <MaterialCommunityIcons name="format-list-numbered" size={16} color="#C5A059" />
            <Text style={styles.standingsTitle}>Classement Officiel FFF R1</Text>
          </View>
          <Feather
            name={showStandings ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#8B8B9A"
          />
        </TouchableOpacity>

        {showStandings && (
          <View style={styles.standingsContainer}>
            <CoachStandingsTable compact={false} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(197, 160, 89, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  categoryTag: {
    color: '#C5A059',
    fontSize: 9,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
  },
  seasonTag: {
    color: '#8B8B9A',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  teamTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: -0.3,
  },
  coachSubtitle: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#16161C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: '#141418',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matchBadgeText: {
    color: '#0A84FF',
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  fixtureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 12,
  },
  fixtureTeam: {
    flex: 1,
    alignItems: 'center',
  },
  teamAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  homeAvatar: {
    backgroundColor: '#0A84FF',
  },
  awayAvatar: {
    backgroundColor: '#FF453A',
  },
  teamAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: '-apple-system',
  },
  fixtureTeamName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  fixtureTeamRank: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontFamily: '-apple-system',
  },
  fixtureCenter: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  fixtureVs: {
    color: '#8B8B9A',
    fontSize: 14,
    fontWeight: '900',
    fontFamily: '-apple-system',
    marginBottom: 4,
  },
  homeStatusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  homeStatusText: {
    color: '#8B8B9A',
    fontSize: 9,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  attendanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#181820',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendanceText: {
    color: '#8B8B9A',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  barDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  lineupPreviewBox: {
    backgroundColor: '#16161F',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.2)',
    padding: 10,
    marginBottom: 12,
  },
  lineupPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  lineupPreviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  lineupPreviewTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: '-apple-system',
    letterSpacing: 0.5,
  },
  lineupCountBadge: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  lineupCountText: {
    color: '#30D158',
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  lineupChipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  starterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E28',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  starterPosBadge: {
    backgroundColor: '#0A84FF',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  starterPosText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  starterChipName: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  starterChipOvr: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '800',
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C5A059',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryCtaText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  aiDiscreetCard: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.2)',
    padding: 12,
    marginBottom: 14,
  },
  aiDiscreetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiPromptTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  aiPromptPreview: {
    color: '#8B8B9A',
    fontSize: 10,
    fontFamily: '-apple-system',
    marginTop: 1,
  },
  aiExpandedTray: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  aiExpandedBody: {
    color: '#D0D0D8',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: '-apple-system',
    marginBottom: 10,
  },
  aiStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aiStatPill: {
    flex: 1,
    backgroundColor: '#181820',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  aiStatLabel: {
    color: '#8B8B9A',
    fontSize: 8.5,
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  aiStatVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  tilesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  tileCard: {
    flex: 1,
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    alignItems: 'flex-start',
  },
  tileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
    marginBottom: 2,
  },
  tileDesc: {
    color: '#8B8B9A',
    fontSize: 9.5,
    fontFamily: '-apple-system',
    lineHeight: 12,
  },
  standingsSection: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    overflow: 'hidden',
  },
  standingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  standingsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  standingsTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  standingsContainer: {
    marginTop: 10,
  },
});
